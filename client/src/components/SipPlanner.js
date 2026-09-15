import React, { useMemo, useState } from 'react';
import { INR } from '../constants';

function futureValueFactor(monthlyRate, months) {
  if (months <= 0) return 0;
  if (monthlyRate === 0) return months;
  return (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate);
}

export default function SipPlanner() {
  const [monthlySip, setMonthlySip] = useState('5000');
  const [annualReturn, setAnnualReturn] = useState('12');
  const [years, setYears] = useState('10');
  const [targetAmount, setTargetAmount] = useState('1000000');

  const result = useMemo(() => {
    const sip = Math.max(0, Number(monthlySip) || 0);
    const rate = Math.max(0, Number(annualReturn) || 0) / 1200;
    const months = Math.max(0, Math.round((Number(years) || 0) * 12));
    const target = Math.max(0, Number(targetAmount) || 0);
    const factor = futureValueFactor(rate, months);
    const invested = sip * months;
    const projected = sip * factor;
    const gain = Math.max(0, projected - invested);
    const requiredSip = factor > 0 ? target / factor : 0;
    const targetGap = projected - target;
    return { invested, projected, gain, requiredSip, targetGap, months };
  }, [monthlySip, annualReturn, years, targetAmount]);

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>SIP & Goal Planner</h2>
          <p className="muted">Estimate your SIP corpus and calculate the monthly SIP needed for a financial goal.</p>
        </div>
      </div>

      <div className="planner-layout">
        <div className="panel planner-form">
          <label>
            Monthly SIP
            <input type="number" min="0" step="500" value={monthlySip} onChange={e => setMonthlySip(e.target.value)} />
          </label>
          <label>
            Expected annual return (%)
            <input type="number" min="0" step="0.1" value={annualReturn} onChange={e => setAnnualReturn(e.target.value)} />
          </label>
          <label>
            Investment period (years)
            <input type="number" min="0" step="1" value={years} onChange={e => setYears(e.target.value)} />
          </label>
          <label>
            Goal amount
            <input type="number" min="0" step="1000" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
          </label>
        </div>

        <div className="planner-results">
          <article className="planner-metric"><span>Projected corpus</span><strong>{INR.format(result.projected)}</strong></article>
          <article className="planner-metric"><span>Total invested</span><strong>{INR.format(result.invested)}</strong></article>
          <article className="planner-metric"><span>Estimated gain</span><strong>{INR.format(result.gain)}</strong></article>
          <article className="planner-metric"><span>SIP needed for goal</span><strong>{INR.format(result.requiredSip)}<small>/month</small></strong></article>
        </div>
      </div>

      <div className={`goal-status ${result.targetGap >= 0 ? 'on-track' : 'behind'}`}>
        {result.months === 0 ? 'Enter an investment period to calculate your goal.' : result.targetGap >= 0
          ? `At these assumptions, the projection is ${INR.format(result.targetGap)} above your goal.`
          : `At these assumptions, the projection is ${INR.format(Math.abs(result.targetGap))} short of your goal.`}
      </div>
      <p className="planner-note">SIP projections are estimates based on a constant assumed return; actual mutual-fund returns can vary.</p>
    </section>
  );
}
