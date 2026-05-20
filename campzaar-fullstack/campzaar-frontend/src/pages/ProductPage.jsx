import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Shield, Star, MapPin, Eye, ChevronLeft, CheckCircle, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import ListingCard from '../components/shared/ListingCard';
import './ProductPage.css';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [saved, setSaved] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getListing(id)
      .then(p => {
        setProduct(p);
        setSaved(p.wishlisted ?? p.liked);
        return api.getListings({ category: p.category, limit: 4 });
      })
      .then(data => setRelated(data.listings.filter(l => l.id !== id)))
      .catch(() => navigate('/feed'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    if (!user) { navigate('/auth'); return; }
    try {
      const { saved: newSaved } = await api.toggleWishlist(id);
      setSaved(newSaved);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChat = async () => {
    if (!user) { navigate('/auth'); return; }
    if (product.seller?.id === user.id) return;
    setChatLoading(true);
    try {
      const conversation = await api.startConversation({ listing_id: id, seller_id: product.seller.id });
      navigate('/chat', { state: { conversationId: conversation.id } });
    } catch (err) {
      alert(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || product.seller?.id !== user.id || deleteLoading) return;
    const confirmed = window.confirm(`Delete "${product.title}"? This will remove it from the marketplace.`);
    if (!confirmed) return;

    try {
      setDeleteLoading(true);
      await api.deleteListing(id);
      navigate('/profile', { replace: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return (
    <div className="product-page">
      <div className="container">
        <div className="product-layout">
          <div className="skeleton" style={{ borderRadius: 'var(--radius-xl)', aspectRatio: '4/3' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: i === 0 ? 36 : 16, width: i === 1 ? '60%' : '100%' }} />)}
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  const images = product.images?.length ? product.images : [
    `https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80`
  ];
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100) : null;

  return (
    <div className="product-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}><ChevronLeft size={20}/><span>Back</span></button>

        <div className="product-layout">
          <div className="product-images">
            <div className="main-image">
              <img src={images[activeImg]} alt={product.title} />
              {discount && <div className="product-discount">{discount}% off</div>}
              <div className={`product-type-badge ${product.type}`}>
                {product.type === 'rent' ? '📅 For Rent' : '🏷️ For Sale'}
              </div>
            </div>
            {images.length > 1 && (
              <div className="image-thumbs">
                {images.map((img, i) => (
                  <button key={i} className={`thumb ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-info">
            <div className="product-header">
              <div className="product-condition">{product.condition}</div>
              <div className="product-category">{product.category}</div>
            </div>

            <h1 className="product-title">{product.title}</h1>

            <div className="product-price-row">
              <div className="product-price">
                ₹{Number(product.price).toLocaleString()}
                {product.type === 'rent' && <span className="per-day">/{product.rent_period || 'day'}</span>}
              </div>
              {product.original_price && (
                <div className="product-original">₹{Number(product.original_price).toLocaleString()}</div>
              )}
            </div>

            {product.tags?.length > 0 && (
              <div className="product-tags">
                {product.tags.map(t => <span key={t} className="card-tag">{t}</span>)}
              </div>
            )}

            <div className="product-desc">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            {product.meetup_location && (
              <div className="meetup-location">
                <MapPin size={14} />
                <span>Meetup: {product.meetup_location}</span>
              </div>
            )}

            {product.startup && (
              <button className="seller-profile-btn" onClick={() => navigate(`/startups/${product.startup.id}`)}>
                Visit {product.startup.name} Shop
              </button>
            )}

            <div className="safety-badges">
              <div className="safety-badge"><CheckCircle size={15} className="check-icon"/><span>Verified Seller</span></div>
              <div className="safety-badge"><Shield size={15} className="shield-icon"/><span>CampZaar Guarantee</span></div>
            </div>

            <div className="product-actions">
              {product.seller?.id !== user?.id ? (
                <button className="btn-primary chat-btn" onClick={handleChat} disabled={chatLoading}>
                  <MessageCircle size={18}/>
                  <span>{chatLoading ? 'Opening...' : 'Chat with Seller'}</span>
                </button>
              ) : (
                <button className="chat-btn own-listing-btn" disabled>
                  <MessageCircle size={18}/>
                  <span>Your Listing</span>
                </button>
              )}
              {product.seller?.id === user?.id && (
                <button className="delete-action" onClick={handleDelete} disabled={deleteLoading}>
                  <Trash2 size={18} />
                </button>
              )}
              <button className={`like-action ${saved ? 'liked' : ''}`} onClick={handleSave}>
                <Heart size={20} fill={saved ? 'currentColor' : 'none'}/>
              </button>
              <button className="share-action"><Share2 size={20}/></button>
            </div>

            {product.seller && (
              <div className="seller-card">
                <div className="seller-card-header">Seller</div>
                <div className="seller-card-body">
                  <div className="seller-big-avatar">
                    {product.seller.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?'}
                  </div>
                  <div className="seller-card-info">
                    <div className="seller-big-name">
                      {product.seller.full_name}
                      {product.seller.verified && <Shield size={13} className="verified-blue"/>}
                    </div>
                    <div className="seller-card-college"><MapPin size={11}/>{product.seller.college}</div>
                    {product.seller.rating > 0 && (
                      <div className="seller-card-rating">
                        <Star size={13} fill="currentColor"/>
                        <span>{product.seller.rating}</span>
                        <span className="rating-count">({product.seller.rating_count} reviews)</span>
                      </div>
                    )}
                  </div>
                  <div className="seller-card-actions">
                    {product.seller?.id !== user?.id ? (
                      <button className="seller-chat-btn" onClick={handleChat} disabled={chatLoading}>
                        <MessageCircle size={16} />
                        <span>{chatLoading ? 'Opening...' : 'Chat Now'}</span>
                      </button>
                    ) : (
                      <button className="seller-chat-btn seller-chat-btn-disabled" disabled>
                        <MessageCircle size={16} />
                        <span>Your Listing</span>
                      </button>
                    )}
                    <button className="seller-profile-btn" onClick={() => navigate(`/profile/${product.seller.id}`)}>
                      View Profile
                    </button>
                    {product.seller?.id === user?.id && (
                      <button className="seller-delete-btn" onClick={handleDelete} disabled={deleteLoading}>
                        <Trash2 size={16} />
                        <span>{deleteLoading ? 'Deleting...' : 'Delete Post'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="product-meta">
              <Eye size={13}/><span>{product.views} views</span>
              <span className="dot">·</span>
              <span>{new Date(product.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="related-section">
            <h2 className="section-title">Similar Listings</h2>
            <div className="listings-grid">{related.map(l => <ListingCard key={l.id} listing={l}/>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
