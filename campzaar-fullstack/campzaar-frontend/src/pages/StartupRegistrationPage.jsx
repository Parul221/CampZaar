import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import './StartupRegistrationPage.css';

const categories = ['Clothing', 'Accessories', 'Eatables', 'Handmade', 'Stationery & Gifts', 'Beauty & Care', 'Decor', 'Other'];
const stages = ['Just Started', 'Taking Orders', 'Popular on Campus', 'Seasonal Drop', 'Made to Order'];

export default function StartupRegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    category: 'Clothing',
    stage: 'Just Started',
    raised: '',
    looking_for: '',
    website: '',
    tags: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const startup = await api.createStartup({
        ...form,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });
      navigate(`/startups/${startup.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="startup-form-page">
      <div className="startup-form-shell container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
          <span>Back</span>
        </button>

        <div className="startup-form-card">
          <div className="startup-form-hero">
            <div className="startup-form-badge">Student Shop Registration</div>
            <h1>Launch your campus shop</h1>
            <p>Register your brand or small business, then attach products from the add listing page.</p>
          </div>

          <form className="startup-form-grid" onSubmit={handleSubmit}>
            <label className="startup-field">
              <span>Shop name</span>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Thread Theory" required />
            </label>

            <label className="startup-field">
              <span>Tagline</span>
              <input value={form.tagline} onChange={(e) => update('tagline', e.target.value)} placeholder="Handmade pieces made by students" required />
            </label>

            <label className="startup-field startup-field-wide">
              <span>Description</span>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={5} placeholder="Tell students what you sell, what makes it special, and how they can order from you." required />
            </label>

            <label className="startup-field">
              <span>Category</span>
              <select value={form.category} onChange={(e) => update('category', e.target.value)}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>

            <label className="startup-field">
              <span>Stage</span>
              <select value={form.stage} onChange={(e) => update('stage', e.target.value)}>
                {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
              </select>
            </label>

            <label className="startup-field">
              <span>Price range or note</span>
              <input value={form.raised} onChange={(e) => update('raised', e.target.value)} placeholder="From Rs 199 or handmade in small batches" />
            </label>

            <label className="startup-field">
              <span>Best for</span>
              <input value={form.looking_for} onChange={(e) => update('looking_for', e.target.value)} placeholder="Festive wear, gifting, daily essentials" />
            </label>

            <label className="startup-field">
              <span>Instagram or website</span>
              <input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://instagram.com/yourshop" />
            </label>

            <label className="startup-field">
              <span>Tags</span>
              <input value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="crochet, tote bags, custom, thrift, earrings" />
            </label>

            {error && <div className="startup-form-error">{error}</div>}

            <div className="startup-form-actions">
              <button className="btn-ghost" type="button" onClick={() => navigate('/startups')}>
                Cancel
              </button>
              <button className="btn-primary" type="submit" disabled={submitting}>
                <CheckCircle size={16} />
                <span>{submitting ? 'Registering...' : 'Register Shop'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
