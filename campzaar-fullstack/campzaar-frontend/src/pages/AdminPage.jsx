import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Users, Package, DollarSign, MapPin, MoreHorizontal, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { adminStats, revenueData, listings } from '../data/mockData';
import './AdminPage.css';

const statCards = [
  {
    label: 'Total Revenue',
    value: `₹${(adminStats.totalRevenue / 100000).toFixed(1)}L`,
    growth: adminStats.revenueGrowth,
    icon: <DollarSign size={20} />,
    color: '#f05a28',
    gradient: 'linear-gradient(135deg, #f05a28, #f7447a)',
  },
  {
    label: 'Active Listings',
    value: adminStats.activeListings.toLocaleString(),
    growth: adminStats.listingsGrowth,
    icon: <Package size={20} />,
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
  },
  {
    label: 'Total Users',
    value: `${(adminStats.totalUsers / 1000).toFixed(1)}K`,
    growth: adminStats.usersGrowth,
    icon: <Users size={20} />,
    color: '#f7447a',
    gradient: 'linear-gradient(135deg, #f7447a, #ff6b35)',
  },
  {
    label: 'Campuses',
    value: adminStats.campuses,
    growth: adminStats.campusesGrowth,
    icon: <MapPin size={20} />,
    color: '#ff8c42',
    gradient: 'linear-gradient(135deg, #ff8c42, #ffbe7d)',
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <div className="tooltip-label">{label}</div>
        {payload.map(p => (
          <div key={p.name} className="tooltip-item">
            <span style={{ color: p.color }}>{p.name}</span>
            <span>₹{p.value?.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminPage() {
  const [activeChart, setActiveChart] = useState('revenue');

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <div className="logo-icon"><span>C</span></div>
          <span>Admin</span>
        </div>

        {[
          { icon: '📊', label: 'Dashboard', active: true },
          { icon: '📦', label: 'Listings' },
          { icon: '👥', label: 'Users' },
          { icon: '🚀', label: 'Startups' },
          { icon: '💬', label: 'Reports' },
          { icon: '⚙️', label: 'Settings' },
        ].map(item => (
          <button key={item.label} className={`admin-nav-item ${item.active ? 'active' : ''}`}>
            <span className="admin-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-main">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Dashboard</h1>
            <p className="admin-sub">Welcome back, Admin 👋</p>
          </div>
          <div className="admin-header-actions">
            <div className="admin-period-select">
              <select>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>This semester</option>
              </select>
            </div>
            <button className="btn-primary admin-export-btn">Export Report</button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="admin-stats-grid">
          {statCards.map(card => (
            <div key={card.label} className="admin-stat-card">
              <div className="asc-top">
                <div className="asc-icon-wrap" style={{ background: card.gradient }}>
                  {card.icon}
                </div>
                <button className="asc-more"><MoreHorizontal size={16} /></button>
              </div>
              <div className="asc-value">{card.value}</div>
              <div className="asc-label">{card.label}</div>
              <div className={`asc-growth ${card.growth > 0 ? 'positive' : 'negative'}`}>
                {card.growth > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{Math.abs(card.growth)}% vs last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="admin-charts-row">
          {/* Main Chart */}
          <div className="admin-chart-card main-chart">
            <div className="chart-header">
              <h3 className="chart-title">Revenue & Listings</h3>
              <div className="chart-tabs">
                {['revenue', 'listings'].map(t => (
                  <button
                    key={t}
                    className={`chart-tab ${activeChart === t ? 'active' : ''}`}
                    onClick={() => setActiveChart(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f05a28" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f05a28" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="listingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f7447a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f7447a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={activeChart}
                    stroke={activeChart === 'revenue' ? '#f05a28' : '#f7447a'}
                    strokeWidth={2.5}
                    fill={activeChart === 'revenue' ? 'url(#revenueGrad)' : 'url(#listingsGrad)'}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Categories */}
          <div className="admin-chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Top Categories</h3>
            </div>
            <div className="category-stats">
              {[
                { name: 'Electronics', pct: 42, color: '#f05a28' },
                { name: 'Books', pct: 28, color: '#f7447a' },
                { name: 'Transport', pct: 15, color: '#ff8c42' },
                { name: 'Furniture', pct: 9, color: '#f97316' },
                { name: 'Others', pct: 6, color: '#ffbe7d' },
              ].map(cat => (
                <div key={cat.name} className="cat-stat-row">
                  <div className="cat-stat-name">{cat.name}</div>
                  <div className="cat-stat-bar-wrap">
                    <div className="cat-stat-bar">
                      <div
                        className="cat-stat-fill"
                        style={{ width: `${cat.pct}%`, background: cat.color }}
                      />
                    </div>
                    <span className="cat-stat-pct">{cat.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Listings Table */}
        <div className="admin-table-card">
          <div className="chart-header">
            <h3 className="chart-title">Recent Listings</h3>
            <button className="see-all-btn">View All</button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Seller</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Type</th>
                  <th>Views</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div className="table-item-cell">
                        <img src={l.image} alt="" className="table-item-img" />
                        <span className="table-item-name">{l.title}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-seller-cell">
                        <div className="table-avatar">{l.seller.avatar}</div>
                        <span>{l.seller.name}</span>
                      </div>
                    </td>
                    <td><span className="table-cat">{l.category}</span></td>
                    <td><span className="table-price">₹{l.price.toLocaleString()}</span></td>
                    <td>
                      <span className={`table-type-badge ${l.type}`}>
                        {l.type === 'sell' ? 'Sale' : 'Rental'}
                      </span>
                    </td>
                    <td>
                      <span className="table-views">
                        <Activity size={12} />
                        {l.views.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="table-status active">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
