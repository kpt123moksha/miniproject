import {useState} from 'react';
import type {Complaint,User} from '../types';
import RiskBadge from '../components/RiskBadge';
import {verifyCleaning,updateComplaintStatus} from '../services/complaintService';

export default function ComplaintDetails({complaint,user,onBack,onUpdated}:{complaint:Complaint;user:User;onBack:()=>void;onUpdated:()=>void}) {
  const [feedback,setFeedback]=useState('');const [error,setError]=useState('');
  const photo=(path?:string)=>path?`http://localhost:5000${path}`:'';
  async function verify(resolved:boolean){
    try{await verifyCleaning(complaint.complaint_id,resolved,feedback);onUpdated();}
    catch(e){setError(e instanceof Error?e.message:'Could not send verification.');}
  }
  async function status(value:string){
    try{await updateComplaintStatus(complaint.complaint_id,value);onUpdated();}
    catch(e){setError(e instanceof Error?e.message:'Could not update status.');}
  }
  return <div className="page-content narrow">
    <button className="text-button back-button" onClick={onBack}>← Back to complaints</button>
    <div className="page-heading"><span className="eyebrow">COMPLAINT DETAILS</span><h1>Complaint #{complaint.complaint_id}</h1><p>{complaint.location_name}</p></div>
    <section className="panel details-panel">
      {complaint.photo_path&&<img className="detail-photo" src={photo(complaint.photo_path)} alt="Reported drainage location"/>}
      <div className="detail-row"><b>Current status</b><span>{complaint.status}</span></div>
      <div className="detail-row"><b>Risk assessment</b><RiskBadge category={complaint.risk_category} score={complaint.risk_score}/></div>
      <div className="detail-row"><b>Severity</b><span className="capitalize">{complaint.severity}</span></div>
      <div className="detail-row"><b>Ground elevation</b><span>{complaint.elevation_m==null?'Unavailable':`${complaint.elevation_m} m`}</span></div>
      <div className="detail-row"><b>Forecast rainfall</b><span>{complaint.forecast_rainfall_mm==null?'Unavailable':`${complaint.forecast_rainfall_mm} mm`}</span></div>
      <p className="description-block">{complaint.description}</p>
      {complaint.before_photo&&<div><b>Before cleaning</b><img className="evidence-photo" src={photo(complaint.before_photo)} alt="Before cleaning"/></div>}
      {complaint.after_photo&&<div><b>After cleaning</b><img className="evidence-photo" src={photo(complaint.after_photo)} alt="After cleaning"/></div>}
      {complaint.completion_description&&<p>{complaint.completion_description}</p>}
      {user.role==='citizen'&&complaint.status==='Cleaning Completed'&&<div className="verify-box">
        <h3>Was the problem resolved?</h3><textarea rows={3} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Optional feedback"/>
        <div className="button-row"><button className="button primary" onClick={()=>verify(true)}>Verify cleaning</button><button className="button secondary" onClick={()=>verify(false)}>Still unresolved</button></div>
      </div>}
      {user.role!=='citizen'&&<div className="verify-box"><h3>Update complaint status</h3>
        <select value={complaint.status} onChange={e=>status(e.target.value)}>
          {['Submitted','Under Review','Assigned','Cleaning in Progress','Cleaning Completed'].map(s=><option key={s}>{s}</option>)}
        </select></div>}
      {error&&<div className="error-message">{error}</div>}
    </section>
  </div>;
}
