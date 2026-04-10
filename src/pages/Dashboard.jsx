import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getAllDailyEntries } from '../api/api';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState([]);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const res = await getAllDailyEntries();
      const entries = res.data || [];

      // 1. Aggregate for Timeline (Area Graph) & Bar Chart
      const dailyMap = {};
      entries.forEach(e => {
        if (!dailyMap[e.date]) dailyMap[e.date] = { date: e.date, Sales: 0, Profit: 0, Online: 0 };
        dailyMap[e.date].Sales += (e.totalPrice || 0);
        dailyMap[e.date].Profit += (e.totalProfit || 0);
        dailyMap[e.date].Online += (e.totalOnline || 0);
      });
      // Sort by date ascending (oldest first)
      const timelineArray = Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
      setTimelineData(timelineArray);

      // 2. Aggregate for Top Customers (Pie/Doughnut Chart)
      const customerMap = {};
      entries.forEach(e => {
        const name = e.customerName || 'Unknown';
        if (!customerMap[name]) customerMap[name] = { name, value: 0 };
        customerMap[name].value += (e.totalPrice || 0);
      });
      // Sort descending by value and take top 5
      const pieArray = Object.values(customerMap)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      setPieData(pieArray);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '24px' }}>
        <div className="page-header">
          <h2>Dashboard</h2>
          <p>Visual analytics and overall system performance</p>
        </div>
        <div className="loading-spinner"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Visual analytics and overall system performance</p>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Timeline Chart Container */}
        <div className="card shadow-md animate-in" style={{ padding: '24px', animationDelay: '50ms' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Sales vs Profit Trajectory</h3>
          {timelineData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No historical entries to graph. Add some daily entries!
            </div>
          ) : (
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                         tickFormatter={(val) => `₹${val}`} />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle"/>
                  <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="Profit" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Lower Grid: Bar Chart & Doughnut */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          
          {/* Bar Chart: Profit vs Online */}
          <div className="card shadow-md animate-in" style={{ padding: '24px', animationDelay: '100ms' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Collection Types</h3>
            {timelineData.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No historical entries to graph.
              </div>
            ) : (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                          tickFormatter={(val) => `₹${val}`} />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle"/>
                    <Bar dataKey="Profit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Online" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Customers Doughnut */}
          <div className="card shadow-md animate-in" style={{ padding: '24px', animationDelay: '150ms' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Top Grossing Customers</h3>
            {pieData.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No customer statistics found.
              </div>
            ) : (
              <div style={{ width: '100%', height: 350, display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
