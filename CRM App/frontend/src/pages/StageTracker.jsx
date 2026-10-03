import React, { useEffect, useState } from 'react';
import { getJobs, getJobStages, updateJobStage } from '../services/api';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, User, Calendar } from 'lucide-react';

const PHASE_COLORS = {
  "Qualification": "#ab47bc",
  "Measurement": "#00838f",
  "Design": "#2563eb",
  "Commercial": "#d97706",
  "Order Release": "#8d6e00",
  "Procurement": "#6d4c41",
  "Production": "#c2185b",
  "Dispatch": "#0277bd",
  "Installation": "#16a34a",
  "Handover & Service": "#7c3aed"
};

const STAGE_PHASES = [
  { name: "Qualification", count: 3 },
  { name: "Measurement", count: 1 },
  { name: "Design", count: 4 },
  { name: "Commercial", count: 4 },
  { name: "Order Release", count: 3 },
  { name: "Procurement", count: 4 },
  { name: "Production", count: 7 },
  { name: "Dispatch", count: 4 },
  { name: "Installation", count: 2 },
  { name: "Handover & Service", count: 7 }
];

export default function StageTracker() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) fetchStages(selectedJobId);
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      const res = await getJobs();
      setJobs(res.data);
      if (res.data.length > 0) setSelectedJobId(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStages = async (jobId) => {
    try {
      setLoading(true);
      const res = await getJobStages(jobId);
      setStages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (stageNo, field, val) => {
    const targetIdx = stages.findIndex(s => s.stage_no === stageNo);
    if (targetIdx === -1) return;

    // Gate Enforcement check
    if (field === 'status' && val === 'Completed' && targetIdx > 0) {
      const prevStage = stages[targetIdx - 1];
      if (prevStage.status !== 'Completed') {
        const proceed = window.confirm(`Warning: Previous stage "${prevStage.stage}" is not completed yet. Do you want to force mark "${stages[targetIdx].stage}" as Completed anyway?`);
        if (!proceed) return;
      }
    }

    const updated = [...stages];
    updated[targetIdx] = { ...updated[targetIdx], [field]: val };
    setStages(updated);

    try {
      await updateJobStage(selectedJobId, stageNo, updated[targetIdx]);
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header controls & Phase legend */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 700, fontSize: '14px' }}>Select Customer Job:</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              style={{ width: 'auto', minWidth: '240px', fontWeight: 600 }}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.id} — {j.company}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            40 Master Execution Stages with Non-Negotiable Gate Control
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', pt: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          {Object.keys(PHASE_COLORS).map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: PHASE_COLORS[p] }}></span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stages Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Stage Name & Department</th>
              <th>Owner / Resp.</th>
              <th>Planned Finish</th>
              <th>Actual Finish</th>
              <th>Status</th>
              <th>% Complete</th>
              <th>Client Approval?</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>Loading Stage Pipeline...</td></tr>
            ) : stages.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>No stage data found for this job.</td></tr>
            ) : (
              stages.map((st) => {
                return (
                  <tr key={st.stage_no}>
                    <td style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '12px' }}>{st.stage_no}</td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{st.stage}</span>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={st.owner || ''}
                        placeholder="Owner..."
                        onChange={(e) => handleStageChange(st.stage_no, 'owner', e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={st.planned_finish ? st.planned_finish.slice(0, 10) : ''}
                        onChange={(e) => handleStageChange(st.stage_no, 'planned_finish', e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={st.actual_finish ? st.actual_finish.slice(0, 10) : ''}
                        onChange={(e) => handleStageChange(st.stage_no, 'actual_finish', e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      />
                    </td>
                    <td>
                      <select
                        value={st.status || 'Not Started'}
                        onChange={(e) => handleStageChange(st.stage_no, 'status', e.target.value)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: st.status === 'Completed' ? '#10b981' : st.status === 'In Progress' ? '#2563eb' : st.status === 'Blocked' ? '#ef4444' : 'var(--text-muted)'
                        }}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={st.pct || 0}
                        onChange={(e) => handleStageChange(st.stage_no, 'pct', parseInt(e.target.value, 10))}
                        style={{ width: '65px', padding: '4px 8px', fontSize: '12px' }}
                      />
                    </td>
                    <td>
                      <select
                        value={st.approval || 'No'}
                        onChange={(e) => handleStageChange(st.stage_no, 'approval', e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                        <option value="NA">NA</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={st.remarks || ''}
                        placeholder="Remarks..."
                        onChange={(e) => handleStageChange(st.stage_no, 'remarks', e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
