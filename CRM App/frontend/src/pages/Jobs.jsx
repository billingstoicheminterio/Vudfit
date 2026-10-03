import React, { useEffect, useState } from 'react';
import { getJobs, createJob, updateJob, deleteJob } from '../services/api';
import { Plus, Search, Edit2, Trash2, X, Check, Briefcase } from 'lucide-react';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [formData, setFormData] = useState({
    company: '',
    contact: '',
    phone: '',
    email: '',
    location: '',
    architect: '',
    sales_owner: '',
    proj_type: 'Modular Kitchen',
    contract_value: '',
    target_completion: '',
    priority: 'Medium',
    remarks: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await getJobs();
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingJob(null);
    setFormData({
      company: '',
      contact: '',
      phone: '',
      email: '',
      location: '',
      architect: '',
      sales_owner: '',
      proj_type: 'Modular Kitchen',
      contract_value: '',
      target_completion: '',
      priority: 'Medium',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setFormData({
      company: job.company || '',
      contact: job.contact || '',
      phone: job.phone || '',
      email: job.email || '',
      location: job.location || '',
      architect: job.architect || '',
      sales_owner: job.sales_owner || '',
      proj_type: job.proj_type || 'Modular Kitchen',
      contract_value: job.contract_value || '',
      target_completion: job.target_completion ? job.target_completion.slice(0, 10) : '',
      priority: job.priority || 'Medium',
      remarks: job.remarks || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await updateJob(editingJob.id, formData);
      } else {
        await createJob(formData);
      }
      setShowModal(false);
      fetchJobs();
    } catch (err) {
      alert('Error saving job: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Delete job ${id} and all its stages/checklists?`)) {
      try {
        await deleteJob(id);
        fetchJobs();
      } catch (err) {
        alert('Error deleting job: ' + err.message);
      }
    }
  };

  const filteredJobs = jobs.filter(j =>
    j.id.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.toLowerCase().includes(search.toLowerCase()) ||
    j.contact?.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '360px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '10px', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Job No, Customer, Location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px' }}
            />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>+ Create New Customer Job</span>
        </button>
      </div>

      {/* Jobs Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Job No.</th>
              <th>Customer / Company</th>
              <th>Primary Contact</th>
              <th>Location</th>
              <th>Project Type</th>
              <th>Architect / Sales</th>
              <th>Contract Value</th>
              <th>Current Stage</th>
              <th>% Complete</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>Loading Jobs...</td></tr>
            ) : filteredJobs.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No jobs found. Click "+ Create New Customer Job" to add one.</td></tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{job.id}</td>
                  <td style={{ fontWeight: 600 }}>{job.company}</td>
                  <td>
                    <div>{job.contact}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{job.phone}</div>
                  </td>
                  <td>{job.location}</td>
                  <td><span className="badge badge-neutral">{job.proj_type}</span></td>
                  <td style={{ fontSize: '12px' }}>
                    <div>Arch: {job.architect || '—'}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Sales: {job.sales_owner || '—'}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{fmt(job.contract_value)}</td>
                  <td><span className="badge badge-info">{job.current_stage || '01 Enquiry'}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${job.pct_complete || 0}%`, height: '100%', background: 'var(--accent-primary)' }}></div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>{job.pct_complete || 0}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenEdit(job)}>
                        <Edit2 style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(job.id)}>
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add / Edit */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>{editingJob ? `Edit Job ${editingJob.id}` : 'Create New Customer Job'}</h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Customer / Company *</label>
                  <input type="text" required value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="e.g. Oberoi Villa" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Primary Contact</label>
                  <input type="text" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="Contact Person Name" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 9876543210" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="client@email.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Project Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Site Location / Address" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Project Type</label>
                  <select value={formData.proj_type} onChange={(e) => setFormData({ ...formData, proj_type: e.target.value })}>
                    <option value="Modular Kitchen">Modular Kitchen</option>
                    <option value="Wardrobes">Wardrobes</option>
                    <option value="Residential Full Interior">Residential Full Interior</option>
                    <option value="Commercial Furniture">Commercial Furniture</option>
                    <option value="Office Fitout">Office Fitout</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Architect / Designer</label>
                  <input type="text" value={formData.architect} onChange={(e) => setFormData({ ...formData, architect: e.target.value })} placeholder="Architect Name" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Sales Owner</label>
                  <input type="text" value={formData.sales_owner} onChange={(e) => setFormData({ ...formData, sales_owner: e.target.value })} placeholder="Responsible Sales Executive" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Contract Value (₹)</label>
                  <input type="number" value={formData.contract_value} onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })} placeholder="1250000" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Target Completion</label>
                  <input type="date" value={formData.target_completion} onChange={(e) => setFormData({ ...formData, target_completion: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Remarks & Special Requirements</label>
                <textarea rows="3" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="e.g. Premium Acrylic & PU Finish, Soft-close Blum hardware" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingJob ? 'Save Changes' : 'Create Job'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
