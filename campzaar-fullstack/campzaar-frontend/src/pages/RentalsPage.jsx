import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { listings } from '../data/mockData';
import './RentalsPage.css';

const rentalListings = listings.filter(l => l.type === 'rent');
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
  const [activeItem, setActiveItem] = useState(rentalListings[0] || listings[2]);
  const [selectedDays, setSelectedDays] = useState([]);

  const totalPrice = selectedDays.length * (activeItem?.price || 0);

  return (
    <div className="rentals-page">
      <div className="container">
        <h1 className="page-title">Rental <span className="gradient-text">Hub</span></h1>
        <p className="page-sub">Book anything on campus by the hour, day, or week</p>

        <div className="rentals-layout">
          {/* Listing Selector */}
          <div className="rentals-sidebar">
            <h3 className="sidebar-title">Available to Rent</h3>
            {listings.slice(0, 6).map(l => (
              <button
                key={l.id}
                className={`rental-item ${activeItem?.id === l.id ? 'active' : ''}`}
                onClick={() => { setActiveItem(l); setSelectedDays([]); }}
              >
                <img src={l.image} alt={l.title} className="rental-item-img" />
                <div className="rental-item-info">
                  <div className="rental-item-title">{l.title}</div>
                  <div className="rental-item-price">
                    ₹{l.price.toLocaleString()}
                    <span>/{l.type === 'rent' ? 'day' : 'fixed'}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="rentals-main">
            {/* Item Preview */}
            <div className="rental-preview-card">
              <img src={activeItem?.image} alt="" className="rental-preview-img" />
              <div className="rental-preview-info">
                <div className="rental-preview-badge">
                  {activeItem?.type === 'rent' ? '📅 Available for Rent' : '🏷️ For Sale'}
                </div>
                <h2 className="rental-preview-title">{activeItem?.title}</h2>
                <div className="rental-preview-price">
                  ₹{activeItem?.price.toLocaleString()}
                  {activeItem?.type === 'rent' && <span>/day</span>}
                </div>
                <p className="rental-preview-desc">{activeItem?.description}</p>
                <div className="rental-preview-seller">
                  <div className="small-avatar">{activeItem?.seller.avatar}</div>
                  <span>{activeItem?.seller.name} · {activeItem?.seller.college}</span>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="calendar-section">
              <h3 className="cal-section-title">Select Rental Dates</h3>
              <p className="cal-section-sub">Click dates to select your rental period</p>
              <MiniCalendar onSelect={setSelectedDays} selected={selectedDays} />

              {/* Booking Summary */}
              {selectedDays.length > 0 && (
                <div className="booking-summary">
                  <div className="booking-row">
                    <span>₹{activeItem?.price.toLocaleString()} × {selectedDays.length} days</span>
                    <span>₹{(activeItem?.price * selectedDays.length).toLocaleString()}</span>
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
                  <button className="btn-primary book-btn">
                    Confirm Booking — ₹{Math.round(totalPrice * 1.05).toLocaleString()}
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
          </div>
        </div>
      </div>
    </div>
  );
}
