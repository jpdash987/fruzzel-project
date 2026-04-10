import { useState, useEffect } from 'react';
import { HiOutlineArrowPath } from 'react-icons/hi2';
import {
  getDailyEntriesByDate,
  getFrameSellers,
  getFrameEntries,
  getDailyExpenses,
  createDailyExpense,
  deleteDailyExpense
} from '../api/api';
import { useToast } from '../components/Toast';

export default function ProfitLossPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [premiumIncome, setPremiumIncome] = useState(0);
  const [frameIncome, setFrameIncome] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newExpName, setNewExpName] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    if (selectedDate) loadDayData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const loadDayData = async () => {
    setLoading(true);
    try {
      const pRes = await getDailyEntriesByDate(selectedDate);
      const premiumSum = (pRes.data || []).reduce((acc, entry) => acc + (entry.totalPrice || 0), 0);
      setPremiumIncome(premiumSum);
      const sellersRes = await getFrameSellers();
      const sellers = sellersRes.data || [];
      const frameResults = await Promise.all(
        sellers.map(async (s) => {
          try {
            const res = await getFrameEntries(selectedDate, s.id);
            return (res.data || []).reduce((acc, e) => acc + (e.mrp || 0), 0);
          } catch { return 0; }
        })
      );
      setFrameIncome(frameResults.reduce((acc, val) => acc + val, 0));
      const expRes = await getDailyExpenses(selectedDate);
      setExpenses(expRes.data || []);
    } catch (err) {
      showToast('Failed to load P/L data for this date', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpName.trim() || !newExpAmount) {
      showToast('Name and Amount are required', 'error');
      return;
    }
    const payload = { date: selectedDate, expenseName: newExpName.trim(), amount: parseFloat(newExpAmount) };
    setSaving(true);
    try {
      const res = await createDailyExpense(payload);
      setExpenses([...expenses, res.data]);
      setNewExpName('');
      setNewExpAmount('');
      showToast('Expense added!', 'success');
    } catch {
      showToast('Failed to add expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteDailyExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
      showToast('Expense removed', 'success');
    } catch {
      showToast('Failed to delete expense', 'error');
    }
  };

  const totalIncome = premiumIncome + frameIncome;
  const totalExpenditure = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netProfit = totalIncome - totalExpenditure;

  return (
    <>
      <div className="page-header">
        <h2>Profit &amp; Loss</h2>
        <p>Analyze global daily income against expenditures</p>
      </div>
      <div className="page-content">
        <div className="daily-entry-header animate-in" style={{ marginBottom: '24px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="plDate">Date</label>
            <input id="plDate" type="date" className="form-control" value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <div></div>
          <button className="btn btn-secondary" onClick={loadDayData}
            disabled={!selectedDate || loading} style={{ height: '46px' }}>
            <HiOutlineArrowPath /> Refresh
          </button>
        </div>
        
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Income</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Premium Grand Total</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{premiumIncome.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Framewise Grand Total</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{frameIncome.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(0, 155, 58, 0.1)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1.1rem' }}>Total Income</span>
                <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: '1.4rem' }}>₹{totalIncome.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div className="card">
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Expenditure</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '20px', alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Expense Name</label>
                  <input type="text" className="form-control" placeholder="e.g. EXP1" value={newExpName} onChange={(e) => setNewExpName(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Amount (₹)</label>
                  <input type="number" min="0" step="0.01" className="form-control" placeholder="0" value={newExpAmount} onChange={(e) => setNewExpAmount(e.target.value)} />
                </div>
                <button className="btn btn-primary" style={{ height: '46px' }} onClick={handleAddExpense} disabled={saving}>Add</button>
              </div>
              
              {expenses.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '60%' }}>Expense Detail</th>
                        <th style={{ width: '25%', textAlign: 'right' }}>Amount (₹)</th>
                        <th style={{ width: '15%', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((exp) => (
                        <tr key={exp.id}>
                          <td style={{ fontWeight: 600 }}>{exp.expenseName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--amber)' }}>₹{exp.amount.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '4px' }} onClick={() => handleDeleteExpense(exp.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '20px' }}><p>No expenditures recorded for this date yet.</p></div>
              )}
              
              <div style={{ padding: '16px', marginTop: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--red)', fontSize: '1.1rem' }}>Total Expenditure</span>
                <span style={{ fontWeight: 800, color: 'var(--red)', fontSize: '1.4rem' }}>₹{totalExpenditure.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div className="card" style={{ background: netProfit >= 0 ? 'var(--gradient-primary)' : 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.9, marginBottom: '8px' }}>{netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>₹{Math.abs(netProfit).toLocaleString('en-IN')}</div>
            </div>
          </div>
        )}
      </div>
      {ToastComponent}
    </>
  );
}
