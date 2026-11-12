import {useState} from 'react';
import {Droplets} from 'lucide-react';
import {login} from '../services/authService';
import type {User} from '../types';

export default function Login({onSuccess,onRegister}:{onSuccess:(user:User)=>void;onRegister:()=>void}) {
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');
  const [error,setError]=useState('');const [loading,setLoading]=useState(false);
  async function submit(event:React.FormEvent) {
    event.preventDefault();setError('');setLoading(true);
    try {const result=await login(email,password);onSuccess(result.user);}
    catch(e){setError(e instanceof Error?e.message:'Login failed.');}
    finally{setLoading(false);}
  }
  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}>
    <div className="auth-logo"><Droplets size={24}/><b>DrainWatch</b></div>
    <span className="eyebrow">LOCAL DRAINAGE MANAGEMENT</span><h1>Welcome back</h1>
    <p className="muted">Sign in to report issues or manage maintenance work.</p>
    <label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    {error&&<div className="error-message">{error}</div>}
    <button className="button primary full" disabled={loading}>{loading?'Signing in…':'Sign in'}</button>
    <p className="auth-switch">New citizen? <button type="button" onClick={onRegister}>Create an account</button></p>
  </form></div>;
}
