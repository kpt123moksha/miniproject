import { ClipboardList, LayoutDashboard, MapPin, PlusCircle, Users } from 'lucide-react';
import type { Role } from '../types';

export type PageName = 'dashboard'|'report'|'complaints'|'details'|'workers'|'tasks';

interface Props {role:Role;active:PageName;onNavigate:(page:PageName)=>void}
export default function Sidebar({role,active,onNavigate}:Props) {
  const links = role==='citizen'
    ? [{id:'dashboard' as PageName,label:'Dashboard',icon:LayoutDashboard},
       {id:'report' as PageName,label:'Report a problem',icon:PlusCircle},
       {id:'complaints' as PageName,label:'My complaints',icon:ClipboardList}]
    : role==='worker'
    ? [{id:'dashboard' as PageName,label:'Dashboard',icon:LayoutDashboard},
       {id:'tasks' as PageName,label:'Assigned work',icon:ClipboardList}]
    : [{id:'dashboard' as PageName,label:'Dashboard',icon:LayoutDashboard},
       {id:'complaints' as PageName,label:'Manage complaints',icon:ClipboardList},
       {id:'workers' as PageName,label:'Workers',icon:Users}];
  return <aside className="sidebar">
    <div className="sidebar-heading">WORKSPACE</div>
    {links.map(link=><button key={link.id} className={`nav-link ${active===link.id?'active':''}`} onClick={()=>onNavigate(link.id)}>
      <link.icon size={18}/><span>{link.label}</span>
    </button>)}
    <div className="sidebar-note"><MapPin size={16}/><span>Local area services</span></div>
  </aside>;
}
