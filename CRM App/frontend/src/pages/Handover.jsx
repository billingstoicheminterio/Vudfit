import React, { useEffect, useState } from 'react';
import { getJobs, getHandovers, createHandover } from '../services/api';
import { FileCheck, Star, Award, ThumbsUp } from 'lucide-react';

export default function Handover() {
  const [jobs, setJobs] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    handover_date: new Date().toISOString().slice(0, 10),
    contact: '',
    completion_pct: 100,
    accepted: 'Yes',
    final_payment: 'Paid',
    warranty: 'Yes',
    feedback_date: new Date().toISOString().slice(0, 10),
    feedback: 'Excellent execution quality & timely handover!',
    design_rating: 5,
    finish_rating: 5,
    install_rating: 5,
    comm_rating: 5,
    refer: 'Yes',
    testimonial: 'Yes'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, handRes] = await Promise.all([getJobs(), getHandovers()]);
      setJobs(jobsRes.data);
      setHandovers(handRes.data);
      if (jobsRes.data.length > 0) {
        const firstId = jobsRes.data[0].id;
        setSelectedJobId(firstId);
        loadJobHandover(firstId, handRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobHandover = (jobId, list) => {
    const existing = list.find(h => h.job_id === jobId);
    if (existing) {
      setFormData({
        handover_date: existing.handover_date ? existing.handover_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        contact: existing.contact || '',
        completion_pct: existing.completion_pct || 100,
        accepted: existing.accepted || 'Yes',
        final_payment: existing.final_payment || 'Paid',
        warranty: existing.warranty || 'Yes',
        feedback_date: existing.feedback_date ? existing.feedback_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        feedback: existing.feedback || '',
        design_rating: existing.design_rating || 5,
        finish_rating: existing.finish_rating || 5,
        install_rating: existing.install_rating || 5,
        comm_rating: existing.comm_rating || 5,
        refer: existing.refer || 'Yes',
        testimonial: existing.testimonial || 'Yes'
      });
    } else {
      setFormData({
        handover_date: new Date().toISOString().slice(0, 10),
        contact: '',
        completion_pct: 100,
        accepted: 'Yes',
        final_payment: 'Paid',
        warranty: 'Yes',
        feedback_date: new Date().toISOString().slice(0, 10),
        feedback: 'Excellent execution quality!',
        design_rating: 5,
        finish_rating: 5,
        install_rating: 5,
        comm_rating: 5,
        refer: 'Yes',
        testimonial: 'Yes'
      });
    }
  };

  const handleJobChange = (jobId) => {
    setSelectedJobId(jobId);
    loadJobHandover(jobId, handovers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createHandover({ job_id: selectedJobId, ...formData });
      alert('Handover & feedback saved successfully!');
      fetchData();
    } catch (err) {
      alert('Error saving handover: ' + err.message);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', margin: 0 }}>Final Handover & Client 5-Star Feedback Matrix</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Capture completion certificates, ratings across 4 pillars, and referral consent.</p>
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

      {/* Form Card */}
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <h4 style={{ fontSize: '15px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck style={{ width: '18px', height: '18px' }} /> Handover Verification
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Handover Date</label>
              <input type="date" value={formData.handover_date} onChange={(e) => setFormData({ ...formData, handover_date: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Client Representative Name</label>
              <input type="text" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="Client Name" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Completion %</label>
              <input type="number" min="0" max="100" value={formData.completion_pct} onChange={(e) => setFormData({ ...formData, completion_pct: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Handover Accepted?</label>
              <select value={formData.accepted} onChange={(e) => setFormData({ ...formData, accepted: e.target.value })}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Warranty Terms Explained?</label>
              <select value={formData.warranty} onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

          <h4 style={{ fontSize: '15px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award style={{ width: '18px', height: '18px' }} /> Customer Satisfaction Ratings (1 to 5 Stars)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Design Rating</label>
              <select value={formData.design_rating} onChange={(e) => setFormData({ ...formData, design_rating: parseInt(e.target.value, 10) })}>
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Finish Rating</label>
              <select value={formData.finish_rating} onChange={(e) => setFormData({ ...formData, finish_rating: parseInt(e.target.value, 10) })}>
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Install Rating</label>
              <select value={formData.install_rating} onChange={(e) => setFormData({ ...formData, install_rating: parseInt(e.target.value, 10) })}>
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Comm Rating</label>
              <select value={formData.comm_rating} onChange={(e) => setFormData({ ...formData, comm_rating: parseInt(e.target.value, 10) })}>
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Client Feedback & Testimonial</label>
            <textarea rows="3" value={formData.feedback} onChange={(e) => setFormData({ ...formData, feedback: e.target.value })} placeholder="Write customer feedback..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Would Refer VUDFIT?</label>
              <select value={formData.refer} onChange={(e) => setFormData({ ...formData, refer: e.target.value })}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Testimonial / Photo OK?</label>
              <select value={formData.testimonial} onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="submit" className="btn btn-primary">Save Handover Record</button>
          </div>
        </form>
      </div>

    </div>
  );
}
