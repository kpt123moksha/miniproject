import type { Complaint } from '../types';
import RiskBadge from './RiskBadge';

interface Props {items:Complaint[];onSelect?:(item:Complaint)=>void}
export default function ComplaintTable({items,onSelect}:Props) {
  if (!items.length) return <div className="empty-state"><b>No complaints found</b><p>New reports will appear here.</p></div>;
  return <div className="table-wrap"><table>
    <thead><tr><th>Complaint</th><th>City</th><th>Location</th><th>Severity</th><th>Risk</th><th>Status</th><th>Date</th><th></th></tr></thead>
    <tbody>{items.map(item=><tr key={item.complaint_id}>
      <td><b>#{item.complaint_id}</b><small>{item.description.slice(0,55)}{item.description.length>55?'…':''}</small></td>
      <td>{item.city||'Unverified'}</td>
      <td>{item.location_name || 'Citizen location'}</td>
      <td className="capitalize">{item.severity}</td>
      <td><RiskBadge category={item.risk_category} score={item.risk_score}/></td>
      <td>{item.status==='Cleaning Completed'
        ?item.authority_confirmed?'Awaiting citizen confirmation':'Awaiting authority confirmation'
        :item.status}</td>
      <td>{new Date(item.created_at).toLocaleDateString()}</td>
      <td><button className="text-button" onClick={()=>onSelect?.(item)}>View</button></td>
    </tr>)}</tbody>
  </table></div>;
}
