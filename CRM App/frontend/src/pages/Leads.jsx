import React, { useEffect, useState } from 'react';
import { getLeads, createLead, updateLead, deleteLead } from '../services/api';
import { Plus, Search, Trash2, Edit2, X, Users, CheckCircle } from 'lucide-react';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [formData, setFormData] = useState({
    company: '',
    contact: '',
    phone: '',
    email: '',
    location: '',
    source: 'Walk-in',
    assigned_to: '',
    requirement: '',
    stage: 'New',
    next_action: '',
    next_action_date: '',
    est_value: '',
    probability: 50,
    remarks: ''
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await getLeads();
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingLead(null);
    setFormData({
      company: '',
      contact: '',
      phone: '',
      email: '',
      location: '',
      source: 'Walk-in',
      assigned_to: '',
      requirement: '',
      stage: 'New',
      next_action: '',
      next_action_date: '',
      est_value: '',
      probability: 50,
      remarks: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      company: lead.company || '',
      contact: lead.contact || '',
      phone: lead.phone || '',
      email: lead.email || '',
      location: lead.location || '',
      source: lead.source || 'Walk-in',
      assigned_to: lead.assigned_to || '',
      requirement: lead.requirement || '',
      stage: lead.stage || 'New',
      next_action: lead.next_action || '',
      next_action_date: lead.next_action_date ? lead.next_action_date.slice(0, 10) : '',
      est_value: lead.est_value || '',
      probability: lead.probability || 50,
      remarks: lead.remarks || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await updateLead(editingLead.id, formData);
      } else {
        await createLead(formData);
      }
      setShowModal(false);
      fetchLeads();
    } catch (err) {
      alert('Error saving lead: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this lead?')) {
      try {
        await deleteLead(id);
        fetchLeads();
      } catch (err) {
        alert('Error deleting lead: ' + err.message);
      }
    }
  };

  const fmt = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN');

  const filteredLeads = leads.filter(l =>
    l.company?.toLowerCase().includes(search.toLowerCase()) ||
    l.contact?.toLowerCase().includes(search.toLowerCase()) ||
    l.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '360px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '10px', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search leads by Customer, Contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px' }}
            />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>+ Add New Lead</span>
        </button>
      </div>

      {/* Leads Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Lead Date</th>
              <th>Customer / Company</th>
              <th>Contact Person</th>
              <th>Source</th>
              <th>Requirement</th>
              <th>Assigned To</th>
              <th>Est. Value</th>
              <th>Stage</th>
              <th>Next Action</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>Loading Leads...</td></tr>
            ) : filteredLeads.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No leads found. Click "+ Add New Lead" to create one.</td></tr>
            ) : (
              filteredLeads.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.lead_date ? l.lead_date.slice(0, 10) : '—'}</td>
                  <td style={{ fontWeight: 700 }}>{l.company}</td>
                  <td>
                    <div>{l.contact}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.phone}</div>
                  </td>
                  <td><span className="badge badge-neutral">{l.source}</span></td>
                  <td style={{ fontSize: '12.5px' }}>{l.requirement || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{l.assigned_to || 'Unassigned'}</td>
                  <td style={{ fontWeight: 700 }}>{fmt(l.est_value)}</td>
                  <td>
                    <span className={`badge ${l.stage === 'Won' ? 'badge-success' : l.stage === 'Lost' ? 'badge-danger' : 'badge-info'}`}>
                      {l.stage}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    <div>{l.next_action || '—'}</div>
                    {l.next_action_date && <div style={{ color: 'var(--text-muted)' }}>Due: {l.next_action_date.slice(0, 10)}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenEdit(l)}>
                        <Edit2 style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(l.id)}>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>{editingLead ? 'Edit Lead' : 'Add New Lead'}</h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Customer / Company *</label>
                  <input type="text" required value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Company Name" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Contact Person</label>
                  <input type="text" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="Person Name" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91..." />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@domain.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Lead Source</label>
                  <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })}>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Referral">Referral</option>
                    <option value="Architect">Architect</option>
                    <option value="Website">Website</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Exhibition">Exhibition</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Assigned To</label>
                  <input type="text" value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} placeholder="Sales Rep" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Estimated Value (₹)</label>
                  <input type="number" value={formData.est_value} onChange={(e) => setFormData({ ...formData, est_value: e.target.value })} placeholder="2500000" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Lead Stage</label>
                  <select value={formData.stage} onChange={(e) => setFormData({ ...formData, stage: e.target.value })}>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Quotation Pending">Quotation Pending</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Next Action</label>
                  <input type="text" value={formData.next_action} onChange={(e) => setFormData({ ...formData, next_action: e.target.value })} placeholder="e.g. Site Visit" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Next Action Date</label>
                  <input type="date" value={formData.next_action_date} onChange={(e) => setFormData({ ...formData, next_action_date: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingLead ? 'Save Changes' : 'Add Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
