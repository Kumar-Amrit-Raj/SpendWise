import React, { useState } from 'react';
import { api, session } from '../api';

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) });
      session.set(result.token); onAuthenticated(result.user);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  return <main className="auth-shell"><section className="auth-card">
    <div className="brand-mark">S</div><h1>SpendWise</h1><p className="muted">Track money with clarity.</p>
    <form onSubmit={submit} className="stack">
      {mode === 'register' && <label>Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>}
      <label>Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
      <label>Password<input type="password" minLength="8" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></label>
      {error && <div className="alert">{error}</div>}
      <button className="primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <button className="link-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
      {mode === 'login' ? 'New here? Create an account' : 'Already registered? Sign in'}
    </button>
  </section></main>;
}
