import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Search, MoreVertical, Smile, Paperclip, ArrowLeft, Wifi, WifiOff, ShieldCheck, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import './ChatPage.css';

export default function ChatPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showConvoList, setShowConvoList] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [dealNotice, setDealNotice] = useState('');
  const bottomRef = useRef(null);
  const activeConvIdRef = useRef(null);
  activeConvIdRef.current = activeConvId;

  const requestedConversationId = location.state?.conversationId || null;

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherUser = activeConv?.other_user;
  const isSeller = !!activeConv && activeConv.seller_id === user?.id;
  const isBuyer = !!activeConv && activeConv.buyer_id === user?.id;

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'new_message') {
      const message = msg.data;
      if (message.conversation_id === activeConvIdRef.current) {
        setMessages((prev) => {
          const withoutTemp = prev.filter(
            (item) =>
              !(String(item.id).startsWith('temp-') && item.text === message.text && item.sender_id === message.sender_id)
          );
          return withoutTemp.find((item) => item.id === message.id) ? withoutTemp : [...withoutTemp, message];
        });
      }

      setConversations((prev) => {
        const next = prev.map((conv) =>
          conv.id === message.conversation_id
            ? {
                ...conv,
                last_message: message.text,
                last_message_at: message.created_at,
                unread_count: message.conversation_id === activeConvIdRef.current ? 0 : (conv.unread_count || 0) + 1,
              }
            : conv
        );
        return next.sort((a, b) => new Date(b.last_message_at || b.created_at) - new Date(a.last_message_at || a.created_at));
      });
    }

    if (msg.type === 'otp_requested') {
      const { conversation_id, data } = msg;

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversation_id
            ? {
                ...conv,
                pending_otp: true,
                pending_otp_expires_at: data?.expires_at || null,
              }
            : conv
        )
      );

      if (conversation_id === activeConvIdRef.current) {
        setOtpExpiresAt(data?.expires_at || null);
        if (data?.message) {
          setMessages((prev) => (prev.find((item) => item.id === data.message.id) ? prev : [...prev, data.message]));
        }
      }
    }

    if (msg.type === 'conversation_closed') {
      const { conversation_id, data } = msg;

      if (conversation_id === activeConvIdRef.current && data?.message) {
        setMessages((prev) => (prev.find((item) => item.id === data.message.id) ? prev : [...prev, data.message]));
      }

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversation_id
            ? {
                ...conv,
                status: 'closed',
                closed_at: data?.closed_at || new Date().toISOString(),
                pending_otp: false,
                pending_otp_expires_at: null,
                listing: conv.listing ? { ...conv.listing, status: 'sold' } : conv.listing,
                last_message: data?.message?.text || conv.last_message,
                last_message_at: data?.message?.created_at || conv.last_message_at,
              }
            : conv
        )
      );

      if (conversation_id === activeConvIdRef.current) {
        setOtpInput('');
        setGeneratedOtp('');
        setOtpExpiresAt(null);
        setDealNotice('Deal completed. This chat is now read-only and the listing is marked sold.');
      }
    }

    if (msg.type === 'typing') {
      setTypingUsers((current) => ({ ...current, [msg.conversation_id]: msg.userId }));
      setTimeout(() => {
        setTypingUsers((current) => {
          const next = { ...current };
          delete next[msg.conversation_id];
          return next;
        });
      }, 2500);
    }
  }, []);

  const { send: wsSend, connected } = useWebSocket(token, handleWsMessage);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    api.getConversations()
      .then((data) => {
        const realConversations = data.filter((conv) => conv.other_user?.id);
        setConversations(realConversations);

        if (requestedConversationId && realConversations.some((conv) => conv.id === requestedConversationId)) {
          setActiveConvId(requestedConversationId);
          setShowConvoList(false);
          return;
        }

        if (!activeConvIdRef.current && realConversations.length > 0) {
          setActiveConvId(realConversations[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, navigate, requestedConversationId]);

  useEffect(() => {
    if (!activeConvId) return;

    setMessages([]);
    setGeneratedOtp('');
    setOtpInput('');

    api.getMessages(activeConvId).then(setMessages).catch(console.error);
    wsSend({ type: 'mark_read', conversation_id: activeConvId });
    setConversations((prev) => prev.map((conv) => (conv.id === activeConvId ? { ...conv, unread_count: 0 } : conv)));
  }, [activeConvId, wsSend]);

  useEffect(() => {
    setOtpExpiresAt(activeConv?.pending_otp_expires_at || null);
  }, [activeConv?.pending_otp_expires_at]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConversations = conversations.filter((conv) => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return true;
    const name = conv.other_user?.full_name?.toLowerCase() || '';
    const listingTitle = conv.listing?.title?.toLowerCase() || '';
    const preview = conv.last_message?.toLowerCase() || '';
    return name.includes(term) || listingTitle.includes(term) || preview.includes(term);
  });

  const sendMessage = async () => {
    if (!input.trim() || !activeConvId || sending || activeConv?.status === 'closed') return;
    const text = input.trim();
    setInput('');
    setSending(true);

    const optimistic = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId,
      sender_id: user.id,
      text,
      created_at: new Date().toISOString(),
      sender: user,
    };

    setMessages((prev) => [...prev, optimistic]);
    wsSend({ type: 'send_message', conversation_id: activeConvId, text });
    setSending(false);
  };

  const handleGenerateOtp = async () => {
    if (!activeConvId || otpLoading) return;
    try {
      setOtpLoading(true);
      const data = await api.generateOtp(activeConvId);
      setGeneratedOtp(data.otp);
      setOtpExpiresAt(data.expires_at);
      setDealNotice('OTP generated. Share it with the buyer to complete the deal.');
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConvId
            ? { ...conv, pending_otp: true, pending_otp_expires_at: data.expires_at }
            : conv
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!activeConvId || otpInput.trim().length !== 6 || otpLoading) return;
    try {
      setOtpLoading(true);
      await api.verifyOtp(activeConvId, otpInput.trim());
      setOtpInput('');
    } catch (err) {
      alert(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const initials = (name) =>
    name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?';

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
            <input
              type="text"
              placeholder="Search chats..."
              className="convo-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="convo-items">
          {dealNotice && <div className="deal-notice-banner">{dealNotice}</div>}

          {loading && [...Array(4)].map((_, index) => (
            <div key={index} className="convo-skeleton">
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 13, width: '55%' }} />
                <div className="skeleton" style={{ height: 11, width: '75%' }} />
              </div>
            </div>
          ))}

          {!loading && conversations.length === 0 && (
            <div className="no-chats">
              <span>Messages</span>
              <p>No open conversations</p>
              <small>Start a conversation from any listing to see it here.</small>
            </div>
          )}

          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              className={`convo-item ${activeConvId === conv.id ? 'active' : ''} ${conv.status === 'closed' ? 'closed' : ''}`}
              onClick={() => {
                setActiveConvId(conv.id);
                setShowConvoList(false);
              }}
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
                <div className="convo-meta-row">
                  {conv.listing && <span className="convo-item-label">{conv.listing.title}</span>}
                  {conv.pending_otp && <span className="otp-chip">OTP pending</span>}
                  {conv.status === 'closed' && <span className="closed-chip">Closed</span>}
                </div>
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
                  {typingUsers[activeConvId] && activeConv?.status !== 'closed' && <span className="typing-indicator">typing...</span>}
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="chat-action-btn"><MoreVertical size={18} /></button>
              </div>
            </div>

            {activeConv.listing && (
              <div className="item-context-shell">
                <div className="item-context-bar">
                  <span className="context-label">About:</span>
                  <span className="context-item">{activeConv.listing.title}</span>
                  <span className="context-price">Rs. {Number(activeConv.listing.price).toLocaleString()}</span>
                </div>
                {activeConv.status !== 'closed' ? (
                  <div className="deal-panel">
                    <div className="deal-panel-copy">
                      <div className="deal-panel-title">
                        <ShieldCheck size={15} />
                        <span>Complete Deal</span>
                      </div>
                      <p>Verify the exchange with an OTP. Once verified, the item is marked sold and this chat becomes read-only for both users.</p>
                    </div>

                    {isSeller && (
                      <div className="deal-panel-actions">
                        <button className="deal-btn-primary" onClick={handleGenerateOtp} disabled={otpLoading}>
                          <KeyRound size={15} />
                          <span>{otpLoading ? 'Generating...' : 'Generate OTP'}</span>
                        </button>
                        {generatedOtp && (
                          <div className="otp-preview-box">
                            <span className="otp-preview-label">Share this OTP</span>
                            <div className="otp-preview-code">{generatedOtp}</div>
                            {otpExpiresAt && (
                              <small>
                                Expires at {new Date(otpExpiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </small>
                            )}
                          </div>
                        )}
                        {!generatedOtp && activeConv.pending_otp && (
                          <div className="otp-preview-box muted">
                            <span className="otp-preview-label">OTP already active</span>
                            <small>
                              {otpExpiresAt
                                ? `Waiting for buyer verification until ${new Date(otpExpiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`
                                : 'Waiting for buyer verification.'}
                            </small>
                          </div>
                        )}
                      </div>
                    )}

                    {isBuyer && (
                      <div className="deal-panel-actions">
                        <div className="otp-verify-row">
                          <input
                            type="text"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="otp-input"
                            placeholder="Enter 6-digit OTP"
                          />
                          <button
                            className="deal-btn-primary"
                            onClick={handleVerifyOtp}
                            disabled={otpLoading || otpInput.trim().length !== 6 || !activeConv.pending_otp}
                          >
                            <span>{otpLoading ? 'Verifying...' : 'Verify & Close'}</span>
                          </button>
                        </div>
                        <div className="otp-help-text">
                          {activeConv.pending_otp
                            ? `Seller has generated an OTP${otpExpiresAt ? ` until ${new Date(otpExpiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}.`
                            : 'Ask the seller to generate the deal-close OTP first.'}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="deal-panel closed-state">
                    <div className="deal-panel-copy">
                      <div className="deal-panel-title">
                        <ShieldCheck size={15} />
                        <span>Deal Closed</span>
                      </div>
                      <p>This item was sold and this conversation is now locked. You can still view the history, but messaging is disabled.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="messages-area">
              {messages.length === 0 && (
                <div className="messages-empty"><span>ðŸ‘‹</span><p>Say hello!</p></div>
              )}
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user.id;
                const showDate =
                  index === 0 ||
                  new Date(msg.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();

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
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input-area">
              <button className="chat-input-btn"><Paperclip size={18} /></button>
              <div className="chat-input-wrap">
                <input
                  type="text"
                  placeholder={activeConv?.status === 'closed' ? 'Conversation closed' : 'Type a message...'}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (activeConv?.status !== 'closed') {
                      wsSend({ type: 'typing', conversation_id: activeConvId });
                    }
                  }}
                  onKeyDown={handleKey}
                  className="chat-input"
                  disabled={activeConv?.status === 'closed'}
                />
                <button className="emoji-btn"><Smile size={18} /></button>
              </div>
              <button
                className={`send-btn ${input.trim() ? 'active' : ''}`}
                onClick={sendMessage}
                disabled={!input.trim() || sending || activeConv?.status === 'closed'}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">Messages</div>
            <h3>Your Messages</h3>
            <p>Select an open conversation to chat, or complete a deal to close one out.</p>
            <div className={`ws-status-big ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? <><Wifi size={16} /> Live</> : <><WifiOff size={16} /> Connecting...</>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
