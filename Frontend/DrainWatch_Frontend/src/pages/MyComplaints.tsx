import {useEffect,useState} from 'react';
import type {Complaint,User} from '../types';
import {getAllComplaints,getMyComplaints} from '../services/complaintService';
import ComplaintTable from '../components/ComplaintTable';

export default function MyComplaints({user,onSelect}:{user:User;onSelect:(c:Complaint)=>void}) {
  const [items,setItems]=useState<Complaint[]>([]);const [error,setError]=useState('');
  useEffect(()=>{(user.role==='citizen'?getMyComplaints():getAllComplaints()).then(setItems).catch(e=>setError(e.message));},[user.role]);
  return <div className="page-content"><div className="page-heading"><span className="eyebrow">REPORT TRACKING</span><h1>{user.role==='citizen'?'My complaints':'Manage complaints'}</h1><p>{user.role==='citizen'?'Check the status and updates for your reports.':'Review reports received from citizens in your area.'}</p></div>
    {error&&<div className="error-message">{error}</div>}<section className="panel"><ComplaintTable items={items} onSelect={onSelect}/></section>
  </div>;
}
