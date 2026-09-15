import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { categories, INR, today } from '../constants';

export default function Recurring({ refreshKey, onChanged }) {
  const [items, setItems] = useState([]); const [form, setForm] = useState({ title:'', amount:'', type:'expense', category:'Bills', frequency:'monthly', nextRun:today(), note:'' });
  async function load(){ setItems(await api('/recurring')); }
  useEffect(() => { load().catch(console.error); }, [refreshKey]);
  async function save(e){ e.preventDefault(); await api('/recurring', { method:'POST', body:JSON.stringify(form) }); setForm({ ...form, title:'', amount:'', note:'' }); await load(); onChanged(); }
  async function toggle(item){ await api(`/recurring/${item._id}`, { method:'PATCH', body:JSON.stringify({ active:!item.active }) }); await load(); }
  async function remove(id){ await api(`/recurring/${id}`, { method:'DELETE' }); await load(); onChanged(); }
  return <section><div className="section-head"><div><h2>Recurring transactions</h2><p className="muted">Automatically create due entries without duplicates.</p></div></div>
    <form className="form-grid panel" onSubmit={save}><label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></label><label>Amount<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></label><label>Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="expense">Expense</option><option value="income">Income</option></select></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Frequency<select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})}><option>weekly</option><option>monthly</option><option>yearly</option></select></label><label>Next run<input type="date" value={form.nextRun} onChange={e=>setForm({...form,nextRun:e.target.value})}/></label><button className="primary">Add recurring rule</button></form>
    <div className="list">{items.map(x=><article className="list-row" key={x._id}><div><strong>{x.title}</strong><small>{x.category} · {x.frequency} · next {new Date(x.nextRun).toLocaleDateString('en-IN')}</small></div><div className="row"><strong>{INR.format(x.amount)}</strong><button onClick={()=>toggle(x)}>{x.active?'Pause':'Resume'}</button><button onClick={()=>remove(x._id)}>Delete</button></div></article>)}</div>
  </section>;
}
