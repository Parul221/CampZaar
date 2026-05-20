import React, { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ListingCard from '../components/shared/ListingCard';
import { api } from '../services/api';
import { listingCategories } from '../data/listingCategories';
import './FeedPage.css';

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Most Popular', value: 'popular' },
];
const conditions = ['All', 'Like New', 'Good', 'Fair'];
const types = ['All', 'sell', 'rent'];

export default function FeedPage() {
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [condition, setCondition] = useState('All');
  const [type, setType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, sort };
      if (activeCategory !== 'all') params.category = activeCategory;
      if (search) params.q = search;
      if (condition !== 'All') params.condition = condition;
      if (type !== 'All') params.type = type;
      const data = await api.getListings(params);
      setListings(data.listings);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, sort, activeCategory, search, condition, type]);

  useEffect(() => {
    const timer = setTimeout(fetchListings, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchListings, search]);

  const SkeletonCard = () => (
    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div className="skeleton" style={{ height: 200 }} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ height: 14, width: '40%' }} />
        <div className="skeleton" style={{ height: 18, width: '80%' }} />
        <div className="skeleton" style={{ height: 22, width: '50%' }} />
        <div className="skeleton" style={{ height: 12, width: '70%' }} />
      </div>
    </div>
  );

  return (
    <div className="feed-page">
      <div className="feed-header">
        <div className="container">
          <h1 className="feed-title">Marketplace <span className="gradient-text">Feed</span></h1>
          <p className="feed-sub">{loading ? 'Loading...' : `${total} listings found`}</p>

          <div className="feed-controls">
            <div className="feed-search-wrap">
              <Search size={18} className="feed-search-icon" />
              <input
                type="text" placeholder="Search anything..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="feed-search-input"
              />
              {search && <button onClick={() => setSearch('')} className="clear-search"><X size={14} /></button>}
            </div>
            <select className="sort-select" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button className={`filter-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={16} /><span>Filters</span>
            </button>
          </div>

          <div className="feed-categories">
            {listingCategories.map(cat => (
              <button key={cat.id}
                className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat.id); setPage(1); }}
                style={{ '--cat-color': cat.color }}
              >
                <span>{cat.icon}</span><span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="feed-body container">
        {showFilters && (
          <aside className="filter-sidebar">
            <div className="filter-group">
              <h4 className="filter-label">Type</h4>
              <div className="filter-options">
                {types.map(t => (
                  <button key={t} className={`filter-option ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
                    {t === 'All' ? 'All' : t === 'sell' ? 'For Sale' : 'For Rent'}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <h4 className="filter-label">Condition</h4>
              <div className="filter-options">
                {conditions.map(c => (
                  <button key={c} className={`filter-option ${condition === c ? 'active' : ''}`} onClick={() => setCondition(c)}>{c}</button>
                ))}
              </div>
            </div>
            <button className="btn-ghost reset-filters" onClick={() => { setCondition('All'); setType('All'); setSort('newest'); }}>
              Reset Filters
            </button>
          </aside>
        )}

        <div className="feed-grid-wrap">
          {loading ? (
            <div className="listings-grid">{[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : listings.length > 0 ? (
            <div className="listings-grid">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No listings found</h3>
              <p>Try adjusting your filters or be the first to list something!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}