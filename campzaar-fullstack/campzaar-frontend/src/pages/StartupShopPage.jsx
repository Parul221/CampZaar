import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Globe, PlusCircle, Rocket, Store, Users } from 'lucide-react';
import ListingCard from '../components/shared/ListingCard';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import './StartupShopPage.css';

export default function StartupShopPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getStartup(id)
      .then(setStartup)
      .catch(() => navigate('/startups'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="startup-shop-page">
        <div className="container">
          <div className="skeleton startup-shop-skeleton" />
          <div className="listings-grid">
            {[...Array(3)].map((_, index) => <div key={index} className="skeleton startup-product-skeleton" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!startup) return null;

  const isFounder = startup.founder_id === user?.id;

  return (
    <div className="startup-shop-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
          <span>Back</span>
        </button>

        <section className="startup-shop-hero">
          <div className="startup-shop-copy">
            <div className="startup-shop-badge">
              <Rocket size={14} />
              <span>{startup.stage}</span>
            </div>
            <h1>{startup.name}</h1>
            <p>{startup.tagline}</p>
            <div className="startup-shop-meta">
              <span><Users size={14} /> {startup.full_name}</span>
              <span><Store size={14} /> {startup.product_count} products</span>
              <span>{startup.category}</span>
            </div>
          </div>

          <div className="startup-shop-panel">
            <p>{startup.description}</p>
            {startup.looking_for && <div className="startup-chip">Best for: {startup.looking_for}</div>}
            {startup.raised && <div className="startup-chip">Price note: {startup.raised}</div>}
            {startup.website && (
              <a className="startup-website" href={startup.website} target="_blank" rel="noreferrer">
                <Globe size={14} />
                <span>{startup.website}</span>
              </a>
            )}
            <div className="startup-shop-actions">
              {isFounder && (
                <button className="btn-primary" onClick={() => navigate('/add-listing')}>
                  <PlusCircle size={16} />
                  <span>Add Product</span>
                </button>
              )}
              <button className="btn-ghost" onClick={() => navigate('/chat')}>
                Contact Shop Owner
              </button>
            </div>
          </div>
        </section>

        <section className="startup-catalogue-section">
          <div className="startup-catalogue-header">
            <div>
              <h2>Full Product Catalogue</h2>
              <p>Everything this student shop is currently selling on CampZaar.</p>
            </div>
          </div>

          {startup.products.length > 0 ? (
            <div className="listings-grid">
              {startup.products.map((product) => <ListingCard key={product.id} listing={product} />)}
            </div>
          ) : (
            <div className="empty-state startup-empty-state">
              <div className="empty-icon">🛍️</div>
              <h3>No products yet</h3>
              <p>{isFounder ? 'Add your first product to make this shop live.' : 'This shop has been registered and products will appear here soon.'}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
