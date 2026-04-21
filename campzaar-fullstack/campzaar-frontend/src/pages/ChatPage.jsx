import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Search, MoreVertical, Smile, Paperclip, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './ChatPage.css';

export default function ChatPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showConvoList, setShowConvoList] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});
  const bottomRef = useRef(null);
  const activeConvIdRef = useRef(null);
  activeConvIdRef.current = activeConvId;

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherUser = activeConv?.other_user;

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'new_message') {
      const m = msg.data;
      if (m.conversation_id === activeConvIdRef.current) {
        setMessages(prev => prev.find(p => p.id === m.id) ? prev : [...prev, m]);
      }
      setConversations(prev => prev.map(c =>
        c.id === m.conversation_id
          ? { ...c, last_message: m.text, last_message_at: m.created_at,
              unread_count: m.conversation_id === activeConvIdRef.current ? 0 : (c.unread_count || 0) + 1 }
          : c
      ));
    }
    if (msg.type === 'typing') {
      setTypingUsers(t => ({ ...t, [msg.conversation_id]: msg.userId }));
      setTimeout(() => setTypingUsers(t => { const n = { ...t }; delete n[msg.conversation_id]; return n; }), 2500);
    }
  }, []);

  const { send: wsSend, connected } = useWebSocket(token, handleWsMessage);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    api.getConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, navigate]);

  useEffect(() => {
    if (!activeConvId) return;
    setMessages([]);
    api.getMessages(activeConvId).then(setMessages).catch(console.error);
    wsSend({ type: 'mark_read', conversation_id: activeConvId });
    setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unread_count: 0 } : c));
  }, [activeConvId, wsSend]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeConvId || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId, conversation_id: activeConvId, sender_id: user.id,
      text, created_at: new Date().toISOString(), sender: user,
    };
    setMessages(prev => [...prev, optimistic]);
    wsSend({ type: 'send_message', conversation_id: activeConvId, text });
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (!user) return null;

  return (
    <div className="chat-page">
      <div className={`convo-list ${!showConvoList ? 'hidden-mobile' : ''}`}>
        <div className="convo-list-header">
          <div className="convo-title-row">
            <h2 className="convo-title">Messages</h2>
            <div className={`ws-indicator ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
              <span>{connected ? 'Live' : 'Connecting...'}</span>
            </div>
          </div>
          <div className="convo-search-wrap">
            <Search size={15} />
            <input type="text" placeholder="Search chats..." className="convo-search" />
          </div>
        </div>

        <div className="convo-items">
          {loading && [...Array(4)].map((_, i) => (
            <div key={i} className="convo-skeleton">
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 13, width: '55%' }} />
                <div className="skeleton" style={{ height: 11, width: '75%' }} />
              </div>
            </div>
          ))}

          {!loading && conversations.length === 0 && (
            <div className="no-chats">
              <span>💬</span>
              <p>No conversations yet</p>
              <small>Browse listings and tap "Chat with Seller"</small>
            </div>
          )}

          {conversations.map(conv => (
            <button
              key={conv.id}
              className={`convo-item ${activeConvId === conv.id ? 'active' : ''}`}
              onClick={() => { setActiveConvId(conv.id); setShowConvoList(false); }}
            >
              <div className="convo-avatar-wrap">
                <div className="convo-avatar">{initials(conv.other_user?.full_name)}</div>
              </div>
              <div className="convo-info">
                <div className="convo-top">
                  <span className="convo-name">{conv.other_user?.full_name || 'User'}</span>
                  <span className="convo-time">
                    {conv.last_message_at
                      ? new Date(conv.last_message_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                </div>
                <div className="convo-bottom">
                  <span className="convo-preview">{conv.last_message || 'Start conversation...'}</span>
                  {conv.unread_count > 0 && <span className="unread-badge">{conv.unread_count}</span>}
                </div>
                {conv.listing && <span className="convo-item-label">📦 {conv.listing.title}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`chat-window ${showConvoList ? 'hidden-mobile' : ''}`}>
        {activeConv ? (
          <>
            <div className="chat-header">
              <button className="back-to-list" onClick={() => setShowConvoList(true)}>
                <ArrowLeft size={20} />
              </button>
              <div className="chat-header-avatar">{initials(otherUser?.full_name)}</div>
              <div className="chat-header-info">
                <div className="chat-header-name">{otherUser?.full_name || 'User'}</div>
                <div className="chat-header-status">
                  <span>{otherUser?.college}</span>
                  {typingUsers[activeConvId] && <span className="typing-indicator"> · typing...</span>}
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="chat-action-btn"><MoreVertical size={18} /></button>
              </div>
            </div>

            {activeConv.listing && (
              <div className="item-context-bar">
                <span className="context-label">About:</span>
                <span className="context-item">📦 {activeConv.listing.title}</span>
                <span className="context-price">₹{Number(activeConv.listing.price).toLocaleString()}</span>
              </div>
            )}

            <div className="messages-area">
              {messages.length === 0 && (
                <div className="messages-empty"><span>👋</span><p>Say hello!</p></div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user.id;
                const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i-1].created_at).toDateString();
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="messages-date-divider">
                        <span>{new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    )}
                    <div className={`message ${isMe ? 'outgoing' : 'incoming'}`}>
                      {!isMe && <div className="msg-avatar">{initials(msg.sender?.full_name)}</div>}
                      <div className="msg-bubble">
                        <div className="msg-text">{msg.text}</div>
                        <div className="msg-meta">
                          <span className="msg-time">
                            {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              {typingUsers[activeConvId] && (
                <div className="message incoming">
                  <div className="msg-avatar">{initials(otherUser?.full_name)}</div>
                  <div className="msg-bubble typing-bubble">
                    <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input-area">
              <button className="chat-input-btn"><Paperclip size={18} /></button>
              <div className="chat-input-wrap">
                <input
                  type="text" placeholder="Type a message..."
                  value={input}
                  onChange={e => { setInput(e.target.value); wsSend({ type: 'typing', conversation_id: activeConvId }); }}
                  onKeyDown={handleKey}
                  className="chat-input"
                />
                <button className="emoji-btn"><Smile size={18} /></button>
              </div>
              <button className={`send-btn ${input.trim() ? 'active' : ''}`} onClick={sendMessage} disabled={!input.trim() || sending}>
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">💬</div>
            <h3>Your Messages</h3>
            <p>Select a conversation to start chatting</p>
            <div className={`ws-status-big ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? <><Wifi size={16}/> Live</> : <><WifiOff size={16}/> Connecting...</>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
