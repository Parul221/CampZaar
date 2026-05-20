import React, { useState, useEffect } from 'react';
import { ArrowUpRight, MapPin, ChevronUp, Rocket, Store, Tag } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './StartupsPage.css';

const filters = ['All', 'Clothing', 'Accessories', 'Eatables', 'Handmade', 'Stationery & Gifts', 'Beauty & Care', 'Decor', 'Other'];

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
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { upvoted } = await api.upvoteStartup(id);
      setStartups((prev) => prev.map((shop) => (
        shop.id === id
          ? { ...shop, upvoted, upvotes: upvoted ? shop.upvotes + 1 : shop.upvotes - 1 }
          : shop
      )));
    } catch {}
  };

  return (
    <div className="startups-page">
      <div className="startups-hero">
        <div className="sh-orb sh-orb-1" />
        <div className="sh-orb sh-orb-2" />
        <div className="container">
          <div className="sh-badge"><Rocket size={14} /><span>Student-Owned Shops</span></div>
          <h1 className="sh-title">Discover campus<br /><span className="gradient-text">brands and small shops</span></h1>
          <p className="sh-sub">Browse clothes, handmade pieces, food, gifts, and other student-run shops all in one place.</p>
        </div>
      </div>

      <div className="startups-body container">
        <div className="startup-filters">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`startup-filter-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="startups-grid">
            {[...Array(3)].map((_, index) => (
              <div key={index} style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ height: 160 }} />
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...Array(4)].map((_, line) => <div key={line} className="skeleton" style={{ height: 14, width: `${80 - line * 15}%` }} />)}
                </div>
              </div>
            ))}
          </div>
        ) : startups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛍️</div>
            <h3>No shops yet</h3>
            <p>Be the first to register your student shop.</p>
          </div>
        ) : (
          <div className="startups-grid">
            {startups.map((startup) => (
              <div key={startup.id} className="startup-card">
                <div
                  className="startup-card-header"
                  style={{ background: `linear-gradient(135deg, hsl(${startup.id.charCodeAt(0) * 3 % 360},60%,35%), hsl(${startup.id.charCodeAt(1) * 4 % 360},70%,45%))` }}
                >
                  <div className="sc-stage">{startup.stage}</div>
                  <button className={`sc-upvote ${startup.upvoted ? 'upvoted' : ''}`} onClick={() => toggleUpvote(startup.id)}>
                    <ChevronUp size={16} />
                    <span>{startup.upvotes}</span>
                  </button>
                  <h2 className="sc-name">{startup.name}</h2>
                  <p className="sc-tagline">{startup.tagline}</p>
                </div>

                <div className="startup-card-body">
                  <p className="sc-desc">{startup.description}</p>

                  <div className="sc-metrics">
                    {startup.product_count ? (
                      <>
                        <div className="sc-metric">
                          <div className="sc-metric-val">{startup.product_count}</div>
                          <div className="sc-metric-label"><Store size={11} /><span>Products</span></div>
                        </div>
                        <div className="sc-metric-divider" />
                      </>
                    ) : null}
                    {startup.tags?.[0] ? (
                      <>
                        <div className="sc-metric">
                          <div className="sc-metric-val">{startup.tags[0]}</div>
                          <div className="sc-metric-label"><Tag size={11} /><span>Style</span></div>
                        </div>
                        <div className="sc-metric-divider" />
                      </>
                    ) : null}
                    <div className="sc-metric">
                      <div className="sc-metric-val">{startup.category}</div>
                      <div className="sc-metric-label"><MapPin size={11} /><span>Category</span></div>
                    </div>
                  </div>

                  <div className="sc-founders">
                    <div className="sc-founders-label">Owned by</div>
                    <div className="sc-founder">
                      <div className="founder-avatar">{startup.full_name?.split(' ').map((word) => word[0]).join('').slice(0, 2) || '?'}</div>
                      <div>
                        <div className="founder-name">{startup.full_name}</div>
                        <div className="founder-role">{startup.college}</div>
                      </div>
                    </div>
                  </div>

                  {startup.tags?.length > 0 && (
                    <div className="sc-tags">{startup.tags.map((tag) => <span key={tag} className="card-tag">{tag}</span>)}</div>
                  )}

                  <div className="sc-footer">
                    {startup.raised && (
                      <div className="sc-raised">
                        <span className="raised-label">Price note</span>
                        <span className="raised-val">{startup.raised}</span>
                      </div>
                    )}
                    {startup.looking_for && <div className="sc-looking">★ {startup.looking_for}</div>}
                  </div>

                  <div className="sc-actions">
                    <button className="sc-connect-btn btn-primary" onClick={() => navigate(`/startups/${startup.id}`)}>
                      <Store size={16} />
                      <span>Open Shop</span>
                    </button>
                    <button className="sc-connect-btn btn-ghost" onClick={() => navigate('/chat')}>
                      <span>Connect</span>
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="submit-startup-cta">
          <div className="submit-cta-content">
            <div className="submit-cta-icon">🛍️</div>
            <div>
              <h3>Have a student-run shop?</h3>
              <p>Register your brand, boutique, handmade business, or food page and show the full catalogue on campus.</p>
            </div>
          </div>
          <button className="btn-primary submit-cta-btn" onClick={() => navigate(user ? '/startups/new' : '/auth')}>
            Register Your Shop
          </button>
        </div>
      </div>
    </div>
  );
}
