import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const { success, error: toastError } = useToast();

  useEffect(() => {
    api.get('/admin/users').then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    try {
      await api.delete(`/admin/users/${deleteId}`);
      success('Deleted', 'User deleted.');
      setDeleteId(null);
      setUsers(prev => prev.filter(u => String(u.id) !== String(deleteId)));
    } catch (err) { toastError('Error', err.message); }
  }

  const displayed = search ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) : users;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title">Users</h1>
        <input className="form-input" style={{ maxWidth: 260 }} placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {displayed.map(u => (
                  <tr key={String(u.id)}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td className="text-sm">{u.email}</td>
                    <td><span className={`badge ${u.role === 'provider' ? 'badge-primary' : u.role === 'admin' ? 'badge-admin' : 'badge-muted'}`}>{u.role}</span></td>
                    <td className="text-sm text-muted">{u.phone || '—'}</td>
                    <td className="text-sm text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => setDeleteId(u.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete User"
        message="This action is permanent. All user data will be removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
