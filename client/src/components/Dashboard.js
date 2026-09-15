import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { monthNow } from '../constants';
import Overview from './Overview';
import Transactions from './Transactions';
import Budgets from './Budgets';
import Recurring from './Recurring';
import Investments from './Investments';

export default function Dashboard({ user, onLogout }) {
  const [tab,setTab]=useState('overview'); const [month,setMonth]=useState(monthNow()); const [report,setReport]=useState({}); const [refreshKey,setRefreshKey]=useState(0);
  async function refresh(){ try{setReport(await api(`/reports/monthly?month=${month}`));}catch(e){console.error(e);} }
  useEffect(()=>{refresh();},[month,refreshKey]);
  const changed=()=>setRefreshKey(x=>x+1);
  return <div className="app-shell"><aside><div className="brand"><div className="brand-mark">S</div><div><strong>SpendWise</strong><small>Personal finance</small></div></div><nav>{[['overview','Overview'],['transactions','Transactions'],['budgets','Budgets'],['recurring','Recurring'],['investments','Investments']].map(([id,label])=><button className={tab===id?'active':''} key={id} onClick={()=>setTab(id)}>{label}</button>)}</nav><div className="profile"><strong>{user.name}</strong><small>{user.email}</small><button onClick={onLogout}>Sign out</button></div></aside>
    <main className="content"><header><div><span className="eyebrow">Dashboard</span><h1>{tab[0].toUpperCase()+tab.slice(1)}</h1></div><input className="month" type="month" value={month} onChange={e=>setMonth(e.target.value)}/></header>
      {tab==='overview'&&<Overview report={report} month={month}/>} {tab==='transactions'&&<Transactions month={month} refreshKey={refreshKey} onChanged={changed}/>} {tab==='budgets'&&<Budgets month={month} refreshKey={refreshKey} onChanged={changed}/>} {tab==='recurring'&&<Recurring refreshKey={refreshKey} onChanged={changed}/>} {tab==='investments'&&<Investments refreshKey={refreshKey} onChanged={changed}/>} 
    </main></div>;
}
