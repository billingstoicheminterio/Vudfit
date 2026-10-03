import React, { useEffect, useState } from 'react';
import { getJobs, getSnags, createSnag, deleteSnag } from '../services/api';
import { Plus, Trash2, X, AlertTriangle } from 'lucide-react';

export default function Snags() {
  const [jobs, setJobs] = useState([]);
  const [snags, setSnags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    job_id: '',
    area: '',
    description: '',
    assigned_to: '',
    target_date: '',
    status: 'Open',
    verified: 'No',
    root_cause: '',
    action_taken: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, snagsRes] = await Promise.all([getJobs(), getSnags()]);
      setJobs(jobsRes.data);
      setSnags(snagsRes.data);
      if (jobsRes.data.length > 0) setFormData(prev => ({ ...prev, job_id: jobsRes.data[0].id }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      job_id: jobs.length > 0 ? jobs[0].id : '',
      area: '',
      description: '',
      assigned_to: '',
      target_date: '',
      status: 'Open',
      verified: 'No',
      root_cause: '',
      action_taken: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSnag(formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Error creating snag: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this snag item?')) {
      try {
        await deleteSnag(id);
        fetchData();
      } catch (err) {
        alert('Error deleting snag: ' + err.message);
      }
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', margin: 0 }}>Snags & Rectification Control Gate</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Track site snags by area, assigned owners, target completion, and client verification.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>+ Log Site Snag</span>
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Job No.</th>
              <th>Area / Unit</th>
              <th>Snag Description</th>
              <th>Raised Date</th>
              <th>Assigned To</th>
              <th>Target Date</th>
              <th>Status</th>
              <th>Verified?</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>Loading Snags...</td></tr>
            ) : snags.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No snags recorded. Click "+ Log Site Snag" to create one.</td></tr>
            ) : (
              snags.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{s.job_id}</td>
                  <td><span className="badge badge-neutral">{s.area || 'General'}</span></td>
                  <td style={{ fontWeight: 600 }}>{s.description}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.raised_date ? s.raised_date.slice(0, 10) : '—'}</td>
                  <td>{s.assigned_to || 'Unassigned'}</td>
                  <td style={{ fontSize: '12px' }}>{s.target_date ? s.target_date.slice(0, 10) : '—'}</td>
                  <td>
                    <span className={`badge ${s.status === 'Closed' ? 'badge-success' : s.status === 'In Progress' ? 'badge-info' : 'badge-danger'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${s.verified === 'Yes' ? 'badge-success' : 'badge-neutral'}`}>
                      {s.verified || 'No'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(s.id)}>
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Log Site Snag</h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Job No. *</label>
                  <select value={formData.job_id} onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.id} — {j.company}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Area / Unit</label>
                  <input type="text" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} placeholder="e.g. Master Bedroom Wardrobe" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Snag Description *</label>
                <textarea rows="3" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Shutter alignment gap on left tower" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Assigned To</label>
                  <input type="text" value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} placeholder="Installation Tech" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Target Date</label>
                  <input type="date" value={formData.target_date} onChange={(e) => setFormData({ ...formData, target_date: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Snag</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
