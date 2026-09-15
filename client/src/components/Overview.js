import React from 'react';
import { INR } from '../constants';

export default function Overview({ report, month }) {
  const savings = Number(report.savings || 0);

  return <section><div className="section-head"><div><h2>Overview</h2><p className="muted">Financial snapshot for {month}</p></div></div>
    <div className="stats">
      <article className="stat-card stat-positive"><span>Income</span><strong>{INR.format(report.income || 0)}</strong></article>
      <article className="stat-card stat-negative"><span>Expenses</span><strong>{INR.format(report.expenses || 0)}</strong></article>
      <article className={`stat-card ${savings >= 0 ? 'stat-positive' : 'stat-negative'}`}><span>Savings</span><strong>{INR.format(savings)}</strong></article>
      <article className="stat-card stat-neutral"><span>Transactions</span><strong>{report.transactionCount || 0}</strong></article>
    </div>
    <div className="panel"><h3>Spending by category</h3>{(report.categoryBreakdown || []).map(row => <div className="bar-row expense-breakdown" key={row.category}><span>{row.category}</span><div className="bar"><i style={{ width: `${report.expenses ? Math.max(3, row.amount / report.expenses * 100) : 0}%` }} /></div><strong>{INR.format(row.amount)}</strong></div>)}{!report.categoryBreakdown?.length && <p className="muted">Add expenses to see category analytics.</p>}</div>
  </section>;
}
