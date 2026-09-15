import React, { useEffect, useState } from 'react';
import { api, session } from './api';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

export default function App(){
  const [user,setUser]=useState(null); const [loading,setLoading]=useState(Boolean(session.token));
  useEffect(()=>{ if(!session.token)return; api('/auth/me').then(setUser).catch(()=>session.clear()).finally(()=>setLoading(false)); },[]);
  if(loading)return <div className="center">Loading SpendWise…</div>;
  if(!user)return <Auth onAuthenticated={setUser}/>;
  return <Dashboard user={user} onLogout={()=>{session.clear();setUser(null);}}/>;
}
