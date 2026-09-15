import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { monthNow } from '../constants';
import Overview from './Overview';
import Transactions from './Transactions';
import Budgets from './Budgets';
import Recurring from './Recurring';
import SipPlanner from './SipPlanner';
import MutualFunds from './Investments';

const sections = [
  ['overview', 'Overview'],
  ['transactions', 'Transactions'],
  ['budgets', 'Budgets'],
  ['recurring', 'Recurring'],
  ['sip-planner', 'SIP Planner'],
  ['mutual-funds', 'Mutual Funds']
];

export default function Dashboard({ user, onLogout }) {
  const [active, setActive] = useState('overview');
  const [month, setMonth] = useState(monthNow());
  const [report, setReport] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  async function refresh() {
    try {
      setReport(await api(`/reports/monthly?month=${month}`));
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    refresh();
  }, [month, refreshKey]);

  useEffect(() => {
    const nodes = sections
      .map(([id]) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: [0, 0.15, 0.35, 0.6] }
    );

    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const changed = () => setRefreshKey(x => x + 1);

  function goTo(id) {
    const target = document.getElementById(id);
    if (!target) return;

    setActive(id);

    const nav = document.querySelector('.app-shell > aside');
    const stickyOffset = window.innerWidth <= 980
      ? (nav?.getBoundingClientRect().height || 0) + 14
      : 18;
    const top = target.getBoundingClientRect().top + window.scrollY - stickyOffset;

    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  return (
    <div className="app-shell">
      <aside>
        <div className="brand">
          <div className="brand-mark">S</div>
          <div><strong>SpendWise</strong><small>Personal finance</small></div>
        </div>

        <nav>
          {sections.map(([id, label]) => (
            <button className={active === id ? 'active' : ''} key={id} onClick={() => goTo(id)}>
              {label}
            </button>
          ))}
        </nav>

        <div className="profile">
          <strong>{user.name}</strong>
          <small>{user.email}</small>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </aside>

      <main className="content">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Personal finance dashboard</span>
            <h1>Welcome back, {user.name?.split(' ')[0] || 'there'}</h1>
            <p className="muted">Everything in one place — scroll naturally or use the navigation to jump to a section.</p>
          </div>
          <label className="month-picker">
            <span>Month</span>
            <input className="month" type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </label>
        </header>

        <section id="overview" className="dashboard-section">
          <Overview report={report} month={month} />
        </section>

        <section id="transactions" className="dashboard-section section-block">
          <Transactions month={month} refreshKey={refreshKey} onChanged={changed} />
        </section>

        <section id="budgets" className="dashboard-section section-block">
          <Budgets month={month} refreshKey={refreshKey} onChanged={changed} />
        </section>

        <section id="recurring" className="dashboard-section section-block">
          <Recurring refreshKey={refreshKey} onChanged={changed} />
        </section>

        <section id="sip-planner" className="dashboard-section section-block">
          <SipPlanner />
        </section>

        <section id="mutual-funds" className="dashboard-section section-block">
          <MutualFunds refreshKey={refreshKey} onChanged={changed} />
        </section>
      </main>
    </div>
  );
}
