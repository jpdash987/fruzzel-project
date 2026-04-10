import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineUserGroup, HiOutlineBuildingStorefront } from 'react-icons/hi2';
import {
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  getFrameSellers, createFrameSeller, updateFrameSeller, deleteFrameSeller,
} from '../api/api';
import { useToast } from '../components/Toast';

/* ── shared pill-tab styles ── */
const tabBar = { display: 'flex', gap: '8px', marginBottom: '20px' };
const tabBtn = (active) => ({
  padding: '8px 20px',
  borderRadius: '20px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.85rem',
  transition: 'all 0.2s',
  background: active ? 'var(--accent)' : 'var(--bg-secondary)',
  color: active ? '#fff' : 'var(--text-secondary)',
  boxShadow: active ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
});

/* ══════════════════════════════════════════════════
   FIELD DRIVER tab  (original customers logic)
══════════════════════════════════════════════════ */
function FieldDriverTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formName, setFormName] = useState('');
  const { showToast, ToastComponent } = useToast();

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data);
    } catch {
      showToast('Failed to load field drivers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingCustomer(null); setFormName(''); setShowModal(true); };
  const openEdit = (c) => { setEditingCustomer(c); setFormName(c.name); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, { name: formName.trim() });
        showToast('Field driver updated successfully');
      } else {
        await createCustomer({ name: formName.trim() });
        showToast('Field driver created successfully');
      }
      setShowModal(false);
      loadCustomers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await deleteCustomer(id);
      showToast('Field driver deleted');
      loadCustomers();
    } catch {
      showToast('Failed to delete field driver', 'error');
    }
  };

  return (
    <>
      <div className="action-bar">
        <div />
        <button className="btn btn-primary" onClick={openCreate}>
          <HiOutlinePlus /> Add Field Driver
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : customers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <HiOutlineUserGroup />
            <h3>No field drivers yet</h3>
            <p>Add your first field driver to get started.</p>
          </div>
        </div>
      ) : (
        <div className="table-container animate-in">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(c)} title="Edit"><HiOutlinePencil /></button>
                    {' '}
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(c.id, c.name)} title="Delete"><HiOutlineTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCustomer ? 'Edit Field Driver' : 'New Field Driver'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="fdName">Field Driver Name</label>
                  <input id="fdName" type="text" className="form-control" placeholder="Enter name..." value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingCustomer ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {ToastComponent}
    </>
  );
}

/* ══════════════════════════════════════════════════
   FRAME SELLER tab  (new logic)
══════════════════════════════════════════════════ */
function FrameSellerTab() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [formName, setFormName] = useState('');
  const { showToast, ToastComponent } = useToast();

  useEffect(() => { loadSellers(); }, []);

  const loadSellers = async () => {
    try {
      const res = await getFrameSellers();
      setSellers(res.data);
    } catch {
      showToast('Failed to load frame sellers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingSeller(null); setFormName(''); setShowModal(true); };
  const openEdit = (s) => { setEditingSeller(s); setFormName(s.name); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    try {
      if (editingSeller) {
        await updateFrameSeller(editingSeller.id, { name: formName.trim() });
        showToast('Frame seller updated successfully');
      } else {
        await createFrameSeller({ name: formName.trim() });
        showToast('Frame seller created successfully');
      }
      setShowModal(false);
      loadSellers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await deleteFrameSeller(id);
      showToast('Frame seller deleted');
      loadSellers();
    } catch {
      showToast('Failed to delete frame seller', 'error');
    }
  };

  return (
    <>
      <div className="action-bar">
        <div />
        <button className="btn btn-primary" onClick={openCreate}>
          <HiOutlinePlus /> Add Frame Seller
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : sellers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <HiOutlineBuildingStorefront />
            <h3>No frame sellers yet</h3>
            <p>Add your first frame seller to get started.</p>
          </div>
        </div>
      ) : (
        <div className="table-container animate-in">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(s)} title="Edit"><HiOutlinePencil /></button>
                    {' '}
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(s.id, s.name)} title="Delete"><HiOutlineTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSeller ? 'Edit Frame Seller' : 'New Frame Seller'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="fsName">Frame Seller Name</label>
                  <input id="fsName" type="text" className="form-control" placeholder="Enter name..." value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSeller ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {ToastComponent}
    </>
  );
}

/* ══════════════════════════════════════════════════
   PAGE WRAPPER
══════════════════════════════════════════════════ */
export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState('fieldDriver');

  return (
    <>
      <div className="page-header">
        <h2>Customers</h2>
        <p>Manage field drivers and frame sellers</p>
      </div>
      <div className="page-content">
        <div className="tab-bar-container">
          <button style={tabBtn(activeTab === 'fieldDriver')} onClick={() => setActiveTab('fieldDriver')}>
            Field Driver
          </button>
          <button style={tabBtn(activeTab === 'frameSeller')} onClick={() => setActiveTab('frameSeller')}>
            Frame Seller
          </button>
        </div>

        {activeTab === 'fieldDriver' ? <FieldDriverTab /> : <FrameSellerTab />}
      </div>
    </>
  );
}
