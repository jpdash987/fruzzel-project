import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineCube, HiOutlineSquares2X2 } from 'react-icons/hi2';
import {
  getCustomers, getItemsByCustomer, createItem, updateItem, deleteItem,
  getFrames, createFrame, updateFrame, deleteFrame,
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
   PITEM tab  (original items logic — unchanged)
══════════════════════════════════════════════════ */
function PItemTab() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: '', defaultRate: '', defaultProfitRate: '', customerId: '' });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => { loadCustomers(); }, []);
  useEffect(() => {
    if (selectedCustomerId) loadItems(selectedCustomerId);
    else setItems([]);
  }, [selectedCustomerId]);

  const loadCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data);
      if (res.data.length > 0) setSelectedCustomerId(res.data[0].id);
    } catch {
      showToast('Failed to load customers', 'error');
    }
  };

  const loadItems = async (custId) => {
    setLoading(true);
    try {
      const res = await getItemsByCustomer(custId);
      setItems(res.data);
    } catch {
      showToast('Failed to load items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({ name: '', defaultRate: '', defaultProfitRate: '', customerId: selectedCustomerId });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ name: item.name, defaultRate: item.defaultRate, defaultProfitRate: item.defaultProfitRate, customerId: item.customerId });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      defaultRate: parseFloat(form.defaultRate),
      defaultProfitRate: parseFloat(form.defaultProfitRate),
      customerId: parseInt(form.customerId),
    };
    try {
      if (editingItem) {
        await updateItem(editingItem.id, payload);
        showToast('Item updated successfully');
      } else {
        await createItem(payload);
        showToast('Item created successfully');
      }
      setShowModal(false);
      loadItems(selectedCustomerId);
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await deleteItem(id);
      showToast('Item deleted');
      loadItems(selectedCustomerId);
    } catch {
      showToast('Failed to delete item', 'error');
    }
  };

  return (
    <>
      <div className="action-bar">
        <div className="filters">
          <select className="form-control" style={{ width: '250px' }} value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
            <option value="">Select Customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreate} disabled={!selectedCustomerId}>
          <HiOutlinePlus /> Add Item
        </button>
      </div>

      {!selectedCustomerId ? (
        <div className="card"><div className="empty-state"><HiOutlineCube /><h3>Select a customer</h3><p>Choose a customer to view and manage their items.</p></div></div>
      ) : loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="card"><div className="empty-state"><HiOutlineCube /><h3>No items yet</h3><p>Add items for this customer to start tracking sales.</p></div></div>
      ) : (
        <div className="table-container animate-in">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Item Name</th><th>Default Rate (₹)</th><th>Default Profit Rate (₹)</th><th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>₹{item.defaultRate}</td>
                  <td style={{ color: 'var(--amber)', fontWeight: 600 }}>₹{item.defaultProfitRate}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(item)} title="Edit"><HiOutlinePencil /></button>
                    {' '}
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(item.id, item.name)} title="Delete"><HiOutlineTrash /></button>
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
              <h3>{editingItem ? 'Edit Item' : 'New Item'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="pitemName">Item Name</label>
                  <input id="pitemName" type="text" className="form-control" placeholder="Enter item name..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pitemRate">Default Rate (₹)</label>
                    <input id="pitemRate" type="number" step="0.01" min="0" className="form-control" placeholder="0.00" value={form.defaultRate} onChange={(e) => setForm({ ...form, defaultRate: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pitemProfit">Default Profit Rate (₹)</label>
                    <input id="pitemProfit" type="number" step="0.01" min="0" className="form-control" placeholder="0.00" value={form.defaultProfitRate} onChange={(e) => setForm({ ...form, defaultProfitRate: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="pitemCustomer">Customer</label>
                  <select id="pitemCustomer" className="form-control" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update' : 'Create'}</button>
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
   FRAME tab  (new — name + rate, no customer link)
══════════════════════════════════════════════════ */
function FrameTab() {
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFrame, setEditingFrame] = useState(null);
  const [form, setForm] = useState({ name: '', rate: '' });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => { loadFrames(); }, []);

  const loadFrames = async () => {
    try {
      const res = await getFrames();
      setFrames(res.data);
    } catch {
      showToast('Failed to load frames', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingFrame(null); setForm({ name: '', rate: '' }); setShowModal(true); };
  const openEdit = (f) => { setEditingFrame(f); setForm({ name: f.name, rate: f.rate }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { name: form.name.trim(), rate: parseFloat(form.rate) };
    try {
      if (editingFrame) {
        await updateFrame(editingFrame.id, payload);
        showToast('Frame updated successfully');
      } else {
        await createFrame(payload);
        showToast('Frame created successfully');
      }
      setShowModal(false);
      loadFrames();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await deleteFrame(id);
      showToast('Frame deleted');
      loadFrames();
    } catch {
      showToast('Failed to delete frame', 'error');
    }
  };

  return (
    <>
      <div className="action-bar">
        <div />
        <button className="btn btn-primary" onClick={openCreate}>
          <HiOutlinePlus /> Add Frame
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : frames.length === 0 ? (
        <div className="card"><div className="empty-state"><HiOutlineSquares2X2 /><h3>No frames yet</h3><p>Add frames with their rate to start tracking.</p></div></div>
      ) : (
        <div className="table-container animate-in">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Frame Name</th><th>Rate (₹)</th><th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {frames.map((f, i) => (
                <tr key={f.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{f.name}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>₹{f.rate}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(f)} title="Edit"><HiOutlinePencil /></button>
                    {' '}
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(f.id, f.name)} title="Delete"><HiOutlineTrash /></button>
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
              <h3>{editingFrame ? 'Edit Frame' : 'New Frame'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="frameName">Frame Name</label>
                  <input id="frameName" type="text" className="form-control" placeholder="Enter frame name..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus required />
                </div>
                <div className="form-group">
                  <label htmlFor="frameRate">Rate (₹)</label>
                  <input id="frameRate" type="number" step="0.01" min="0" className="form-control" placeholder="e.g. 90" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingFrame ? 'Update' : 'Create'}</button>
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
export default function ItemsPage() {
  const [activeTab, setActiveTab] = useState('pitem');

  return (
    <>
      <div className="page-header">
        <h2>Items</h2>
        <p>Manage premium items and frames</p>
      </div>
      <div className="page-content">
        <div className="tab-bar-container">
          <button style={tabBtn(activeTab === 'pitem')} onClick={() => setActiveTab('pitem')}>
            PITEM
          </button>
          <button style={tabBtn(activeTab === 'frame')} onClick={() => setActiveTab('frame')}>
            FRAME
          </button>
        </div>

        {activeTab === 'pitem' ? <PItemTab /> : <FrameTab />}
      </div>
    </>
  );
}
