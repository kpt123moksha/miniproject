import {useState} from 'react';
import Navbar from './components/Navbar';
import Sidebar,{type PageName} from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import ReportComplaint from './pages/ReportComplaint';
import MyComplaints from './pages/MyComplaints';
import ComplaintDetails from './pages/ComplaintDetails';
import ManageWorkers from './pages/ManageWorkers';
import WorkerDashboard from './pages/WorkerDashboard';
import {getSavedUser,logout} from './services/authService';
import type {Complaint,User} from './types';

export default function App() {
  const [user,setUser]=useState<User|null>(getSavedUser);
  const [authPage,setAuthPage]=useState<'login'|'register'>('login');
  const [page,setPage]=useState<PageName>('dashboard');
  const [selected,setSelected]=useState<Complaint|null>(null);
  const [refreshKey,setRefreshKey]=useState(0);

  function signedIn(value:User){setUser(value);setPage('dashboard');}
  function signOut(){logout();setUser(null);setSelected(null);setAuthPage('login');}
  function updated(){setRefreshKey(k=>k+1);setSelected(null);setPage('complaints');}

  if(!user) return authPage==='login'
    ? <Login onSuccess={signedIn} onRegister={()=>setAuthPage('register')}/>
    : <Register onSuccess={signedIn} onLogin={()=>setAuthPage('login')}/>;

  return <div className="app-layout">
    <Navbar user={user} onLogout={signOut}/>
    <div className="app-body"><Sidebar role={user.role} active={selected?'details':page} onNavigate={p=>{setSelected(null);setPage(p);}}/>
      <main className="main-content" key={refreshKey}>
        {selected
          ? <ComplaintDetails complaint={selected} user={user} onBack={()=>setSelected(null)} onUpdated={updated}/>
          : page==='dashboard' && user.role==='citizen'
            ? <CitizenDashboard user={user} onReport={()=>setPage('report')} onComplaints={()=>setPage('complaints')} onSelect={setSelected}/>
          : page==='dashboard' && user.role==='worker'
            ? <WorkerDashboard/>
          : page==='tasks' && user.role==='worker'
            ? <WorkerDashboard/>
          : page==='dashboard'
            ? <AuthorityDashboard onComplaints={()=>setPage('complaints')} onSelect={setSelected}/>
          : page==='report' && user.role==='citizen'
            ? <ReportComplaint onDone={()=>{setPage('complaints');setRefreshKey(k=>k+1);}}/>
          : page==='workers' && (user.role==='authority'||user.role==='admin')
            ? <ManageWorkers/>
          : <MyComplaints user={user} onSelect={setSelected}/>}
      </main>
    </div>
  </div>;
}
