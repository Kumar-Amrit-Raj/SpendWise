import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { INR } from '../constants';

const emptyForm = { investedAmount: '', investmentDate: '' };

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN');
}

export default function Investments({ refreshKey, onChanged }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedNav, setSelectedNav] = useState(null);
  const [nav, setNav] = useState({});
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const data = await api('/investments');
    setItems(data);

    const latestEntries = await Promise.all(
      data.filter(item => item.schemeCode).map(async item => {
        try {
          return [item._id, await api(`/investments/nav/${item.schemeCode}`)];
        } catch (e) {
          return [item._id, { error: e.message }];
        }
      })
    );
    setNav(Object.fromEntries(latestEntries));
  }

  useEffect(() => {
    load().catch(e => setError(e.message));
  }, [refreshKey]);

  useEffect(() => {
    const text = query.trim();
    if (selected && text === selected.schemeName) return;
    if (text.length < 2) {
      setMatches([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await api(`/investments/schemes?query=${encodeURIComponent(text)}`);
        if (!cancelled) setMatches(Array.isArray(results) ? results.slice(0, 12) : []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, selected]);

  async function chooseScheme(scheme) {
    setSelected(scheme);
    setQuery(scheme.schemeName);
    setMatches([]);
    setSelectedNav(null);
    setError('');
    try {
      setSelectedNav(await api(`/investments/nav/${scheme.schemeCode}`));
    } catch (e) {
      setSelectedNav({ error: e.message });
    }
  }

  async function save(event) {
    event.preventDefault();
    if (!selected) {
      setError('Select a mutual fund scheme from the suggestions first.');
      return;
    }
    if (!form.investedAmount || !form.investmentDate) {
      setError('Enter the invested amount and investment date.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await api('/investments', {
        method: 'POST',
        body: JSON.stringify({
          schemeCode: String(selected.schemeCode),
          investedAmount: form.investedAmount,
          investmentDate: form.investmentDate
        })
      });
      setForm(emptyForm);
      setQuery('');
      setSelected(null);
      setSelectedNav(null);
      await load();
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function fetchNav(item) {
    if (!item.schemeCode) return;
    try {
      const value = await api(`/investments/nav/${item.schemeCode}`);
      setNav(current => ({ ...current, [item._id]: value }));
    } catch (e) {
      setNav(current => ({ ...current, [item._id]: { error: e.message } }));
    }
  }

  async function remove(id) {
    if (!window.confirm('Remove this mutual fund from your tracker?')) return;
    try {
      await api(`/investments/${id}`, { method: 'DELETE' });
      await load();
      onChanged();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Mutual Funds</h2>
          <p className="muted">Choose a scheme, enter how much you invested and when. SpendWise calculates the units from that date's NAV and tracks today's portfolio value.</p>
        </div>
      </div>

      <form className="panel mutual-fund-form" onSubmit={save}>
        <div className="scheme-search-field">
          <label>
            Search scheme or fund house
            <input
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSelected(null);
                setSelectedNav(null);
              }}
              placeholder="Try HDFC, SBI, Axis, ICICI..."
              autoComplete="off"
            />
          </label>

          {(searching || matches.length > 0) && (
            <div className="scheme-dropdown">
              {searching && <div className="scheme-status">Searching schemes…</div>}
              {!searching && matches.map(scheme => (
                <button type="button" key={scheme.schemeCode} onClick={() => chooseScheme(scheme)}>
                  <strong>{scheme.schemeName}</strong>
                  <small>Scheme code {scheme.schemeCode}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="selected-scheme">
            <div>
              <span>Selected scheme</span>
              <strong>{selected.schemeName}</strong>
              <small>Code {selected.schemeCode}</small>
            </div>
            <div>
              <span>Latest NAV</span>
              {selectedNav?.nav
                ? <><strong>{INR.format(selectedNav.nav)}</strong><small>{selectedNav.date}</small></>
                : <strong>{selectedNav?.error || 'Loading…'}</strong>}
            </div>
          </div>
        )}

        <div className="form-grid fund-details-grid">
          <label>
            Amount invested
            <input type="number" min="0.01" step="0.01" value={form.investedAmount} onChange={e => setForm({ ...form, investedAmount: e.target.value })} required />
          </label>
          <label>
            Investment date
            <input type="date" max={new Date().toISOString().slice(0, 10)} value={form.investmentDate} onChange={e => setForm({ ...form, investmentDate: e.target.value })} required />
          </label>
        </div>

        <p className="fund-helper">If the selected date was a weekend or market holiday, SpendWise uses the next available NAV published for that scheme.</p>
        {error && <div className="alert">{error}</div>}
        <button className="primary" disabled={!selected || saving}>{saving ? 'Calculating portfolio…' : 'Add mutual fund'}</button>
      </form>

      <div className="card-grid fund-card-grid">
        {items.map(item => {
          const latest = nav[item._id];
          const currentValue = latest?.nav && item.units ? latest.nav * item.units : null;
          const profit = currentValue === null ? null : currentValue - Number(item.investedAmount || 0);

          return (
            <article className="budget-card fund-card" key={item._id}>
              <div className="section-head fund-card-head">
                <div><strong>{item.name}</strong><small>Scheme code {item.schemeCode || '—'}</small></div>
                <button onClick={() => remove(item._id)} aria-label="Remove mutual fund">×</button>
              </div>

              <div className="fund-value-row">
                <div><span>Current portfolio</span><strong>{currentValue === null ? '—' : INR.format(currentValue)}</strong></div>
                <div><span>Amount invested</span><strong>{INR.format(item.investedAmount || 0)}</strong></div>
              </div>

              <div className="fund-details-list">
                <small>Invested on <strong>{formatDate(item.investmentDate)}</strong></small>
                <small>Purchase NAV <strong>{item.purchaseNav ? INR.format(item.purchaseNav) : '—'}</strong>{item.purchaseNavDate ? ` · ${formatDate(item.purchaseNavDate)}` : ''}</small>
                <small>Units calculated <strong>{item.units ? Number(item.units).toFixed(4) : '—'}</strong></small>
                {latest?.nav && <small>Latest NAV <strong>{INR.format(latest.nav)}</strong> · {latest.date}</small>}
                {latest?.error && <small className="fund-error">{latest.error}</small>}
              </div>

              {profit !== null && (
                <div className={profit >= 0 ? 'fund-return fund-positive' : 'fund-return fund-negative'}>
                  {profit >= 0 ? 'Gain' : 'Loss'} {INR.format(Math.abs(profit))}
                  <small>{item.investedAmount > 0 ? `${((profit / item.investedAmount) * 100).toFixed(2)}%` : ''}</small>
                </div>
              )}

              <div className="fund-card-actions">
                <button type="button" onClick={() => fetchNav(item)}>Refresh NAV</button>
              </div>
            </article>
          );
        })}
        {!items.length && <div className="empty fund-empty">No mutual funds added yet. Search for a scheme above to start tracking one.</div>}
      </div>
    </section>
  );
}
