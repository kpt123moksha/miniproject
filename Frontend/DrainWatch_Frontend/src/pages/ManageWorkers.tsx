import {useEffect,useState} from 'react';
import {getWorkers} from '../services/complaintService';
import type {Worker} from '../types';

export default function ManageWorkers() {
  const [workers,setWorkers]=useState<Worker[]>([]);const [error,setError]=useState('');
  useEffect(()=>{getWorkers().then(setWorkers).catch(e=>setError(e.message));},[]);
  return <div className="page-content"><div className="page-heading"><span className="eyebrow">LOCAL TEAM</span><h1>Cleaning workers</h1><p>Workers registered for the configured local area.</p></div>
    {error&&<div className="error-message">{error}</div>}
    <div className="worker-grid">{workers.map(worker=><section className="panel worker-card" key={worker.user_id}>
      <div className="worker-avatar">{worker.name.charAt(0).toUpperCase()}</div><div><b>{worker.name}</b><small>{worker.phone||'Phone not provided'}</small></div>
    </section>)}
    {!workers.length&&!error&&<div className="empty-state">No workers have been added to this area yet.</div>}</div>
  </div>;
}
