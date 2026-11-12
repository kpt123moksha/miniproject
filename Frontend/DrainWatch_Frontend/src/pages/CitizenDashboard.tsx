import {useEffect,useState} from 'react';
import {PlusCircle,ClipboardList,CheckCircle2} from 'lucide-react';
import type {Complaint,User} from '../types';
import {getMyComplaints} from '../services/complaintService';
import ComplaintTable from '../components/ComplaintTable';

export default function CitizenDashboard({user,onReport,onComplaints,onSelect}:{user:User;onReport:()=>void;onComplaints:()=>void;onSelect:(c:Complaint)=>void}) {
  const [items,setItems]=useState<Complaint[]>([]);
  const [error,setError]=useState('');
  useEffect(()=>{getMyComplaints().then(setItems).catch(e=>setError(e.message));},[]);
  const completed=items.filter(c=>['Cleaning Completed','Verified'].includes(c.status)).length;
  return <div className="page-content">
    <section className="hero citizen-hero"><div><span className="eyebrow light">CITIZEN DASHBOARD</span>
      <h1>Hello, {user.name.split(' ')[0]}</h1><p>Help your local team keep drains clear and streets safer.</p>
      <button className="button white" onClick={onReport}><PlusCircle size={17}/> Report a problem</button>
    </div><div className="hero-symbol">⌖</div></section>
    <div className="stat-grid three">
      <div className="stat-card"><span>Total reports</span><b>{items.length}</b><ClipboardList/></div>
      <div className="stat-card"><span>In progress</span><b>{items.filter(c=>!['Cleaning Completed','Verified'].includes(c.status)).length}</b></div>
      <div className="stat-card"><span>Completed</span><b>{completed}</b><CheckCircle2/></div>
    </div>
    <div className="section-title"><div><h2>Recent complaints</h2><p>Track the progress of your reports.</p></div><button className="text-button" onClick={onComplaints}>View all →</button></div>
    {error&&<div className="error-message">{error}</div>}
    <ComplaintTable items={items.slice(0,5)} onSelect={onSelect}/>
  </div>;
}
