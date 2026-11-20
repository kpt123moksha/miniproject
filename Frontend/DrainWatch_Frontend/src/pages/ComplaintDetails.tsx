import {useEffect,useState} from 'react';
import type {Complaint,User,Worker} from '../types';
import RiskBadge from '../components/RiskBadge';
import {
  assignWorker,confirmAuthority,getWorkers,rateCompletion,verifyCleaning
} from '../services/complaintService';

const API_ORIGIN=(import.meta.env.VITE_API_URL||'http://localhost:5000/api').replace(/\/api\/?$/,'');

export default function ComplaintDetails({complaint,user,onBack,onUpdated}:{complaint:Complaint;user:User;onBack:()=>void;onUpdated:()=>void}) {
  const [feedback,setFeedback]=useState('');
  const [rating,setRating]=useState(5);
  const [workers,setWorkers]=useState<Worker[]>([]);
  const [workerId,setWorkerId]=useState('');
  const [deadline,setDeadline]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const photo=(path?:string)=>path?`${API_ORIGIN}${path}`:'';
  const canAssign=['Submitted','Reopened','Assigned','Cleaning in Progress'].includes(complaint.status);

  useEffect(()=>{
    if(user.role==='authority'||user.role==='admin'){
      getWorkers().then(setWorkers).catch(e=>setError(e instanceof Error?e.message:'Could not load workers.'));
    }
  },[user.role]);

  async function run(action:()=>Promise<unknown>){
    setError('');setBusy(true);
    try{await action();onUpdated();}
    catch(e){setError(e instanceof Error?e.message:'Could not update this complaint.');}
    finally{setBusy(false);}
  }

  return <div className="page-content narrow">
    <button className="text-button back-button" onClick={onBack}>← Back to complaints</button>
    <div className="page-heading"><span className="eyebrow">COMPLAINT DETAILS</span><h1>Complaint #{complaint.complaint_id}</h1><p>{complaint.location_name||'Location not provided'}</p></div>
    <section className="panel details-panel">
      {complaint.photo_path&&<img className="detail-photo" src={photo(complaint.photo_path)} alt="Reported drainage location"/>}
      <div className="detail-row"><b>Current status</b><span>{complaint.status==='Cleaning Completed'
        ? complaint.authority_confirmed?'Awaiting citizen confirmation':'Awaiting authority confirmation'
        : complaint.status}</span></div>
      <div className="detail-row"><b>Risk assessment</b><RiskBadge category={complaint.risk_category} score={complaint.risk_score}/></div>
      <div className="detail-row"><b>Severity</b><span className="capitalize">{complaint.severity}</span></div>
      <div className="detail-row"><b>Location</b><span>{complaint.location_name||'Citizen location'} · {Number(complaint.latitude).toFixed(5)}, {Number(complaint.longitude).toFixed(5)}</span></div>
      <div className="detail-row"><b>Assigned worker</b><span>{complaint.worker_name||'Not assigned'}</span></div>
      <div className="detail-row"><b>Deadline</b><span>{complaint.deadline?new Date(complaint.deadline).toLocaleString():'Not set'}</span></div>
      <p className="description-block">{complaint.description}</p>
      {complaint.before_photo&&<div><b>Before cleaning</b><img className="evidence-photo" src={photo(complaint.before_photo)} alt="Before cleaning"/></div>}
      {complaint.after_photo&&<div><b>After cleaning</b><img className="evidence-photo" src={photo(complaint.after_photo)} alt="After cleaning"/></div>}
      {complaint.completion_description&&<p>{complaint.completion_description}</p>}

      {complaint.status==='Cleaning Completed'&&<section className="confirmation-status">
        <h3>Completion confirmations</h3>
        <div className="detail-row"><b>Authority</b><span>{complaint.authority_confirmed?'Confirmed':'Waiting for confirmation'}</span></div>
        <div className="detail-row"><b>Citizen</b><span>{complaint.citizen_confirmed?'Confirmed':complaint.authority_confirmed?'Waiting for your confirmation':'Waiting for authority'}</span></div>
      </section>}

      {(user.role==='authority'||user.role==='admin')&&canAssign&&<section className="verify-box">
        <h3>Assign this work</h3>
        {!workers.length&&<p className="muted">No workers are available. Add a worker before assigning this complaint.</p>}
        <label>Worker<select value={workerId} onChange={e=>setWorkerId(e.target.value)} required>
          <option value="">Select a worker</option>{workers.map(worker=><option key={worker.user_id} value={worker.user_id}>{worker.name}</option>)}
        </select></label>
        <label>Deadline<input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} required/></label>
        <button className="button primary" disabled={busy||!workerId||!deadline} onClick={()=>run(()=>assignWorker(complaint.complaint_id,Number(workerId),new Date(deadline).toISOString()))}>
          Assign work
        </button>
      </section>}

      {(user.role==='authority'||user.role==='admin')&&complaint.status==='Cleaning Completed'&&!complaint.authority_confirmed&&<section className="verify-box">
        <h3>Worker completion request</h3>
        <p>Review the complaint location and before/after photos, then confirm the work for the citizen.</p>
        <button className="button primary" disabled={busy} onClick={()=>run(()=>confirmAuthority(complaint.complaint_id))}>Confirm Completed</button>
      </section>}

      {user.role==='citizen'&&complaint.status==='Cleaning Completed'&&complaint.authority_confirmed&&<section className="verify-box">
        <h3>Has the work resolved the problem?</h3>
        <textarea rows={3} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Add a note (optional for confirmation)"/>
        <div className="button-row">
          <button className="button primary" disabled={busy} onClick={()=>run(()=>verifyCleaning(complaint.complaint_id,true,feedback))}>Confirm Work Completed</button>
          <button className="button secondary" disabled={busy} onClick={()=>run(()=>verifyCleaning(complaint.complaint_id,false,feedback))}>Problem Still Exists</button>
        </div>
      </section>}

      {user.role==='citizen'&&complaint.status==='Cleaning Completed'&&!complaint.authority_confirmed&&
        <p className="muted">The authority is reviewing the worker’s completion request. You can confirm after that review.</p>}

      {user.role==='citizen'&&complaint.status==='Verified'&&!complaint.citizen_rating&&<section className="verify-box">
        <h3>Rate the completed work</h3>
        <label>Rating
          <select value={rating} onChange={e=>setRating(Number(e.target.value))}>
            {[5,4,3,2,1].map(value=><option key={value} value={value}>{value} {value===1?'star':'stars'}</option>)}
          </select>
        </label>
        <textarea rows={3} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Share your feedback (optional)"/>
        <button className="button primary" disabled={busy} onClick={()=>run(()=>rateCompletion(complaint.complaint_id,rating,feedback))}>Submit rating</button>
      </section>}
      {complaint.citizen_rating&&<div className="success-message">Citizen rating: {complaint.citizen_rating}/5{complaint.citizen_feedback?` — ${complaint.citizen_feedback}`:''}</div>}
      {error&&<div className="error-message">{error}</div>}
    </section>
  </div>;
}
