import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import ListingCard from '../components/shared/ListingCard';
import './WishlistPage.css';

export default function WishlistPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api.getWishlist()
      .then((data) => {
        if (!mounted) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="wishlist-page">
      <div className="wishlist-hero">
        <div className="container">
          <button className="wishlist-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>

          <div className="wishlist-hero-copy">
            <div className="wishlist-kicker">Saved Listings</div>
            <h1>Your Wishlist</h1>
            <p>
              Keep track of the items you want to revisit before they disappear from the marketplace.
            </p>
          </div>
        </div>
      </div>

      <div className="container wishlist-content">
        {loading ? (
          <div className="wishlist-grid">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="wishlist-skeleton-card">
                <div className="skeleton wishlist-skeleton-image" />
                <div className="wishlist-skeleton-body">
                  <div className="skeleton" style={{ height: 14, width: '38%' }} />
                  <div className="skeleton" style={{ height: 20, width: '72%' }} />
                  <div className="skeleton" style={{ height: 18, width: '44%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="wishlist-summary">
              <Heart size={16} />
              <span>
                {items.length} saved listing{items.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="wishlist-grid">
              {items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} variant="compact" />
              ))}
            </div>
          </>
        ) : (
          <div className="wishlist-empty glass-card">
            <div className="wishlist-empty-icon">
              <Heart size={28} />
            </div>
            <h2>No saved listings yet</h2>
            <p>Tap the heart on any product card to save it here for later.</p>
            <button className="btn-primary" onClick={() => navigate('/feed')}>
              Browse Listings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
