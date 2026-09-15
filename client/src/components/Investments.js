import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { INR } from '../constants';

export default function Investments({ refreshKey, onChanged }) {
  const [items,setItems]=useState([]); const [form,setForm]=useState({name:'',schemeCode:'',monthlySip:'',investedAmount:'',targetAmount:'',targetDate:'',units:''}); const [nav,setNav]=useState({});
  async function load(){ setItems(await api('/investments')); } useEffect(()=>{load().catch(console.error);},[refreshKey]);
  async function save(e){e.preventDefault(); await api('/investments',{method:'POST',body:JSON.stringify(form)}); setForm({name:'',schemeCode:'',monthlySip:'',investedAmount:'',targetAmount:'',targetDate:'',units:''}); await load(); onChanged();}
  async function fetchNav(item){ if(!item.schemeCode)return; try{setNav({...nav,[item._id]:await api(`/investments/nav/${item.schemeCode}`)});}catch(e){setNav({...nav,[item._id]:{error:e.message}});} }
  async function remove(id){await api(`/investments/${id}`,{method:'DELETE'}); await load(); onChanged();}
  return <section><div className="section-head"><div><h2>Investments</h2><p className="muted">Track SIP plans, goals and mutual-fund NAV.</p></div></div>
    <form className="form-grid panel" onSubmit={save}>{[['name','Name'],['schemeCode','MF scheme code'],['monthlySip','Monthly SIP'],['investedAmount','Invested amount'],['targetAmount','Target amount'],['units','Units']].map(([key,label])=><label key={key}>{label}<input type={['monthlySip','investedAmount','targetAmount','units'].includes(key)?'number':'text'} min="0" step="0.01" value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} required={key==='name'}/></label>)}<label>Target date<input type="date" value={form.targetDate} onChange={e=>setForm({...form,targetDate:e.target.value})}/></label><button className="primary">Add investment</button></form>
    <div className="card-grid">{items.map(x=>{const n=nav[x._id]; const current=n?.nav&&x.units?n.nav*x.units:null; const progress=x.targetAmount?Math.min(100,Math.round(((current||x.investedAmount)/x.targetAmount)*100)):0; return <article className="budget-card" key={x._id}><div className="section-head"><strong>{x.name}</strong><button onClick={()=>remove(x._id)}>×</button></div><small>Scheme {x.schemeCode||'—'}</small><div className="metric">{INR.format(current||x.investedAmount)}</div><small>Target {INR.format(x.targetAmount)} · SIP {INR.format(x.monthlySip)}/mo</small><div className="progress"><i style={{width:`${progress}%`}}/></div>{x.schemeCode&&<button onClick={()=>fetchNav(x)}>Refresh NAV</button>}{n?.nav&&<small>NAV {n.nav} · {n.date}</small>}{n?.error&&<small>{n.error}</small>}</article>;})}</div>
  </section>;
}
