import { Droplets, LogOut, Menu } from 'lucide-react';
import type { User } from '../types';

interface Props { user:User; onLogout:()=>void; onMenu?:()=>void; }
export default function Navbar({user,onLogout,onMenu}:Props) {
  return <header className="topbar">
    <button className="mobile-menu" onClick={onMenu} aria-label="Open menu"><Menu size={20}/></button>
    <div className="topbar-brand"><Droplets size={20}/><span>DrainWatch</span></div>
    <div className="topbar-right">
      <div className="top-user"><span className="avatar">{user.name.charAt(0).toUpperCase()}</span><span>{user.name}<small>{user.role}</small></span></div>
      <button className="icon-button" onClick={onLogout} title="Sign out"><LogOut size={18}/></button>
    </div>
  </header>;
}
