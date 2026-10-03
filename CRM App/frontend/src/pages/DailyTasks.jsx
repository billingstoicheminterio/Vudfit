import React, { useEffect, useState } from 'react';
import { getJobs, getDailyTasks, createDailyTask, deleteDailyTask } from '../services/api';
import { Plus, Trash2, X, Calendar } from 'lucide-react';

const DEPARTMENTS = ['Sales', 'Design', 'Commercial', 'Procurement', 'Production', 'Dispatch', 'Installation', 'Service', 'Accounts'];

export default function DailyTasks() {
  const [jobs, setJobs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    job_id: '',
    dept: 'Production',
    task: '',
    owner: '',
    priority: 'Medium',
    status: 'Not Started',
    pct: 0,
    blocker: '',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, tasksRes] = await Promise.all([getJobs(), getDailyTasks()]);
      setJobs(jobsRes.data);
      setTasks(tasksRes.data);
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
      dept: 'Production',
      task: '',
      owner: '',
      priority: 'Medium',
      status: 'Not Started',
      pct: 0,
      blocker: '',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createDailyTask(formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Error creating task: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete daily task?')) {
      try {
        await deleteDailyTask(id);
        fetchData();
      } catch (err) {
        alert('Error deleting task: ' + err.message);
      }
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', margin: 0 }}>Daily Departmental Execution Tracker</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Management control layer tracking due tasks, department owners, and blockers.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>+ Log Daily Task</span>
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Job No.</th>
              <th>Department</th>
              <th>Task / Activity</th>
              <th>Owner</th>
              <th>Priority</th>
              <th>Status</th>
              <th>% Complete</th>
              <th>Blocker</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>Loading Daily Tasks...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No daily tasks logged. Click "+ Log Daily Task" to create one.</td></tr>
            ) : (
              tasks.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.task_date ? t.task_date.slice(0, 10) : '—'}</td>
                  <td style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{t.job_id || 'General'}</td>
                  <td><span className="badge badge-info">{t.dept}</span></td>
                  <td style={{ fontWeight: 600 }}>{t.task}</td>
                  <td>{t.owner || '—'}</td>
                  <td>
                    <span className={`badge ${t.priority === 'High' ? 'badge-danger' : t.priority === 'Medium' ? 'badge-warning' : 'badge-neutral'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.status === 'Completed' ? 'badge-success' : t.status === 'In Progress' ? 'badge-info' : 'badge-neutral'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{t.pct || 0}%</td>
                  <td style={{ color: t.blocker ? '#ef4444' : 'var(--text-muted)', fontSize: '12px' }}>{t.blocker || 'None'}</td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(t.id)}>
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
              <h3 style={{ margin: 0, fontSize: '16px' }}>Log Daily Departmental Task</h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Department *</label>
                  <select value={formData.dept} onChange={(e) => setFormData({ ...formData, dept: e.target.value })}>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Job No.</label>
                  <select value={formData.job_id} onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}>
                    <option value="">General (No Job)</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.id} — {j.company}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Task / Activity Description *</label>
                <input type="text" required value={formData.task} onChange={(e) => setFormData({ ...formData, task: e.target.value })} placeholder="e.g. Finalize CNC Nesting & Cutlist" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Task Owner</label>
                  <input type="text" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} placeholder="Owner Name" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Blocker / Impediment (if any)</label>
                <input type="text" value={formData.blocker} onChange={(e) => setFormData({ ...formData, blocker: e.target.value })} placeholder="e.g. Awaiting client handle selection" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
