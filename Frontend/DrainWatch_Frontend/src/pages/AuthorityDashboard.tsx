import {useEffect,useState} from 'react';
import {AlertTriangle,ClipboardList,CheckCircle2,Clock3} from 'lucide-react';
import type {Complaint,DashboardSummary} from '../types';
import {getAllComplaints,getDashboardSummary} from '../services/complaintService';
import WeatherCard from '../components/WeatherCard';
import MapView from '../components/MapView';
import ComplaintTable from '../components/ComplaintTable';
import type {ServiceCity} from '../types';

export default function AuthorityDashboard({onComplaints,onSelect}:{onComplaints:()=>void;onSelect:(c:Complaint)=>void}) {
  const [items,setItems]=useState<Complaint[]>([]);
  const [summary,setSummary]=useState<DashboardSummary|null>(null);
  const [error,setError]=useState('');
  const [cityFilter,setCityFilter]=useState<ServiceCity|null>(null);
  useEffect(()=>{Promise.all([getAllComplaints(),getDashboardSummary()]).then(([list,stats])=>{setItems(list);setSummary(stats);}).catch(e=>setError(e.message));},[]);
  const counts=summary?.counts;
  const visibleItems=cityFilter?items.filter(item=>item.city===cityFilter):items;
  return <div className="page-content">
    <div className="page-heading"><div><span className="eyebrow">AUTHORITY WORKSPACE</span><h1>Maintenance overview</h1><p>Review reports and plan cleaning work for your local area.</p></div></div>
    {error&&<div className="error-message">{error}</div>}
    <div className="stat-grid five">
      <div className="stat-card"><span>Total complaints</span><b>{counts?.total??0}</b><ClipboardList/></div>
      <div className="stat-card"><span>Pending</span><b>{counts?.pending??0}</b><Clock3/></div>
      <div className="stat-card"><span>Assigned</span><b>{counts?.assigned??0}</b></div>
      <div className="stat-card"><span>Completed</span><b>{counts?.completed??0}</b><CheckCircle2/></div>
      <div className="stat-card alert-stat"><span>Overdue</span><b>{counts?.overdue??0}</b><AlertTriangle/></div>
    </div>
    <div className="section-title"><div><h2>Service-area performance</h2><p>Complaint totals and workload across the configured service area.</p></div></div>
    <div className="city-stat-grid">
      {(summary?.cityStats||[]).map(city=><section className="panel city-stat-card" key={city.city}>
        <div className="city-stat-heading"><h3>{city.city}</h3><span>{city.total} total</span></div>
        <dl><div><dt>Pending</dt><dd>{city.pending}</dd></div><div><dt>Assigned</dt><dd>{city.assigned}</dd></div><div><dt>Completed</dt><dd>{city.completed}</dd></div><div><dt>Overdue</dt><dd>{city.overdue}</dd></div></dl>
        <button className="text-button" onClick={()=>setCityFilter(current=>current===city.city?null:city.city)}>{cityFilter===city.city?'Show all cities':`View ${city.city} complaints`}</button>
      </section>)}
    </div>
    <WeatherCard weather={summary?.weather}/>
    <div className="section-title"><div><h2>Reported drainage locations</h2><p>City outlines distinguish Mangaluru and Udupi; marker colours represent complaint risk.</p></div></div>
    <section className="panel"><MapView complaints={visibleItems}/><div className="map-legend"><span><i className="green"/>Low</span><span><i className="yellow"/>Medium</span><span><i className="orange"/>High</span><span><i className="red"/>Critical</span><span><i className="city-mangaluru"/>Mangaluru boundary</span><span><i className="city-udupi"/>Udupi boundary</span></div></section>
    <div className="section-title"><div><h2>{cityFilter?`${cityFilter} complaints`:'Recent complaints'}</h2><p>{cityFilter?'Complaints assigned to the selected city.':'Review the latest community reports.'}</p></div><button className="text-button" onClick={onComplaints}>Manage all →</button></div>
    <ComplaintTable items={visibleItems.slice(0,8)} onSelect={onSelect}/>
  </div>;
}
