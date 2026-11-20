import {useEffect,useState} from 'react';
import type {Complaint} from '../types';
import {getMyTasks,updateTaskStatus,uploadTaskCompletion} from '../services/complaintService';

const API_ORIGIN=(import.meta.env.VITE_API_URL||'http://localhost:5000/api').replace(/\/api\/?$/,'');

export default function WorkerDashboard() {
  const [tasks,setTasks]=useState<Complaint[]>([]);
  const [error,setError]=useState('');
  const [busyTask,setBusyTask]=useState<number|null>(null);
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    getMyTasks().then(setTasks).catch(e=>setError(e instanceof Error?e.message:'Could not load assigned work.'));
  },[refresh]);

  async function startWork(task:Complaint){
    if(!task.task_id)return;
    setError('');setBusyTask(task.task_id);
    try{await updateTaskStatus(task.task_id,'Cleaning in Progress');setRefresh(value=>value+1);}
    catch(e){setError(e instanceof Error?e.message:'Could not update task status.');}
    finally{setBusyTask(null);}
  }

  async function submitCompletion(event:React.FormEvent<HTMLFormElement>,task:Complaint){
    event.preventDefault();
    if(!task.task_id)return;
    const form=new FormData(event.currentTarget);
    const beforePhoto=form.get('beforePhoto');
    const afterPhoto=form.get('afterPhoto');
    const completionDescription=String(form.get('completionDescription')||'');
    if(!(beforePhoto instanceof File)||!beforePhoto.size||!(afterPhoto instanceof File)||!afterPhoto.size){
      setError('Select both before and after photos.');return;
    }
    setError('');setBusyTask(task.task_id);
    try{
      await uploadTaskCompletion(task.complaint_id,{
        beforePhoto,afterPhoto,completionDescription
      });
      setRefresh(value=>value+1);
    }catch(e){setError(e instanceof Error?e.message:'Could not submit completion photos.');}
    finally{setBusyTask(null);}
  }

  return <div className="page-content">
    <div className="page-heading"><span className="eyebrow">WORKER WORKSPACE</span><h1>My assigned work</h1><p>Review your tasks, upload before and after photos, and submit completed work for confirmation.</p></div>
    {error&&<div className="error-message">{error}</div>}
    {!tasks.length&&!error&&<div className="empty-state"><b>No assigned work yet</b><p>New tasks assigned to you will appear here.</p></div>}
    <div className="task-list">{tasks.map(task=><section className="panel task-card" key={task.task_id||task.complaint_id}>
      <div className="task-card-heading">
        <div><span className="eyebrow">COMPLAINT #{task.complaint_id}</span><h2>{task.location_name||'Reported location'}</h2></div>
        <span className={`task-status ${task.status==='Verified'?'done':''}`}>{task.status==='Cleaning Completed'
          ?task.authority_confirmed?'Awaiting citizen':'Awaiting authority'
          :task.status}</span>
      </div>
      <p>{task.description}</p>
      <div className="detail-row"><b>Location</b><span>{Number(task.latitude).toFixed(5)}, {Number(task.longitude).toFixed(5)}</span></div>
      <div className="detail-row"><b>Deadline</b><span>{task.deadline?new Date(task.deadline).toLocaleString():'Not set'}</span></div>
      {task.photo_path&&<div><b>Reported photo</b><img className="evidence-photo" src={`${API_ORIGIN}${task.photo_path}`} alt="Reported drainage location"/></div>}
      {task.before_photo&&<div><b>Before cleaning</b><img className="evidence-photo" src={`${API_ORIGIN}${task.before_photo}`} alt="Before cleaning"/></div>}
      {task.after_photo&&<div><b>After cleaning</b><img className="evidence-photo" src={`${API_ORIGIN}${task.after_photo}`} alt="After cleaning"/></div>}
      {task.completion_description&&<p>{task.completion_description}</p>}
      {task.status==='Cleaning Completed'&&<div className="confirmation-status">
        <b>Confirmation status</b>
        <p>Authority: {task.authority_confirmed?'Confirmed':'Waiting'} · Citizen: {task.citizen_confirmed?'Confirmed':task.authority_confirmed?'Waiting':'Waiting for authority'}</p>
      </div>}
      {task.status==='Verified'&&<div className="success-message">Both authority and citizen confirmed this work.</div>}
      {task.status!=='Cleaning Completed'&&task.status!=='Verified'&&<>
        {task.status==='Assigned'&&<button className="button secondary" disabled={busyTask===task.task_id} onClick={()=>startWork(task)}>Start work</button>}
        <form className="completion-form" onSubmit={event=>submitCompletion(event,task)}>
          <h3>Submit completed work</h3>
          <label>Before photo<input name="beforePhoto" type="file" accept="image/jpeg,image/png,image/webp" required/></label>
          <label>After photo<input name="afterPhoto" type="file" accept="image/jpeg,image/png,image/webp" required/></label>
          <label>Work completed<textarea name="completionDescription" rows={3} required placeholder="Describe the work carried out"/></label>
          <button className="button primary" disabled={busyTask===task.task_id}>{busyTask===task.task_id?'Submitting…':'Submit completion for review'}</button>
        </form>
      </>}
    </section>)}</div>
  </div>;
}
