import { useState, useEffect, useCallback } from 'react';
import { HiOutlineCalendarDays, HiOutlineArrowPath, HiOutlineSquares2X2, HiOutlineBuildingStorefront } from 'react-icons/hi2';
import {
  getCustomers,
  getItemsByCustomer,
  createDailyEntry,
  getDailyEntry,
  getDailyEntriesByDate,
  updateDailyEntry,
  getFrameSellers,
  getFrames,
  getFrameEntries,
  saveFrameEntries,
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
   PREMIUM tab
══════════════════════════════════════════════════ */
function PremiumTab() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [itemEntries, setItemEntries] = useState([]);
  const [existingEntryId, setExistingEntryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // All-customers summary state
  const [summaryRows, setSummaryRows] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const { showToast, ToastComponent } = useToast();

  useEffect(() => { loadCustomers(); }, []);

  // Auto-load summary whenever date changes and no customer is selected
  useEffect(() => {
    if (!selectedCustomerId && selectedDate) {
      loadAllCustomersSummary();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, customers]);

  const loadCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data);
    } catch {
      showToast('Failed to load customers', 'error');
    }
  };

  const loadAllCustomersSummary = async () => {
    if (!customers.length) return;
    setSummaryLoading(true);
    try {
      // 1. Fetch entries for this date
      const entriesRes = await getDailyEntriesByDate(selectedDate);
      const entries = entriesRes.data || [];
      
      // 2. Map every customer to their entry stats
      const aggregated = customers.map(c => {
        const matchingEntry = entries.find(e => e.customerId === c.id);
        const totalPrice = matchingEntry ? (matchingEntry.totalPrice || 0) : 0;
        return {
          id: c.id,
          name: c.name,
          totalPrice
        };
      });

      // Filter to only those with > 0 sales, or show all. Let's show all so user can click to add.
      setSummaryRows(aggregated);
    } catch {
      showToast('Failed to load summary details', 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadEntryData = useCallback(async () => {
    if (!selectedCustomerId || !selectedDate) return;
    setLoading(true);
    setLoaded(false);
    setExistingEntryId(null);
    try {
      const existing = await getDailyEntry(selectedDate, selectedCustomerId).catch(() => null);
      if (existing && existing.data && !Array.isArray(existing.data)) {
        setExistingEntryId(existing.data.id);
        setItemEntries((existing.data.itemEntries || []).map((ie) => ({
          itemId: ie.itemId, itemName: ie.itemName,
          qty: ie.qty, returnQty: ie.returnQty, rate: ie.rate, profitRate: ie.profitRate,
          online: ie.online, finalQty: ie.finalQty, price: ie.price, profit: ie.profit,
        })));
      } else {
        const itemsRes = await getItemsByCustomer(selectedCustomerId);
        setItemEntries((itemsRes.data || []).map((item) => ({
          itemId: item.id, itemName: item.name,
          qty: 0, returnQty: 0, rate: item.defaultRate, profitRate: item.defaultProfitRate,
          online: 0, finalQty: 0, price: 0, profit: 0,
        })));
      }
      setLoaded(true);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId, selectedDate]);

  const updateEntry = (index, field, value) => {
    setItemEntries((prev) => {
      const updated = [...prev];
      const entry = { ...updated[index], [field]: parseFloat(value) || 0 };
      entry.finalQty = entry.qty - entry.returnQty;
      entry.price = entry.finalQty * entry.rate;
      entry.profit = entry.finalQty * entry.profitRate;
      updated[index] = entry;
      return updated;
    });
  };

  const totals = {
    totalPrice: itemEntries.reduce((sum, e) => sum + (e.price || 0), 0),
    totalProfit: itemEntries.reduce((sum, e) => sum + (e.profit || 0), 0),
    totalOnline: itemEntries.reduce((sum, e) => sum + (e.online || 0), 0),
  };

  const handleSave = async () => {
    const payload = {
      date: selectedDate,
      customerId: parseInt(selectedCustomerId),
      itemEntries: itemEntries.filter((e) => e.finalQty > 0 || e.returnQty > 0).map((e) => ({
        itemId: e.itemId, qty: e.qty, returnQty: e.returnQty,
        rate: e.rate, profitRate: e.profitRate, online: e.online,
      })),
    };
    try {
      if (existingEntryId) {
        await updateDailyEntry(existingEntryId, payload);
        showToast('Daily entry updated!');
      } else {
        const res = await createDailyEntry(payload);
        setExistingEntryId(res.data.id);
        showToast('Daily entry saved!');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save entry', 'error');
    }
  };

  const handleCustomerChange = (id) => {
    setSelectedCustomerId(id);
    setLoaded(false);
  };

  const grandTotal = summaryRows.reduce((acc, r) => acc + (r.totalPrice || 0), 0);

  return (
    <>
      <div className="daily-entry-header animate-in">
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="premiumDate">Date</label>
          <input id="premiumDate" type="date" className="form-control" value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setLoaded(false); }} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="premiumCustomer">Customer</label>
          <select id="premiumCustomer" className="form-control" value={selectedCustomerId}
            onChange={(e) => handleCustomerChange(e.target.value)}>
            <option value="">All Customers</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {selectedCustomerId && (
          <button className="btn btn-primary" onClick={loadEntryData}
            disabled={!selectedCustomerId || !selectedDate} style={{ height: '46px' }}>
            <HiOutlineArrowPath /> Load Items
          </button>
        )}
        {!selectedCustomerId && (
          <button className="btn btn-secondary" onClick={loadAllCustomersSummary}
            disabled={!selectedDate || summaryLoading} style={{ height: '46px' }}>
            <HiOutlineArrowPath /> Refresh
          </button>
        )}
      </div>

      {!selectedCustomerId ? (
        /* ══ ALL CUSTOMERS SUMMARY VIEW ══ */
        summaryLoading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="card animate-in-up" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '8%' }}>#</th>
                    <th style={{ width: '67%' }}>Customer Name</th>
                    <th style={{ width: '25%', textAlign: 'right' }}>Total Price (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row, i) => (
                    <tr key={row.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCustomerChange(row.id)}
                      title={`Click to view ${row.name}'s detail`}
                    >
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent), #818cf8)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                          }}>
                            {row.name.charAt(0).toUpperCase()}
                          </span>
                          {row.name}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green)', fontSize: '1rem' }}>
                        ₹{row.totalPrice.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td colSpan={2} style={{ textAlign: 'right', padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      Grand Total sum
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--green)', fontSize: '1.1rem', padding: '14px 20px' }}>
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '10px', marginLeft: '14px', marginBottom: '14px' }}>
              Click any row to view &amp; edit that customer's daily entry.
            </p>
          </div>
        )
      ) : (
        /* ══ SINGLE CUSTOMER DETAIL VIEW ══ */
        loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : !loaded ? (
          <div className="card"><div className="empty-state"><HiOutlineCalendarDays />
            <h3>Ready to load</h3>
            <p>Click "Load Items" to fetch entries for the selected customer and date.</p>
          </div></div>
        ) : itemEntries.length === 0 ? (
          <div className="card"><div className="empty-state"><HiOutlineCalendarDays />
            <h3>No items found</h3>
            <p>This customer has no items configured. Add items first from the Items page.</p>
          </div></div>
        ) : (
          <>
            <div className="table-container animate-in">
              <table>
                <thead>
                  <tr>
                    <th>Item</th><th>Qty</th><th>Return Qty</th><th>Rate (₹)</th>
                    <th>Profit Rate (₹)</th><th>Online (₹)</th><th>Final Qty</th>
                    <th>Price (₹)</th><th>Profit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {itemEntries.map((entry, i) => (
                    <tr key={entry.itemId}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500, minWidth: '140px' }}>{entry.itemName}</td>
                      <td><input type="number" min="0" className="form-control" style={{ width: '80px', padding: '8px 10px', fontSize: '0.85rem' }} value={entry.qty} onChange={(e) => updateEntry(i, 'qty', e.target.value)} /></td>
                      <td><input type="number" min="0" className="form-control" style={{ width: '80px', padding: '8px 10px', fontSize: '0.85rem' }} value={entry.returnQty} onChange={(e) => updateEntry(i, 'returnQty', e.target.value)} /></td>
                      <td><input type="number" step="0.01" min="0" className="form-control" style={{ width: '100px', padding: '8px 10px', fontSize: '0.85rem' }} value={entry.rate} onChange={(e) => updateEntry(i, 'rate', e.target.value)} /></td>
                      <td><input type="number" step="0.01" min="0" className="form-control" style={{ width: '100px', padding: '8px 10px', fontSize: '0.85rem' }} value={entry.profitRate} onChange={(e) => updateEntry(i, 'profitRate', e.target.value)} /></td>
                      <td><input type="number" step="0.01" min="0" className="form-control" style={{ width: '100px', padding: '8px 10px', fontSize: '0.85rem' }} value={entry.online} onChange={(e) => updateEntry(i, 'online', e.target.value)} /></td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{entry.finalQty}</td>
                      <td style={{ fontWeight: 600, color: 'var(--green)' }}>₹{(entry.price || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600, color: 'var(--amber)' }}>₹{(entry.profit || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="totals-bar animate-in" style={{ animationDelay: '100ms' }}>
              <div className="total-card"><div className="total-label">Total Price</div><div className="total-value green">₹{totals.totalPrice.toLocaleString('en-IN')}</div></div>
              <div className="total-card"><div className="total-label">Total Profit</div><div className="total-value blue">₹{totals.totalProfit.toLocaleString('en-IN')}</div></div>
              <div className="total-card"><div className="total-label">Total Online</div><div className="total-value purple">₹{totals.totalOnline.toLocaleString('en-IN')}</div></div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSave} style={{ padding: '14px 32px', fontSize: '0.9rem' }}>
                {existingEntryId ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </>
        )
      )}
      {ToastComponent}
    </>
  );
}

/* ══════════════════════════════════════════════════
   FRAMEWISE tab  (new)
══════════════════════════════════════════════════ */
function FramewiseTab() {
  const [sellers, setSellers] = useState([]);
  const [allFrames, setAllFrames] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Per-seller detail view state
  const [frameRows, setFrameRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // All-sellers summary state
  const [summaryRows, setSummaryRows] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadSellers();
    loadAllFrames();
  }, []);

  // Auto-load summary whenever date changes and no seller is selected
  useEffect(() => {
    if (!selectedSellerId && selectedDate) {
      loadAllSellersSummary();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, sellers]);

  const loadSellers = async () => {
    try {
      const res = await getFrameSellers();
      setSellers(res.data);
    } catch {
      showToast('Failed to load frame sellers', 'error');
    }
  };

  const loadAllFrames = async () => {
    try {
      const res = await getFrames();
      setAllFrames(res.data);
    } catch {
      showToast('Failed to load frames', 'error');
    }
  };

  // Fetch each seller's entries for the date and build a summary row per seller
  const loadAllSellersSummary = async () => {
    if (!selectedDate || sellers.length === 0) return;
    setSummaryLoading(true);
    try {
      const results = await Promise.all(
        sellers.map(async (s) => {
          try {
            const res = await getFrameEntries(selectedDate, s.id);
            const entries = res.data || [];
            const totalCount = entries.reduce((sum, e) => sum + (e.frameCount || 0), 0);
            const totalMrp = entries.reduce((sum, e) => sum + (e.mrp || 0), 0);
            return { id: s.id, name: s.name, totalCount, totalMrp };
          } catch {
            return { id: s.id, name: s.name, totalCount: 0, totalMrp: 0 };
          }
        })
      );
      setSummaryRows(results);
    } catch {
      showToast('Failed to load summary', 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Load per-frame detail for a specific seller
  const loadFramewiseData = async () => {
    if (!selectedSellerId || !selectedDate) return;
    setLoading(true);
    setLoaded(false);
    try {
      const existingRes = await getFrameEntries(selectedDate, selectedSellerId).catch(() => null);
      const existingMap = {};
      if (existingRes && existingRes.data) {
        existingRes.data.forEach((e) => { existingMap[e.frameId] = e; });
      }
      const rows = allFrames.map((f) => ({
        frameId: f.id,
        frameName: f.name,
        frameRate: f.rate,
        frameCount: existingMap[f.id] ? existingMap[f.id].frameCount : 0,
        mrp: existingMap[f.id] ? existingMap[f.id].mrp : 0,
      }));
      setFrameRows(rows);
      setLoaded(true);
    } catch {
      showToast('Failed to load framewise data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateFrameCount = (index, value) => {
    setFrameRows((prev) => {
      const updated = [...prev];
      const count = parseInt(value) || 0;
      updated[index] = { ...updated[index], frameCount: count, mrp: updated[index].frameRate * count };
      return updated;
    });
  };

  const totalMrp = frameRows.reduce((sum, r) => sum + (r.mrp || 0), 0);
  const grandTotal = summaryRows.reduce((sum, r) => sum + (r.totalMrp || 0), 0);

  const handleSave = async () => {
    if (!selectedSellerId || !selectedDate) {
      showToast('Please select date and frame seller', 'error');
      return;
    }
    const entries = frameRows.map((r) => ({ frameId: r.frameId, frameCount: r.frameCount }));
    try {
      await saveFrameEntries(selectedDate, selectedSellerId, entries);
      showToast('Framewise entry saved!');
      loadFramewiseData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save entry', 'error');
    }
  };

  const handleSellerChange = (val) => {
    setSelectedSellerId(val);
    setLoaded(false);
    if (!val) {
      // Switched back to "All" — reload summary
      loadAllSellersSummary();
    }
  };

  return (
    <>
      {/* ── Controls row ── */}
      <div className="daily-entry-header animate-in">
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="frameDate">Date</label>
          <input id="frameDate" type="date" className="form-control" value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setLoaded(false); }} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="frameSeller">Frame Seller</label>
          <select id="frameSeller" className="form-control" value={selectedSellerId}
            onChange={(e) => handleSellerChange(e.target.value)}>
            <option value="">All Sellers</option>
            {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {selectedSellerId && (
          <button className="btn btn-primary" onClick={loadFramewiseData}
            disabled={!selectedSellerId || !selectedDate || allFrames.length === 0} style={{ height: '46px' }}>
            <HiOutlineArrowPath /> Load Frames
          </button>
        )}
        {!selectedSellerId && (
          <button className="btn btn-secondary" onClick={loadAllSellersSummary}
            disabled={!selectedDate || sellers.length === 0} style={{ height: '46px' }}>
            <HiOutlineArrowPath /> Refresh
          </button>
        )}
      </div>

      {/* ── No frames configured warning ── */}
      {allFrames.length === 0 ? (
        <div className="card"><div className="empty-state"><HiOutlineSquares2X2 />
          <h3>No frames configured</h3>
          <p>Add frames from the Items → FRAME tab first.</p>
        </div></div>

      ) : !selectedSellerId ? (
        /* ══ ALL SELLERS SUMMARY VIEW ══ */
        summaryLoading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : sellers.length === 0 ? (
          <div className="card"><div className="empty-state"><HiOutlineBuildingStorefront />
            <h3>No frame sellers</h3>
            <p>Add frame sellers from the Customers → Frame Seller tab first.</p>
          </div></div>
        ) : (
          <div className="animate-in">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '8%' }}>#</th>
                    <th style={{ width: '42%' }}>Frame Seller</th>
                    <th style={{ width: '25%', textAlign: 'center' }}>Total Frame Count</th>
                    <th style={{ width: '25%', textAlign: 'right' }}>Total MRP (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row, i) => (
                    <tr key={row.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSellerChange(String(row.id))}
                      title={`Click to view ${row.name}'s detail`}
                    >
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent), #818cf8)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                          }}>
                            {row.name.charAt(0).toUpperCase()}
                          </span>
                          {row.name}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.totalCount}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green)', fontSize: '1rem' }}>
                        ₹{row.totalMrp.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td colSpan={2} style={{ textAlign: 'right', padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      Grand Total
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)', padding: '14px 20px' }}>
                      {summaryRows.reduce((sum, r) => sum + (r.totalCount || 0), 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--green)', fontSize: '1.1rem', padding: '14px 20px' }}>
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '10px' }}>
              Click any row to view &amp; edit that seller's frame entries.
            </p>
          </div>
        )

      ) : (
        /* ══ SINGLE SELLER DETAIL VIEW ══ */
        loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : !loaded ? (
          <div className="card"><div className="empty-state"><HiOutlineCalendarDays />
            <h3>Ready to load</h3>
            <p>Click "Load Frames" to fetch entries for the selected seller and date.</p>
          </div></div>
        ) : (
          <>
            <div className="table-container animate-in">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Frame Name</th>
                    <th>Rate (₹)</th>
                    <th>Frame Count</th>
                    <th>MRP (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {frameRows.map((row, i) => (
                    <tr key={row.frameId}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{row.frameName}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>₹{row.frameRate}</td>
                      <td>
                        <input type="number" min="0" className="form-control"
                          style={{ width: '100px', padding: '8px 10px', fontSize: '0.85rem' }}
                          value={row.frameCount}
                          onChange={(e) => updateFrameCount(i, e.target.value)} />
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1rem' }}>
                        ₹{(row.mrp || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="totals-bar animate-in" style={{ animationDelay: '100ms' }}>
              <div className="total-card">
                <div className="total-label">Total MRP</div>
                <div className="total-value green">₹{totalMrp.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSave} style={{ padding: '14px 32px', fontSize: '0.9rem' }}>
                Save Entry
              </button>
            </div>
          </>
        )
      )}

      {ToastComponent}
    </>
  );
}

/* ══════════════════════════════════════════════════
   PAGE WRAPPER
══════════════════════════════════════════════════ */
export default function DailyEntryPage() {
  const [activeTab, setActiveTab] = useState('premium');

  return (
    <>
      <div className="page-header">
        <h2>Daily Entry</h2>
        <p>Record daily premium sales and framewise entries</p>
      </div>
      <div className="page-content">
        <div className="tab-bar-container">
          <button style={tabBtn(activeTab === 'premium')} onClick={() => setActiveTab('premium')}>
            Premium
          </button>
          <button style={tabBtn(activeTab === 'framewise')} onClick={() => setActiveTab('framewise')}>
            Framewise
          </button>
        </div>

        {activeTab === 'premium' ? <PremiumTab /> : <FramewiseTab />}
      </div>
    </>
  );
}

