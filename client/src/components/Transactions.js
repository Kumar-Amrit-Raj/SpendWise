import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { categories, INR, today } from '../constants';

function TransactionForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', amount: '', type: 'expense', category: 'Food', date: today(), note: '' });
  return <form className="form-grid" onSubmit={e => { e.preventDefault(); onSave(form); }}>
    <label>Title<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></label>
    <label>Amount<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></label>
    <label>Type<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select></label>
    <label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
    <label>Date<input type="date" value={String(form.date).slice(0, 10)} onChange={e => setForm({ ...form, date: e.target.value })} required /></label>
    <label>Note<input value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
    <div className="row actions"><button className="primary">Save</button>{onCancel && <button type="button" onClick={onCancel}>Cancel</button>}</div>
  </form>;
}

export default function Transactions({ month, refreshKey, onChanged }) {
  const [items, setItems] = useState([]); const [search, setSearch] = useState(''); const [type, setType] = useState('');
  const [editing, setEditing] = useState(null); const [showForm, setShowForm] = useState(false); const [error, setError] = useState('');
  async function load() { try { setItems(await api(`/transactions?month=${month}`)); } catch (e) { setError(e.message); } }
  useEffect(() => { load(); }, [month, refreshKey]);
  const visible = useMemo(() => items.filter(x => (!type || x.type === type) && (!search || `${x.title} ${x.category} ${x.note}`.toLowerCase().includes(search.toLowerCase()))), [items, type, search]);
  async function save(form) {
    try {
      if (editing) await api(`/transactions/${editing._id}`, { method: 'PATCH', body: JSON.stringify(form) });
      else await api('/transactions', { method: 'POST', body: JSON.stringify(form) });
      setEditing(null); setShowForm(false); await load(); onChanged();
    } catch (e) { setError(e.message); }
  }
  async function remove(id) { if (!window.confirm('Delete this transaction?')) return; await api(`/transactions/${id}`, { method: 'DELETE' }); await load(); onChanged(); }
  function exportCsv() {
    const rows = [['Date','Title','Type','Category','Amount','Note'], ...visible.map(x => [String(x.date).slice(0,10), x.title, x.type, x.category, x.amount, x.note || ''])];
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `spendwise-${month}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }
  return <section>
    <div className="section-head"><div><h2>Transactions</h2><p className="muted">Income and expenses for {month}</p></div><div className="row"><button onClick={exportCsv}>Export CSV</button><button className="primary" onClick={() => { setEditing(null); setShowForm(!showForm); }}>+ Add</button></div></div>
    {(showForm || editing) && <div className="panel"><TransactionForm initial={editing ? { ...editing, date: String(editing.date).slice(0,10) } : undefined} onSave={save} onCancel={() => { setEditing(null); setShowForm(false); }} /></div>}
    <div className="toolbar"><input placeholder="Search transactions" value={search} onChange={e => setSearch(e.target.value)} /><select value={type} onChange={e => setType(e.target.value)}><option value="">All types</option><option value="income">Income</option><option value="expense">Expenses</option></select></div>
    {error && <div className="alert">{error}</div>}
    <div className="table-wrap"><table><thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Type</th><th>Amount</th><th></th></tr></thead><tbody>
      {visible.map(x => <tr key={x._id}><td>{new Date(x.date).toLocaleDateString('en-IN')}</td><td><strong>{x.title}</strong><small>{x.note}</small></td><td>{x.category}</td><td><span className={`pill ${x.type}`}>{x.type}</span></td><td className={x.type}>{x.type === 'expense' ? '-' : '+'}{INR.format(x.amount)}</td><td className="row"><button onClick={() => setEditing(x)}>Edit</button><button onClick={() => remove(x._id)}>Delete</button></td></tr>)}
      {!visible.length && <tr><td colSpan="6" className="empty">No transactions found.</td></tr>}
    </tbody></table></div>
  </section>;
}
