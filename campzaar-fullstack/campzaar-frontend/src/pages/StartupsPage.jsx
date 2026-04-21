import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Users, TrendingUp, MapPin, ChevronUp, Rocket } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './StartupsPage.css';

const filters = ['All', 'EdTech', 'FoodTech', 'Marketplace', 'FinTech', 'HealthTech', 'SaaS'];

export default function StartupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startups, setStartups] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = activeFilter !== 'All' ? { category: activeFilter } : {};
    api.getStartups(params)
      .then(setStartups)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeFilter]);

  const toggleUpvote = async (id) => {
    if (!user) { navigate('/auth'); return; }
    try {
      const { upvoted } = await api.upvoteStartup(id);
      setStartups(prev => prev.map(s => s.id === id
        ? { ...s, upvoted, upvotes: upvoted ? s.upvotes + 1 : s.upvotes - 1 }
        : s
      ));
    } catch {}
  };

  return (
    <div className="startups-page">
      <div className="startups-hero">
        <div className="sh-orb sh-orb-1"/><div className="sh-orb sh-orb-2"/>
        <div className="container">
          <div className="sh-badge"><Rocket size={14}/><span>Student-Built Startups</span></div>
          <h1 className="sh-title">Discover the next<br/><span className="gradient-text">unicorn on campus</span></h1>
          <p className="sh-sub">Browse, invest, join, or collaborate with startups built by students like you.</p>
        </div>
      </div>

      <div className="startups-body container">
        <div className="startup-filters">
          {filters.map(f => (
            <button key={f} className={`startup-filter-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="startups-grid">
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ height: 160 }}/>
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...Array(4)].map((_, j) => <div key={j} className="skeleton" style={{ height: 14, width: `${80-j*15}%` }}/>)}
                </div>
              </div>
            ))}
          </div>
        ) : startups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚀</div>
            <h3>No startups yet</h3>
            <p>Be the first to list your startup!</p>
          </div>
        ) : (
          <div className="startups-grid">
            {startups.map(startup => (
              <div key={startup.id} className="startup-card">
                <div className="startup-card-header" style={{ background: `linear-gradient(135deg, hsl(${startup.id.charCodeAt(0)*3%360},60%,35%), hsl(${startup.id.charCodeAt(1)*4%360},70%,45%))` }}>
                  <div className="sc-stage">{startup.stage}</div>
                  <button className={`sc-upvote ${startup.upvoted ? 'upvoted' : ''}`} onClick={() => toggleUpvote(startup.id)}>
                    <ChevronUp size={16}/><span>{startup.upvotes}</span>
                  </button>
                  <h2 className="sc-name">{startup.name}</h2>
                  <p className="sc-tagline">{startup.tagline}</p>
                </div>
                <div className="startup-card-body">
                  <p className="sc-desc">{startup.description}</p>
                  <div className="sc-metrics">
                    {startup.users_count && <><div className="sc-metric"><div className="sc-metric-val">{startup.users_count}</div><div className="sc-metric-label"><Users size={11}/><span>Users</span></div></div><div className="sc-metric-divider"/></>}
                    {startup.mrr && <><div className="sc-metric"><div className="sc-metric-val">{startup.mrr}</div><div className="sc-metric-label"><TrendingUp size={11}/><span>MRR</span></div></div><div className="sc-metric-divider"/></>}
                    <div className="sc-metric">
                      <div className="sc-metric-val">{startup.category}</div>
                      <div className="sc-metric-label"><MapPin size={11}/><span>Sector</span></div>
                    </div>
                  </div>
                  <div className="sc-founders">
                    <div className="sc-founders-label">Founded by</div>
                    <div className="sc-founder">
                      <div className="founder-avatar">{startup.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2) || '?'}</div>
                      <div>
                        <div className="founder-name">{startup.full_name}</div>
                        <div className="founder-role">{startup.college}</div>
                      </div>
                    </div>
                  </div>
                  {startup.tags?.length > 0 && (
                    <div className="sc-tags">{startup.tags.map(t => <span key={t} className="card-tag">{t}</span>)}</div>
                  )}
                  <div className="sc-footer">
                    {startup.raised && <div className="sc-raised"><span className="raised-label">Raised</span><span className="raised-val">{startup.raised}</span></div>}
                    {startup.looking_for && <div className="sc-looking">⭐ {startup.looking_for}</div>}
                  </div>
                  <button className="sc-connect-btn btn-primary" onClick={() => navigate('/chat')}>
                    <span>Connect</span><ArrowUpRight size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="submit-startup-cta">
          <div className="submit-cta-content">
            <div className="submit-cta-icon">🚀</div>
            <div>
              <h3>Have a startup idea?</h3>
              <p>List your startup and find co-founders, users, and investors on campus.</p>
            </div>
          </div>
          <button className="btn-primary submit-cta-btn" onClick={() => navigate(user ? '/add-startup' : '/auth')}>
            Submit Your Startup
          </button>
        </div>
      </div>
    </div>
  );
}
