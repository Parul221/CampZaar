import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, MessageCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import './RentalsPage.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function MiniCalendar({ onSelect, selected }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d) => selected.some(s => s.day === d && s.month === month && s.year === year);
  const isPast = (d) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const toggleDay = (d) => {
    if (isPast(d)) return;
    const key = { day: d, month, year };
    const exists = selected.findIndex(s => s.day === d && s.month === month && s.year === year);
    if (exists >= 0) onSelect(selected.filter((_, i) => i !== exists));
    else onSelect([...selected, key]);
  };

  return (
    <div className="mini-calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={() => setViewDate(new Date(year, month - 1, 1))}>
          <ChevronLeft size={18} />
        </button>
        <span className="cal-month-label">{MONTHS[month]} {year}</span>
        <button className="cal-nav" onClick={() => setViewDate(new Date(year, month + 1, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="cal-days-header">
        {DAYS.map(d => <span key={d} className="cal-day-name">{d}</span>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => (
          <button
            key={i}
            className={`cal-cell ${!d ? 'empty' : ''} ${d && isSelected(d) ? 'selected' : ''} ${d && isPast(d) ? 'past' : ''}`}
            onClick={() => d && toggleDay(d)}
            disabled={!d || isPast(d)}
          >
            {d}
            {d && isSelected(d) && <span className="cal-check"><Check size={8} /></span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RentalsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rentalListings, setRentalListings] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadRentals = async () => {
      try {
        const data = await api.getListings({ type: 'rent', sort: 'newest', limit: 24 });
        if (!mounted) return;
        const activeRentals = data.listings || [];
        setRentalListings(activeRentals);
        setActiveItem((current) => activeRentals.find((item) => item.id === current?.id) || activeRentals[0] || null);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRentals();
    const interval = setInterval(loadRentals, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleChat = async () => {
    if (!activeItem?.seller?.id || activeItem.seller.id === user?.id) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      setChatLoading(true);
      const conversation = await api.startConversation({
        listing_id: activeItem.id,
        seller_id: activeItem.seller.id,
      });
      navigate('/chat', { state: { conversationId: conversation.id } });
    } catch (err) {
      alert(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  const totalPrice = selectedDays.length * (activeItem?.price || 0);

  return (
    <div className="rentals-page">
      <div className="container">
        <h1 className="page-title">Rental <span className="gradient-text">Hub</span></h1>
        <p className="page-sub">Book live rental listings from students on campus</p>

        {loading ? (
          <div className="rentals-loading-grid">
            <div className="rentals-sidebar">
              <h3 className="sidebar-title">Available to Rent</h3>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rental-skeleton-row">
                  <div className="skeleton rental-skeleton-img" />
                  <div className="rental-skeleton-info">
                    <div className="skeleton" style={{ height: 14, width: '80%' }} />
                    <div className="skeleton" style={{ height: 12, width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="rentals-main">
              <div className="skeleton" style={{ borderRadius: 'var(--radius-xl)', minHeight: 280 }} />
              <div className="skeleton" style={{ borderRadius: 'var(--radius-xl)', minHeight: 360 }} />
            </div>
          </div>
        ) : rentalListings.length === 0 ? (
          <div className="rentals-empty">
            <div className="empty-icon">📦</div>
            <h3>No rental listings yet</h3>
            <p>As soon as students post items for rent, they’ll appear here automatically.</p>
            <button className="btn-primary" onClick={() => navigate('/add-listing')}>Add Rental Listing</button>
          </div>
        ) : (
          <div className="rentals-layout">
            <div className="rentals-sidebar">
              <h3 className="sidebar-title">Available to Rent</h3>
              {rentalListings.map(l => (
                <button
                  key={l.id}
                  className={`rental-item ${activeItem?.id === l.id ? 'active' : ''}`}
                  onClick={() => { setActiveItem(l); setSelectedDays([]); }}
                >
                  <img src={l.image || l.images?.[0]} alt={l.title} className="rental-item-img" />
                  <div className="rental-item-info">
                    <div className="rental-item-title">{l.title}</div>
                    <div className="rental-item-price">
                      ₹{Number(l.price || 0).toLocaleString()}
                      <span>/{l.rent_period || 'day'}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="rentals-main">
              {activeItem && (
                <>
                  <div className="rental-preview-card">
                    <img src={activeItem.image || activeItem.images?.[0]} alt={activeItem.title} className="rental-preview-img" />
                    <div className="rental-preview-info">
                      <div className="rental-preview-badge">📅 Available for Rent</div>
                      <h2 className="rental-preview-title">{activeItem.title}</h2>
                      <div className="rental-preview-price">
                        ₹{Number(activeItem.price || 0).toLocaleString()}
                        <span>/{activeItem.rent_period || 'day'}</span>
                      </div>
                      <p className="rental-preview-desc">{activeItem.description}</p>
                      <div className="rental-preview-seller">
                        <div className="small-avatar">{activeItem.seller?.avatar}</div>
                        <span>{activeItem.seller?.name} · {activeItem.seller?.college}</span>
                      </div>
                      <div className="rental-preview-meta">
                        <span>{activeItem.condition}</span>
                        {activeItem.meetup_location && <span>Meetup: {activeItem.meetup_location}</span>}
                      </div>
                      {activeItem.seller?.id !== user?.id && (
                        <button className="btn-primary rental-chat-btn" onClick={handleChat} disabled={chatLoading}>
                          <MessageCircle size={16} />
                          <span>{chatLoading ? 'Opening...' : 'Chat About This Rental'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="calendar-section">
                    <h3 className="cal-section-title">Select Rental Dates</h3>
                    <p className="cal-section-sub">Choose dates to estimate your rental cost in real time</p>
                    <MiniCalendar onSelect={setSelectedDays} selected={selectedDays} />

                    {selectedDays.length > 0 && (
                      <div className="booking-summary">
                        <div className="booking-row">
                          <span>₹{Number(activeItem.price || 0).toLocaleString()} × {selectedDays.length} days</span>
                          <span>₹{(Number(activeItem.price || 0) * selectedDays.length).toLocaleString()}</span>
                        </div>
                        <div className="booking-row">
                          <span>CampZaar fee (5%)</span>
                          <span>₹{Math.round(totalPrice * 0.05).toLocaleString()}</span>
                        </div>
                        <div className="booking-divider" />
                        <div className="booking-total">
                          <span>Total</span>
                          <span>₹{Math.round(totalPrice * 1.05).toLocaleString()}</span>
                        </div>
                        <button className="btn-primary book-btn" onClick={handleChat}>
                          Confirm Booking Enquiry — ₹{Math.round(totalPrice * 1.05).toLocaleString()}
                        </button>
                      </div>
                    )}

                    {selectedDays.length === 0 && (
                      <div className="no-dates">
                        <span>📅</span>
                        <p>Select dates above to see pricing</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
