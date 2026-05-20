import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, ChevronRight } from 'lucide-react';
import ListingCard from '../components/shared/ListingCard';
import { api } from '../services/api';
import { listingCategories } from '../data/listingCategories';
import './LandingPage.css';
import AnimatedMascot from "../components/AnimatedMascot"; // priyal

const stats = [
  { value: '12K+', label: 'Active Listings' },
  { value: '50+', label: 'Campuses' },
  { value: '98%', label: 'Satisfaction' },
  { value: '₹2Cr+', label: 'Transactions' },
];

const features = [
  { icon: '🛡️', title: 'Verified Students Only', desc: 'Every seller verified with college email. No fakes, no scams.', color: '#f05a28' },
  { icon: '⚡', title: 'Real-Time Chat', desc: 'WebSocket-powered live chat. Close deals in minutes.', color: '#f7447a' },
  { icon: '📅', title: 'Smart Rentals', desc: 'Book by day, week or month. Calendar booking UI.', color: '#ff8c42' },
  { icon: '🚀', title: 'Student Startups', desc: 'Discover campus ventures. Find co-founders and investors.', color: '#ffbe7d' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => { setTimeout(() => setHeroLoaded(true), 100); }, []);

  useEffect(() => {
    setLoading(true);
    const params = { limit: 8, sort: 'newest' };
    if (activeCategory !== 'all') params.category = activeCategory;
    if (searchQuery) params.q = searchQuery;
    api.getListings(params)
      .then(d => setListings(d.listings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory, searchQuery]);

  return (
    <div className="landing-page">
      <section className={`hero ${heroLoaded ? 'loaded' : ''}`}>
        <div className="hero-bg">
          <div className="hero-orb orb-1"/><div className="hero-orb orb-2"/><div className="hero-orb orb-3"/>
          <div className="hero-grid"/>
        </div>
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge"><span className="badge-dot"/><span>Made for college students 🎓</span></div>
            <h1 className="hero-title">Your Campus<br/><span className="gradient-text">Marketplace</span></h1>
            <p className="hero-subtitle">Buy, sell, rent, and discover student startups —<br/>all in one place. Built by students, for students.</p>
            <div className="hero-search">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input type="text" placeholder="Search hoodies, accessories, snacks, notes..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input"/>
              </div>
              <button className="btn-primary explore-btn" onClick={() => navigate('/feed')}>
                <span>Explore</span><ArrowRight size={18}/>
              </button>
            </div>
            <div className="hero-stats">
              {stats.map(s => (
                <div key={s.label} className="hero-stat">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card-stack">
              <div className="hero-main-card"><div className="hmc-img-placeholder"/></div>
              <div className="right-section"><AnimatedMascot /> {/* priyal */}</div>
              <div className="hero-float-card fc-1"><div><div className="fc-title">Clothing</div><div className="fc-sub">Swap and shop</div></div></div>
              <div className="hero-float-card fc-2"><div><div className="fc-title">Eatables</div><div className="fc-sub">Campus favorites</div></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="categories-section">
        <div className="container">
          <div className="categories-scroll">
            {listingCategories.map(cat => (
              <button key={cat.id} className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)} style={{ '--cat-color': cat.color }}>
                <span className="cat-icon">{cat.icon}</span><span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="trending-section">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrap">
              <TrendingUp size={20} className="section-icon"/>
              <h2 className="section-title">Trending Now</h2>
            </div>
            <button className="see-all-btn" onClick={() => navigate('/feed')}>See all <ChevronRight size={16}/></button>
          </div>
          {loading ? (
            <div className="listings-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ borderRadius:'var(--radius-lg)', overflow:'hidden', border:'1px solid var(--border)', background:'var(--bg-card)' }}>
                  <div className="skeleton" style={{ height: 180 }}/>
                  <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
                    <div className="skeleton" style={{ height:14, width:'40%' }}/>
                    <div className="skeleton" style={{ height:18, width:'80%' }}/>
                    <div className="skeleton" style={{ height:22, width:'50%' }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="listings-grid">
              {listings.map(l => <ListingCard key={l.id} listing={l}/>)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>No listings yet — be the first to sell something!</p>
              <button className="btn-primary" style={{ marginTop:16 }} onClick={() => navigate('/add-listing')}>Add Listing</button>
            </div>
          )}
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="features-header">
            <h2 className="section-title">Why <span className="gradient-text">CampZaar?</span></h2>
            <p className="features-sub">The safest, smartest way to trade on campus</p>
          </div>
          <div className="features-grid">
            {features.map(f => (
              <div key={f.title} className="feature-card" style={{ '--feature-color': f.color }}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-orb-1"/><div className="cta-orb-2"/>
            <h2 className="cta-title">Ready to sell something?</h2>
            <p className="cta-sub">List your item in under 2 minutes. Free forever.</p>
            <button className="btn-primary cta-btn" onClick={() => navigate('/add-listing')}>
              <span>Start Selling</span><ArrowRight size={18}/>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
