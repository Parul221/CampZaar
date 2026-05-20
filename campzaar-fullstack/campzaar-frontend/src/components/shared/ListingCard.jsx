import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, MessageCircle, Star, Shield } from 'lucide-react';
import { api, resolveMediaUrl } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import './ListingCard.css';

export default function ListingCard({ listing, variant = 'grid' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState(listing.wishlisted ?? listing.liked);
  const [chatLoading, setChatLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const rawImage = listing.image || listing.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80';
  const listingImage = resolveMediaUrl(rawImage);
  const sellerName = listing.seller?.name || listing.seller?.full_name || 'Unknown Seller';
  const sellerAvatar = listing.seller?.avatar_url ? resolveMediaUrl(listing.seller.avatar_url) : (listing.seller?.avatar || sellerName.slice(0, 2).toUpperCase());
  const sellerAvatarIsUrl = typeof sellerAvatar === 'string' && sellerAvatar.startsWith('http');
  const isOwnListing = !!listing.seller?.id && listing.seller.id === user?.id;
  const canChat = !!listing.seller?.id && !isOwnListing;

  const discount = listing.originalPrice
    ? Math.round((1 - listing.price / listing.originalPrice) * 100)
    : null;

  const handleChat = async (e) => {
    e.stopPropagation();
    if (!canChat) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      setChatLoading(true);
      const conversation = await api.startConversation({
        listing_id: listing.id,
        seller_id: listing.seller.id,
      });
      navigate('/chat', { state: { conversationId: conversation.id } });
    } catch (err) {
      alert(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      setSaving(true);
      const response = await api.toggleWishlist(listing.id);
      setSaved(response.saved);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`listing-card ${variant}`} onClick={() => navigate(`/product/${listing.id}`)}>
      {/* Image */}
      <div className="card-image-wrap">
        <img src={listingImage} alt={listing.title} className="card-image" />
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
          className={`card-like ${saved ? 'liked' : ''}`}
          onClick={handleSave}
          disabled={saving}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>

        {/* Views */}
        <div className="card-views">
          <Eye size={12} />
          <span>{listing.views > 1000 ? `${(listing.views/1000).toFixed(1)}k` : listing.views}</span>
        </div>

        {listing.seller?.id && (
          <button
            className={`card-chat-pill ${isOwnListing ? 'disabled' : ''}`}
            onClick={canChat ? handleChat : (e) => e.stopPropagation()}
            disabled={chatLoading || isOwnListing}
          >
            <MessageCircle size={14} />
            <span>{isOwnListing ? 'Your Listing' : chatLoading ? 'Opening...' : 'Chat'}</span>
          </button>
        )}
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
          {(listing.tags || []).slice(0, 2).map(tag => (
            <span key={tag} className="card-tag">{tag}</span>
          ))}
        </div>

        {/* Seller */}
        <div className="card-seller">
          <div className="seller-avatar">{sellerAvatarIsUrl ? <img src={sellerAvatar} alt={sellerName} className="seller-avatar-image" /> : sellerAvatar}</div>
          <div className="seller-info">
            <span className="seller-name">

              {sellerName}
              {listing.seller?.verified && <Shield size={11} className="verified-icon" />}
            </span>
            <span className="seller-college">{listing.seller?.college}</span>
          </div>
          <div className="seller-rating">
            <Star size={11} fill="currentColor" />
            <span>{listing.seller?.rating ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
