import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getClientsApi, addClientApi, updateClientApi, deleteClientApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const emptyForm = { name: '', email: '', phone: '', address: '', industry: '' };

const ClientManagement = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchClients = async () => {
    try {
      const data = await getClientsApi(user.id);
      setClients(data);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Client name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    return errs;
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (client) => {
    setEditing(client.id);
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address || '',
      industry: client.industry || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      if (editing) {
        await updateClientApi(editing, form);
        toast.success('Client updated successfully');
      } else {
        await addClientApi({ ...form, userId: user.id });
        toast.success('Client added successfully');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(null);
      fetchClients();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await deleteClientApi(id);
      toast.success('Client deleted');
      fetchClients();
    } catch {
      toast.error('Failed to delete client');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Client Management</h1>
          <p className="page-subtitle">Manage your clients</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Client</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Industry</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No clients yet. Click "Add Client" to get started.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.email}</td>
                    <td>{client.phone}</td>
                    <td>{client.industry || '—'}</td>
                    <td>{new Date(client.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(client)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(client.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Client' : 'Add Client'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Client Name</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Enter client name" />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Enter email" />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="Enter phone number" />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input id="address" name="address" value={form.address} onChange={handleChange} placeholder="Enter address" />
              </div>
              <div className="form-group">
                <label htmlFor="industry">Industry</label>
                <input id="industry" name="industry" value={form.industry} onChange={handleChange} placeholder="Enter industry" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
