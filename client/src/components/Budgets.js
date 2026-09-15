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
    <div className="card-grid">{items.map(x => { const rawPercent = x.limit ? Math.round(x.spent / x.limit * 100) : 0; const percent = Math.min(100, rawPercent); const over = x.limit > 0 && x.spent > x.limit; return <article className={`budget-card ${over ? 'budget-over' : 'budget-ok'}`} key={x._id}><div className="section-head"><strong>{x.category}</strong><button onClick={() => remove(x._id)}>×</button></div><div className={`metric ${over ? 'negative-text' : ''}`}>{INR.format(x.spent)} <span>/ {INR.format(x.limit)}</span></div><div className={`progress ${over ? 'progress-negative' : 'progress-positive'}`}><i style={{ width: `${percent}%` }} /></div><small className={over ? 'negative-text' : 'positive-text'}>{rawPercent}% used{over ? ' · over budget' : ''}</small></article>; })}</div>
  </section>;
}
