import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';

const CATEGORIES = ['Hair', 'Skin', 'Nails', 'Wellness', 'Lashes', 'Makeup'];

const EMPTY_FORM = { name: '', category: 'Hair', duration: 60, price: '' };

export default function ProviderServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await api.get('/provider/services').catch(() => []);
    setServices(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })); }

  function openAdd() { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }
  function openEdit(s) {
    setForm({ name: s.name, category: s.category || 'Hair', duration: s.duration, price: String(s.price) });
    setEditId(s._id || s.id);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name || !form.price) { toastError('Error', 'Name and price are required'); return; }
    setSaving(true);
    try {
      const body = { name: form.name, category: form.category, duration: Number(form.duration), price: Number(form.price) };
      if (editId) await api.put(`/provider/services/${editId}`, body);
      else await api.post('/provider/services', body);
      success('Saved', editId ? 'Service updated.' : 'Service added.');
      setShowForm(false);
      load();
    } catch (err) {
      toastError('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/provider/services/${deleteId}`);
      success('Removed', 'Service removed.');
      setDeleteId(null);
      load();
    } catch (err) {
      toastError('Error', err.message);
    }
  }

  const active = services.filter(s => s.isActive !== false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">My Services</h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Service</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : active.length === 0 ? (
        <div className="empty-state">
          <h3>No services yet</h3>
          <p>Add your first service to start receiving bookings.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openAdd}>+ Add Service</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {active.map(s => (
            <div key={String(s._id || s.id)} className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontWeight: 600 }}>{s.name}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {s.category && <span className="badge badge-primary">{s.category}</span>}
                  <span className="text-xs text-muted">⏱ {s.duration} min</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>SAR {s.price}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(s._id || s.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editId ? 'Edit Service' : 'Add Service'}</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Service Name</label>
                <input className="form-input" placeholder="e.g. Deep Conditioning Treatment" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Duration (min)</label>
                  <input className="form-input" type="number" min={15} step={15} value={form.duration} onChange={e => set('duration', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Price (SAR)</label>
                  <input className="form-input" type="number" min={1} placeholder="e.g. 250" value={form.price} onChange={e => set('price', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving && <span className="spinner" />}
                  {editId ? 'Save Changes' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Remove Service"
        message="This service will be deactivated and won't appear to clients."
        confirmLabel="Remove"
        cancelLabel="Keep"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
