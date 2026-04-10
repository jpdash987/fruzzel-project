import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiOutlineChartBarSquare, 
  HiOutlineUserGroup, 
  HiOutlineCube, 
  HiOutlineCalendarDays,
  HiOutlineCalculator,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineXMark
} from 'react-icons/hi2';

const navItems = [
  { to: '/', icon: HiOutlineChartBarSquare, label: 'Dashboard' },
  { to: '/customers', icon: HiOutlineUserGroup, label: 'Customers' },
  { to: '/items', icon: HiOutlineCube, label: 'Items' },
  { to: '/daily-entry', icon: HiOutlineCalendarDays, label: 'Daily Entry' },
  { to: '/profit-loss', icon: HiOutlineCalculator, label: 'Profit/Loss' },
];

export default function Layout({ children, username, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <HiOutlineXMark /> : <HiOutlineBars3 />}
        </button>
        <div className="mobile-brand">
          <img src="/logo.png" alt="Z Logo" className="brand-logo brand-logo-sm" />
          <span>Sales Tracker</span>
        </div>
        <div style={{ width: 36 }} />
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Z Logo" className="brand-logo" />
          <div>
            <h1>Sales Tracker</h1>
            <p>Profit &amp; Online System</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {(username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{username || 'Admin'}</span>
              <span className="sidebar-user-role">Administrator</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onLogout} style={{ width: '100%', justifyContent: 'center' }}>
            <HiOutlineArrowRightOnRectangle /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
