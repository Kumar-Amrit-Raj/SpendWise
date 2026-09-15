import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { categories, INR } from '../constants';

export default function Budgets({ month, refreshKey, onChanged }) {
  const [items, setItems] = useState([]); const [category, setCategory] = useState('Food'); const [limit, setLimit] = useState('');
  async function load() { setItems(await api(`/budgets?month=${month}`)); }
  useEffect(() => { load().catch(console.error); }, [month, refreshKey]);
  async function save(e) { e.preventDefault(); await api('/budgets', { method: 'PUT', body: JSON.stringify({ month, category, limit }) }); setLimit(''); await load(); onChanged(); }
  async function remove(id) { await api(`/budgets/${id}`, { method: 'DELETE' }); await load(); onChanged(); }
  return <section><div className="section-head"><div><h2>Monthly budgets</h2><p className="muted">Set category limits and compare them with actual spending.</p></div></div>
    <form className="inline-form" onSubmit={save}><select value={category} onChange={e => setCategory(e.target.value)}>{categories.filter(c => !['Salary','Freelance'].includes(c)).map(c => <option key={c}>{c}</option>)}</select><input type="number" min="0" placeholder="Budget limit" value={limit} onChange={e => setLimit(e.target.value)} required /><button className="primary">Save budget</button></form>
    <div className="card-grid">{items.map(x => { const percent = x.limit ? Math.min(100, Math.round(x.spent / x.limit * 100)) : 0; return <article className="budget-card" key={x._id}><div className="section-head"><strong>{x.category}</strong><button onClick={() => remove(x._id)}>×</button></div><div className="metric">{INR.format(x.spent)} <span>/ {INR.format(x.limit)}</span></div><div className="progress"><i style={{ width: `${percent}%` }} /></div><small>{percent}% used</small></article>; })}</div>
  </section>;
}
