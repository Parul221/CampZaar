import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Camera } from 'lucide-react';
import { api, API_ORIGIN, resolveMediaUrl } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { categories } from '../data/mockData';
import './AddListingPage.css';

const steps = ['Basic Info', 'Details', 'Pricing', 'Review'];
const conditions = ['Like New', 'Good', 'Fair', 'For Parts'];
const listingCategories = [
  ...categories.filter((c) => c.id !== 'all' && c.id !== 'startups'),
  { id: 'other', label: 'Other', icon: '🧩', color: '#f43f5e' },
];

export default function AddListingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', condition: '',
    type: 'sell', price: '', original_price: '', rent_period: 'day',
    tags: '', meetup_location: '', images: [],
  });

  if (!user) { navigate('/auth'); return null; }

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setError('');
    const newImages = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_ORIGIN}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('cz_token')}`
          },
          body: formData
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const data = await response.json();
        newImages.push({
          url: resolveMediaUrl(data.url),
          filename: data.filename
        });
      }

      setForm(f => ({ ...f, images: [...f.images, ...newImages] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
  console.log("🔥 CLICKED");

  setSubmitting(true);
  setError('');

  try {
    const tags = form.tags
      ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    console.log("📦 DATA:", {
      title: form.title,
      category: form.category,
      condition: form.condition,
      price: form.price,
      images: form.images
    });

    const res = await api.createListing({
      title: form.title,
      description: form.description,
      category: form.category,
      condition: form.condition,
      type: form.type,
      price: Number(form.price),
      original_price: form.original_price
        ? Number(form.original_price)
        : null,
      rent_period: form.type === 'rent' ? form.rent_period : null,
      tags,
      meetup_location: form.meetup_location,
      images: form.images.map(img => img.url),
    });

    console.log("✅ SUCCESS:", res);

    setSubmitted(true);
    setTimeout(() => navigate('/feed'), 2500);

  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    setError(err.message);
  } finally {
    setSubmitting(false);
  }
};

  const canNext = () => {
    if (step === 0) return form.title && form.category;
    if (step === 1) return form.description && form.condition;
    if (step === 2) return form.price;
    return true;
  };

  if (submitted) {
    return (
      <div className="add-page">
        <div className="success-screen">
          <div className="success-orb"/>
          <div className="success-icon"><CheckCircle size={64}/></div>
          <h2>Listing Published! 🎉</h2>
          <p>Your item is now live on CampZaar. Students can find and message you.</p>
          <div className="success-dots">
            {[0,0.2,0.4].map((d,i) => <div key={i} className="dot-loading" style={{ animationDelay: `${d}s` }}/>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-page">
      <div className="add-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20}/><span>Back</span>
        </button>
        <h1 className="add-title">Add <span className="gradient-text">Listing</span></h1>
        <p className="add-sub">Reach thousands of students on your campus</p>

        <div className="step-progress">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <button className={`step-item ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                onClick={() => i < step && setStep(i)}>
                <div className="step-circle">{i < step ? <CheckCircle size={14}/> : i+1}</div>
                <span className="step-label">{s}</span>
              </button>
              {i < steps.length-1 && <div className={`step-line ${i < step ? 'done' : ''}`}/>}
            </React.Fragment>
          ))}
        </div>

        <div className="step-content">
          {step === 0 && (
            <div className="form-section">
              <h3 className="form-section-title">What type of product is it?</h3>
              <div className="image-upload-area">
                {form.images.length > 0 ? (
                  <div className="image-preview-grid">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="image-preview-item">
                        <img src={img.url} alt={`Preview ${idx}`} />
                        <button className="remove-image-btn" onClick={() => removeImage(idx)}>✕</button>
                      </div>
                    ))}
                    <label className="image-add-more">
                      <Camera size={28} /><span>Add more</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ display: 'none' }} />
                    </label>
                  </div>
                ) : (
                  <label className="upload-placeholder">
                    <Camera size={36} /><p>Add photos</p><span>Click to upload</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ display: 'none' }} />
                  </label>
                )}
                {uploading && <div className="upload-status">⏳ Uploading images...</div>}
              </div>
              <div className="form-field">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="e.g. Book set, pen stand, hoodie, cycle"
                  value={form.title} onChange={e => update('title', e.target.value)}/>
              </div>
              <div className="form-field">
                <label className="form-label">Category *</label>
                <div className="category-grid">
                  {listingCategories.map(cat => (
                    <button key={cat.id} className={`cat-select ${form.category === cat.id ? 'active' : ''}`}
                      onClick={() => update('category', cat.id)} style={{ '--cat-color': cat.color }}>
                      <span className="cat-select-icon">{cat.icon}</span><span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="form-section">
              <h3 className="form-section-title">Tell us more</h3>
              <div className="form-field">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" rows={5}
                  placeholder="Describe the item, condition, quantity, and what is included..."
                  value={form.description} onChange={e => update('description', e.target.value)}/>
              </div>
              <div className="form-field">
                <label className="form-label">Condition *</label>
                <div className="condition-options">
                  {conditions.map(c => (
                    <button key={c} className={`condition-btn ${form.condition === c ? 'active' : ''}`}
                      onClick={() => update('condition', c)}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Tags (comma separated)</label>
                <input className="form-input" placeholder="e.g. book, pen, clothes, notes"
                  value={form.tags} onChange={e => update('tags', e.target.value)}/>
              </div>
              <div className="form-field">
                <label className="form-label">Meetup Location</label>
                <input className="form-input" placeholder="e.g. Campus gate, hostel block, library"
                  value={form.meetup_location} onChange={e => update('meetup_location', e.target.value)}/>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-section">
              <h3 className="form-section-title">Set your price</h3>
              <div className="type-toggle">
                <button className={`type-btn ${form.type === 'sell' ? 'active' : ''}`} onClick={() => update('type','sell')}>🏷️ Sell</button>
                <button className={`type-btn ${form.type === 'rent' ? 'active' : ''}`} onClick={() => update('type','rent')}>📅 Rent</button>
              </div>
              <div className="form-field">
                <label className="form-label">Price (₹) *</label>
                <div className="price-input-wrap">
                  <span className="price-symbol">₹</span>
                  <input className="form-input price-input" type="number" placeholder="0"
                    value={form.price} onChange={e => update('price', e.target.value)}/>
                </div>
              </div>
              {form.type === 'sell' && (
                <div className="form-field">
                  <label className="form-label">Original Price (₹) — optional</label>
                  <div className="price-input-wrap">
                    <span className="price-symbol">₹</span>
                    <input className="form-input price-input" type="number" placeholder="0"
                      value={form.original_price} onChange={e => update('original_price', e.target.value)}/>
                  </div>
                </div>
              )}
              {form.type === 'rent' && (
                <div className="form-field">
                  <label className="form-label">Rent Period</label>
                  <div className="condition-options">
                    {['hour','day','week','month'].map(p => (
                      <button key={p} className={`condition-btn ${form.rent_period === p ? 'active' : ''}`}
                        onClick={() => update('rent_period', p)}>Per {p}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="price-tips">
                <h4 className="tips-title">💡 Pricing Tips</h4>
                <ul className="tips-list">
                  <li>Electronics: 40-60% of original price</li>
                  <li>Books: 30-50% of cover price</li>
                  <li>Furniture: 20-40% of purchase price</li>
                </ul>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-section preview-section">
              <h3 className="form-section-title">Review your listing</h3>
              <div className="preview-card">
                <div className="preview-img">
                  {form.images.length > 0 ? (
                    <img src={form.images[0].url} alt="Preview" />
                  ) : (
                    <div className="preview-img-placeholder">📷</div>
                  )}
                </div>
                <div className="preview-info">
                  <div className={`preview-type ${form.type}`}>{form.type === 'rent' ? '📅 For Rent' : '🏷️ For Sale'}</div>
                  <h3 className="preview-title">{form.title || 'Your Item'}</h3>
                  <div className="preview-price">₹{form.price ? Number(form.price).toLocaleString() : '0'}{form.type === 'rent' && <span>/{form.rent_period}</span>}</div>
                  {form.condition && <div className="preview-condition">{form.condition}</div>}
                  {form.description && <p className="preview-desc">{form.description}</p>}
                  {form.images.length > 0 && <div className="preview-images-count">📸 {form.images.length} photo{form.images.length !== 1 ? 's' : ''}</div>}
                </div>
              </div>
              {error && <div className="auth-error" style={{ marginTop: 12 }}>⚠️ {error}</div>}
              <div className="preview-note"><CheckCircle size={15}/><span>By publishing, you agree to CampZaar community guidelines</span></div>
            </div>
          )}
        </div>

        <div className="step-nav">
          {step > 0 && <button className="btn-ghost prev-btn" onClick={() => setStep(s => s-1)}>Previous</button>}
          {step < steps.length-1 ? (
            <button className="btn-primary next-btn" onClick={() => setStep(s => s+1)} disabled={!canNext()}>Continue →</button>
          ) : (
            <button className="btn-primary next-btn publish-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <span className="btn-spinner"/> : '🚀 Publish Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
