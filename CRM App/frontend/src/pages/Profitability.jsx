import React, { useEffect, useState } from 'react';
import { getJobs, getProfitability, createProfitability } from '../services/api';
import { TrendingUp, Calculator } from 'lucide-react';

export default function Profitability() {
  const [jobs, setJobs] = useState([]);
  const [profits, setProfits] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    material_cost: '',
    hardware_cost: '',
    labour_cost: '',
    machine_cost: '',
    finish_cost: '',
    transport: '',
    installation: '',
    other_cost: '',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, profRes] = await Promise.all([getJobs(), getProfitability()]);
      setJobs(jobsRes.data);
      setProfits(profRes.data);
      if (jobsRes.data.length > 0) {
        const firstId = jobsRes.data[0].id;
        setSelectedJobId(firstId);
        loadJobProfit(firstId, profRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobProfit = (jobId, list) => {
    const existing = list.find(p => p.job_id === jobId);
    if (existing) {
      setFormData({
        material_cost: existing.material_cost || '',
        hardware_cost: existing.hardware_cost || '',
        labour_cost: existing.labour_cost || '',
        machine_cost: existing.machine_cost || '',
        finish_cost: existing.finish_cost || '',
        transport: existing.transport || '',
        installation: existing.installation || '',
        other_cost: existing.other_cost || '',
        remarks: existing.remarks || ''
      });
    } else {
      setFormData({
        material_cost: '',
        hardware_cost: '',
        labour_cost: '',
        machine_cost: '',
        finish_cost: '',
        transport: '',
        installation: '',
        other_cost: '',
        remarks: ''
      });
    }
  };

  const handleJobChange = (jobId) => {
    setSelectedJobId(jobId);
    loadJobProfit(jobId, profits);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProfitability({ job_id: selectedJobId, ...formData });
      alert('Costing & profitability updated!');
      fetchData();
    } catch (err) {
      alert('Error updating profitability: ' + err.message);
    }
  };

  const currentJob = jobs.find(j => j.id === selectedJobId);
  const contractValue = currentJob ? Number(currentJob.contract_value) || 0 : 0;

  const totalCost = (Number(formData.material_cost) || 0) +
    (Number(formData.hardware_cost) || 0) +
    (Number(formData.labour_cost) || 0) +
    (Number(formData.machine_cost) || 0) +
    (Number(formData.finish_cost) || 0) +
    (Number(formData.transport) || 0) +
    (Number(formData.installation) || 0) +
    (Number(formData.other_cost) || 0);

  const grossProfit = contractValue - totalCost;
  const marginPct = contractValue ? ((grossProfit / contractValue) * 100).toFixed(1) : '0';

  const fmt = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', margin: 0 }}>Job Costing vs Margin Profitability Analysis</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>BOQ cost elements, total project expenditure, gross profit, and margin %.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: 700, fontSize: '14px' }}>Select Customer Job:</label>
          <select
            value={selectedJobId}
            onChange={(e) => handleJobChange(e.target.value)}
            style={{ width: 'auto', minWidth: '240px', fontWeight: 600 }}
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.id} — {j.company}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Contract Value</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary)' }}>{fmt(contractValue)}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Project Cost</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>{fmt(totalCost)}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Gross Profit</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: grossProfit >= 0 ? '#10b981' : '#ef4444' }}>{fmt(grossProfit)}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Gross Margin %</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: Number(marginPct) >= 25 ? '#10b981' : '#f59e0b' }}>{marginPct}%</div>
        </div>
      </div>

      {/* Cost Input Form */}
      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '4px' }}>Cost Component Breakdown (₹)</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Material Cost (Board/Plies)</label>
              <input type="number" value={formData.material_cost} onChange={(e) => setFormData({ ...formData, material_cost: e.target.value })} placeholder="420000" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Hardware & Accessories</label>
              <input type="number" value={formData.hardware_cost} onChange={(e) => setFormData({ ...formData, hardware_cost: e.target.value })} placeholder="180000" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Labour Cost</label>
              <input type="number" value={formData.labour_cost} onChange={(e) => setFormData({ ...formData, labour_cost: e.target.value })} placeholder="85000" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Machine & CNC Work</label>
              <input type="number" value={formData.machine_cost} onChange={(e) => setFormData({ ...formData, machine_cost: e.target.value })} placeholder="45000" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>PU / Special Finish</label>
              <input type="number" value={formData.finish_cost} onChange={(e) => setFormData({ ...formData, finish_cost: e.target.value })} placeholder="65000" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Transport & Logistics</label>
              <input type="number" value={formData.transport} onChange={(e) => setFormData({ ...formData, transport: e.target.value })} placeholder="25000" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Installation Charges</label>
              <input type="number" value={formData.installation} onChange={(e) => setFormData({ ...formData, installation: e.target.value })} placeholder="50000" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Other Overheads</label>
              <input type="number" value={formData.other_cost} onChange={(e) => setFormData({ ...formData, other_cost: e.target.value })} placeholder="15000" />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Costing Notes & Variance Remarks</label>
            <textarea rows="2" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="Costing notes..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="submit" className="btn btn-primary">Save Costing & Calculate Margin</button>
          </div>
        </form>
      </div>

    </div>
  );
}
