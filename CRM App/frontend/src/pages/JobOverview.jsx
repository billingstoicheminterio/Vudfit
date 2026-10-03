import React, { useEffect, useState } from 'react';
import { getJobs, getJobStages, getPayments, getSnags } from '../services/api';

export default function JobOverview() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [stages, setStages] = useState([]);
  const [payments, setPayments] = useState([]);
  const [snags, setSnags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) fetchDetails(selectedJobId);
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await getJobs();
      setJobs(res.data);
      if (res.data.length > 0) setSelectedJobId(res.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (jobId) => {
    try {
      const [stRes, payRes, snagRes] = await Promise.all([
        getJobStages(jobId),
        getPayments(),
        getSnags()
      ]);
      setStages(stRes.data);
      setPayments(payRes.data.filter(p => p.job_id === jobId));
      setSnags(snagRes.data.filter(s => s.job_id === jobId));
    } catch (err) {
      console.error(err);
    }
  };

  const currentJob = jobs.find(j => j.id === selectedJobId);
  const doneStages = stages.filter(s => s.status === 'Completed').length;
  const pct = stages.length ? Math.round((doneStages / stages.length) * 100) : 0;
  const currentStage = stages.find(s => s.status !== 'Completed')?.stage || 'All stages complete';

  const totalInvoiced = payments.reduce((sum, p) => sum + (parseFloat(p.invoice_amt) || 0), 0);
  const totalReceived = payments.reduce((sum, p) => sum + (parseFloat(p.received) || 0), 0);

  const fmt = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <div className="toolbar">
        <h2>Job Overview & Control Summary</h2>
      </div>

      <div className="jobselect">
        <label>Select Job No: </label>
        <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
          {jobs.map(j => (
            <option key={j.id} value={j.id}>{j.id} — {j.company}</option>
          ))}
        </select>
      </div>

      {currentJob && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          
          {/* Customer & Project Info */}
          <div className="kpi">
            <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--acc)' }}>Project Identity</h3>
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <div><strong>Job No:</strong> {currentJob.id}</div>
              <div><strong>Customer / Company:</strong> {currentJob.company}</div>
              <div><strong>Primary Contact:</strong> {currentJob.contact} ({currentJob.phone})</div>
              <div><strong>Location:</strong> {currentJob.location}</div>
              <div><strong>Architect / Designer:</strong> {currentJob.architect || '—'}</div>
              <div><strong>Sales Owner:</strong> {currentJob.sales_owner || '—'}</div>
            </div>
          </div>

          {/* Progress & Stage Status */}
          <div className="kpi">
            <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--acc)' }}>Execution Status</h3>
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <div><strong>Current Stage:</strong> <span className="pill p-gray">{currentStage}</span></div>
              <div style={{ margin: '8px 0' }}>
                <strong>Overall Completion:</strong> {pct}% ({doneStages}/{stages.length} stages)
                <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--acc)' }}></div>
                </div>
              </div>
              <div><strong>Contract Value:</strong> {fmt(currentJob.contract_value)}</div>
              <div><strong>Target Completion:</strong> {currentJob.target_completion ? currentJob.target_completion.slice(0, 10) : '—'}</div>
            </div>
          </div>

          {/* Accounts & Snags */}
          <div className="kpi">
            <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--acc)' }}>Commercial & Quality</h3>
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <div><strong>Total Invoiced:</strong> {fmt(totalInvoiced)}</div>
              <div><strong>Total Received:</strong> <span style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(totalReceived)}</span></div>
              <div><strong>Balance Outstanding:</strong> <span style={{ color: totalInvoiced - totalReceived > 0 ? 'var(--danger)' : 'var(--sub)' }}>{fmt(totalInvoiced - totalReceived)}</span></div>
              <div><strong>Open Snags:</strong> <span className={`pill ${snags.filter(s => s.status !== 'Closed').length ? 'p-red' : 'p-green'}`}>{snags.filter(s => s.status !== 'Closed').length} open</span></div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
