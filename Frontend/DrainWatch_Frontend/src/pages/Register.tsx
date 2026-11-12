import {useState} from 'react';
import {register} from '../services/authService';
import type {User} from '../types';

export default function Register({onSuccess,onLogin}:{onSuccess:(user:User)=>void;onLogin:()=>void}) {
  const [form,setForm]=useState({name:'',email:'',password:'',phone:''});
  const [error,setError]=useState('');const [loading,setLoading]=useState(false);
  function change(key:keyof typeof form,value:string){setForm(old=>({...old,[key]:value}));}
  async function submit(event:React.FormEvent){
    event.preventDefault();setError('');setLoading(true);
    try{const result=await register(form);onSuccess(result.user);}
    catch(e){setError(e instanceof Error?e.message:'Registration failed.');}
    finally{setLoading(false);}
  }
  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}>
    <div className="auth-logo"><b>DrainWatch</b></div><span className="eyebrow">JOIN YOUR LOCAL COMMUNITY</span>
    <h1>Create an account</h1><p className="muted">Register as a citizen to report drainage problems.</p>
    <label>Full name<input required value={form.name} onChange={e=>change('name',e.target.value)}/></label>
    <label>Email<input required type="email" value={form.email} onChange={e=>change('email',e.target.value)}/></label>
    <label>Phone number<input value={form.phone} onChange={e=>change('phone',e.target.value)}/></label>
    <label>Password<input required minLength={8} type="password" value={form.password} onChange={e=>change('password',e.target.value)}/><small>Use at least 8 characters.</small></label>
    {error&&<div className="error-message">{error}</div>}
    <button className="button primary full" disabled={loading}>{loading?'Creating account…':'Register'}</button>
    <p className="auth-switch">Already registered? <button type="button" onClick={onLogin}>Sign in</button></p>
  </form></div>;
}
