import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, MessageCircle, Star, Shield } from 'lucide-react';
import './ListingCard.css';

export default function ListingCard({ listing, variant = 'grid' }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(listing.liked);

  const discount = listing.originalPrice
    ? Math.round((1 - listing.price / listing.originalPrice) * 100)
    : null;

  return (
    <div className={`listing-card ${variant}`} onClick={() => navigate(`/product/${listing.id}`)}>
      {/* Image */}
      <div className="card-image-wrap">
        <img src={listing.image} alt={listing.title} className="card-image" />
        <div className="card-image-overlay" />
        
        {/* Type Badge */}
        <div className={`card-type-badge ${listing.type}`}>
          {listing.type === 'rent' ? '📅 Rent' : '🏷️ Sell'}
        </div>

        {/* Discount Badge */}
        {discount && (
          <div className="card-discount">{discount}% off</div>
        )}

        {/* Like Button */}
        <button
          className={`card-like ${liked ? 'liked' : ''}`}
          onClick={e => { e.stopPropagation(); setLiked(!liked); }}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        </button>

        {/* Views */}
        <div className="card-views">
          <Eye size={12} />
          <span>{listing.views > 1000 ? `${(listing.views/1000).toFixed(1)}k` : listing.views}</span>
        </div>
      </div>

      {/* Content */}
      <div className="card-content">
        {/* Condition */}
        <div className="card-condition">{listing.condition}</div>

        <h3 className="card-title">{listing.title}</h3>

        {/* Price Row */}
        <div className="card-price-row">
          <div className="card-price">
            ₹{listing.price.toLocaleString()}
            {listing.type === 'rent' && <span>/day</span>}
          </div>
          {listing.originalPrice && (
            <div className="card-original">₹{listing.originalPrice.toLocaleString()}</div>
          )}
        </div>

        {/* Tags */}
        <div className="card-tags">
          {listing.tags.slice(0, 2).map(tag => (
            <span key={tag} className="card-tag">{tag}</span>
          ))}
        </div>

        {/* Seller */}
        <div className="card-seller">
          <div className="seller-avatar">{listing.seller.avatar}</div>
          <div className="seller-info">
            <span className="seller-name">
              {listing.seller.name}
              {listing.seller.verified && <Shield size={11} className="verified-icon" />}
            </span>
            <span className="seller-college">{listing.seller.college}</span>
          </div>
          <div className="seller-rating">
            <Star size={11} fill="currentColor" />
            <span>{listing.seller.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
