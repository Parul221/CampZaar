import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, Shield, MapPin, Calendar, Edit3, Grid, LogOut, Save, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api, resolveMediaUrl } from '../services/api';
import ListingCard from '../components/shared/ListingCard';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: me, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState('listings');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const targetId = id || me?.id;
  const isMe = targetId === me?.id;

  useEffect(() => {
    if (!me && !id) { navigate('/auth'); return; }
    if (!targetId) return;

    setLoading(true);
    Promise.all([
      api.getUser(targetId),
      api.getUserListings(targetId),
    ]).then(([p, l]) => {
      setProfile(p);
      setListings(l);
      setEditForm({ full_name: p.full_name, college: p.college, bio: p.bio || '' });
    }).catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [targetId, me, navigate, id]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.updateProfile(editForm);
      await refreshUser();
      const p = await api.getUser(targetId);
      setProfile(p);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) return (
    <div className="profile-page">
      <div className="profile-banner" />
      <div className="container">
        <div className="profile-card">
          <div className="skeleton" style={{ width: 120, height: 120, borderRadius: '50%' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
            <div className="skeleton" style={{ height: 28, width: '40%' }} />
            <div className="skeleton" style={{ height: 16, width: '60%' }} />
            <div className="skeleton" style={{ height: 14, width: '80%' }} />
          </div>
        </div>
      </div>
    </div>
  );

  if (!profile) return null;
  const initials = profile.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
  const avatarUrl = resolveMediaUrl(profile.avatar_url);

  return (
    <div className="profile-page">
      <div className="profile-banner">
        <div className="banner-grad" />
        <div className="banner-grid" />
      </div>

      <div className="container">
        <div className="profile-card">
          <div className="profile-topbar">
            <div className="profile-identity-block">
              <div className="profile-avatar-wrap">
                <div className="profile-avatar">
                  {avatarUrl ? <img src={avatarUrl} alt={profile.full_name} className="profile-avatar-image" /> : initials}
                </div>
                {profile.verified && (
                  <div className="profile-verified-badge"><Shield size={12} /></div>
                )}
              </div>

              <div className="profile-main-info">
                {editing ? (
                  <div className="edit-form">
                    <input className="edit-input" value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full Name" />
                    <input className="edit-input" value={editForm.college} onChange={e => setEditForm(f => ({ ...f, college: e.target.value }))} placeholder="College" />
                    <textarea className="edit-textarea" value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Bio..." rows={2} />
                    <div className="edit-actions">
                      <button className="btn-primary save-btn" onClick={saveProfile} disabled={saving}>
                        {saving ? <span className="btn-spinner" /> : <><Save size={15} /> Save</>}
                      </button>
                      <button className="btn-ghost" onClick={() => setEditing(false)}><X size={15} /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="profile-name-row">
                      <div className="profile-name-stack">
                        <h1 className="profile-name">{profile.full_name}</h1>
                        <div className="profile-username">@{profile.username}</div>
                      </div>
                      {isMe && (
                        <div className="profile-header-actions">
                          <button className="edit-btn" onClick={() => setEditing(true)}>
                            <Edit3 size={15} /><span>Edit Profile</span>
                          </button>
                          <button className="logout-btn" onClick={handleLogout}>
                            <LogOut size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                    {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                    <div className="profile-meta">
                      <div className="profile-meta-item"><MapPin size={13} /><span>{profile.college}</span></div>
                      <div className="profile-meta-item"><Calendar size={13} /><span>Joined {new Date(profile.joined_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span></div>
                      {profile.rating > 0 && (
                        <div className="profile-meta-item rating">
                          <Star size={13} fill="currentColor" />
                          <span>{profile.rating} ({profile.rating_count} reviews)</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="profile-stats-panel">
              <div className="profile-stats-header">Overview</div>
              <div className="profile-stats">
                {[
                  { label: 'Active', val: profile.stats?.listings || 0 },
                  { label: 'Sold', val: profile.stats?.sold || 0 },
                  { label: 'Reviews', val: profile.stats?.reviews || 0 },
                ].map(s => (
                  <div key={s.label} className="profile-stat">
                    <div className="pstat-val">{s.val}</div>
                    <div className="pstat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          {[
            { id: 'listings', label: 'Listings', icon: <Grid size={15} /> },
            { id: 'reviews', label: 'Reviews', icon: <Star size={15} /> },
          ].map(tab => (
            <button key={tab.id} className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="profile-tab-content">
          {activeTab === 'listings' && (
            listings.length > 0
              ? <div className="listings-grid">{listings.map(l => <ListingCard key={l.id} listing={l} />)}</div>
              : <div className="empty-state"><div className="empty-icon">📦</div><p>No listings yet</p></div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-section">
              {profile.reviews?.length > 0 ? (
                profile.reviews.map(r => (
                  <div key={r.id} className="review-card">
                    <div className="review-header">
                      <div className="review-avatar">{r.full_name?.split(' ').map(w => w[0]).join('').slice(0,2) || '?'}</div>
                      <div className="review-meta">
                        <div className="review-name">{r.full_name}</div>
                        <div className="review-stars">
                          {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? '#f59e0b' : 'none'} color="#f59e0b" />)}
                        </div>
                      </div>
                      <div className="review-date">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <p className="review-text">{r.text}</p>
                  </div>
                ))
              ) : (
                <div className="empty-state"><div className="empty-icon">⭐</div><p>No reviews yet</p></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
