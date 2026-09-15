import React from 'react';
import { INR } from '../constants';

export default function Overview({ report, month }) {
  return <section><div className="section-head"><div><h2>Overview</h2><p className="muted">Financial snapshot for {month}</p></div></div>
    <div className="stats"><article><span>Income</span><strong>{INR.format(report.income||0)}</strong></article><article><span>Expenses</span><strong>{INR.format(report.expenses||0)}</strong></article><article><span>Savings</span><strong>{INR.format(report.savings||0)}</strong></article><article><span>Transactions</span><strong>{report.transactionCount||0}</strong></article></div>
    <div className="panel"><h3>Spending by category</h3>{(report.categoryBreakdown||[]).map(row=><div className="bar-row" key={row.category}><span>{row.category}</span><div className="bar"><i style={{width:`${report.expenses?Math.max(3,row.amount/report.expenses*100):0}%`}}/></div><strong>{INR.format(row.amount)}</strong></div>)}{!report.categoryBreakdown?.length&&<p className="muted">Add expenses to see category analytics.</p>}</div>
  </section>;
}
