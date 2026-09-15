import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { INR } from '../constants';

const emptyForm = {
  investedAmount: '',
  targetAmount: '',
  targetDate: '',
  units: ''
};

export default function Investments({ refreshKey, onChanged }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedNav, setSelectedNav] = useState(null);
  const [nav, setNav] = useState({});
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setItems(await api('/investments'));
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

    try {
      setError('');
      await api('/investments', {
        method: 'POST',
        body: JSON.stringify({
          name: selected.schemeName,
          schemeCode: String(selected.schemeCode),
          monthlySip: 0,
          investedAmount: form.investedAmount,
          targetAmount: form.targetAmount,
          targetDate: form.targetDate,
          units: form.units
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

  const selectedValue = useMemo(() => {
    if (!selectedNav?.nav || !form.units) return null;
    return Number(selectedNav.nav) * Number(form.units);
  }, [selectedNav, form.units]);

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Mutual Funds</h2>
          <p className="muted">Search Indian mutual-fund schemes by company or scheme name, then track NAV and goal progress.</p>
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
          <label>Amount invested<input type="number" min="0" step="0.01" value={form.investedAmount} onChange={e => setForm({ ...form, investedAmount: e.target.value })} /></label>
          <label>Units owned<input type="number" min="0" step="0.0001" value={form.units} onChange={e => setForm({ ...form, units: e.target.value })} /></label>
          <label>Goal amount<input type="number" min="0" step="0.01" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} /></label>
          <label>Goal date<input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} /></label>
        </div>

        {selectedValue !== null && (
          <div className="live-value-preview">Estimated current value: <strong>{INR.format(selectedValue)}</strong></div>
        )}

        {error && <div className="alert">{error}</div>}
        <button className="primary" disabled={!selected}>Add mutual fund</button>
      </form>

      <div className="card-grid fund-card-grid">
        {items.map(item => {
          const latest = nav[item._id];
          const current = latest?.nav && item.units ? latest.nav * item.units : item.investedAmount;
          const profit = Number(current || 0) - Number(item.investedAmount || 0);
          const progress = item.targetAmount
            ? Math.min(100, Math.max(0, Math.round((Number(current || 0) / item.targetAmount) * 100)))
            : 0;

          return (
            <article className="budget-card fund-card" key={item._id}>
              <div className="section-head fund-card-head">
                <div><strong>{item.name}</strong><small>Scheme code {item.schemeCode || '—'}</small></div>
                <button onClick={() => remove(item._id)} aria-label="Remove mutual fund">×</button>
              </div>

              <div className="fund-value-row">
                <div><span>Current value</span><strong>{INR.format(current || 0)}</strong></div>
                <div><span>Invested</span><strong>{INR.format(item.investedAmount || 0)}</strong></div>
              </div>

              {latest?.nav && <small>Latest NAV {INR.format(latest.nav)} · {latest.date}</small>}
              {latest?.error && <small className="fund-error">{latest.error}</small>}
              <small className={profit >= 0 ? 'fund-positive' : 'fund-negative'}>
                {profit >= 0 ? 'Gain' : 'Loss'} {INR.format(Math.abs(profit))}
              </small>

              {item.targetAmount > 0 && (
                <>
                  <div className="progress"><i style={{ width: `${progress}%` }} /></div>
                  <small>{progress}% of {INR.format(item.targetAmount)} goal</small>
                </>
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
