import React, { useEffect, useState } from 'react';
import { getJobs, getMaterials, createMaterial, deleteMaterial } from '../services/api';
import { Plus, Trash2, X, Package } from 'lucide-react';

export default function Materials() {
  const [jobs, setJobs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    job_id: '',
    item: '',
    spec: '',
    supplier: '',
    req_qty: '',
    ord_qty: '',
    rec_qty: '',
    status: 'Pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, matRes] = await Promise.all([getJobs(), getMaterials()]);
      setJobs(jobsRes.data);
      setMaterials(matRes.data);
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
      item: '',
      spec: '',
      supplier: '',
      req_qty: '',
      ord_qty: '',
      rec_qty: '',
      status: 'Pending'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createMaterial(formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Error creating material: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete material item?')) {
      try {
        await deleteMaterial(id);
        fetchData();
      } catch (err) {
        alert('Error deleting material: ' + err.message);
      }
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', margin: 0 }}>Material Procurement & Inventory Control</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Track raw materials, hardware, quantities ordered vs received, and balance stock.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>+ Add Material Item</span>
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Job No.</th>
              <th>Material / Item</th>
              <th>Specification</th>
              <th>Supplier</th>
              <th>Req. Qty</th>
              <th>Ord. Qty</th>
              <th>Rec. Qty</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>Loading Materials...</td></tr>
            ) : materials.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No material items found. Click "+ Add Material Item" to add one.</td></tr>
            ) : (
              materials.map((m) => {
                const req = Number(m.req_qty) || 0;
                const rec = Number(m.rec_qty) || 0;
                const bal = req - rec;
                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{m.job_id}</td>
                    <td style={{ fontWeight: 600 }}>{m.item}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.spec || '—'}</td>
                    <td>{m.supplier || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{req}</td>
                    <td>{m.ord_qty || 0}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>{rec}</td>
                    <td style={{ fontWeight: 700, color: bal > 0 ? '#ef4444' : '#10b981' }}>{bal}</td>
                    <td>
                      <span className={`badge ${m.status === 'Received' ? 'badge-success' : m.status === 'Delayed' ? 'badge-danger' : 'badge-warning'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(m.id)}>
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Add Material Item</h3>
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
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Item Name *</label>
                  <input type="text" required value={formData.item} onChange={(e) => setFormData({ ...formData, item: e.target.value })} placeholder="e.g. HDHMR 18mm Board / Blum Hinge" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Specification</label>
                  <input type="text" value={formData.spec} onChange={(e) => setFormData({ ...formData, spec: e.target.value })} placeholder="Action TESA Waterproof, Acrylic Gloss" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Supplier</label>
                  <input type="text" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} placeholder="Supplier Name" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Required Qty</label>
                  <input type="number" value={formData.req_qty} onChange={(e) => setFormData({ ...formData, req_qty: e.target.value })} placeholder="45" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Ordered Qty</label>
                  <input type="number" value={formData.ord_qty} onChange={(e) => setFormData({ ...formData, ord_qty: e.target.value })} placeholder="45" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Received Qty</label>
                  <input type="number" value={formData.rec_qty} onChange={(e) => setFormData({ ...formData, rec_qty: e.target.value })} placeholder="45" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Partially Received">Partially Received</option>
                  <option value="Received">Received</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
