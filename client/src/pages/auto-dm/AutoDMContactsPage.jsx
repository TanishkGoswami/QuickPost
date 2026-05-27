import React, { useState, useEffect } from 'react';
import { useAutoDM } from '../../context/AutoDMContext';
import { Search, ExternalLink, MessageCircle, Download, Filter, X } from 'lucide-react';

function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function MessageHistoryDialog({ contact, messages, loading, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, height: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
            {contact.profile_picture_url ? (
              <img src={contact.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#6366f1' }}>
                {contact.username[0].toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>@{contact.username}</h2>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Message History</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f9fafb' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', fontSize: 14 }}>Loading...</div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
              <MessageCircle size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
              <p style={{ fontSize: 14, margin: 0 }}>No message history</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.direction === 'outbound' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%', padding: '8px 14px', borderRadius: msg.direction === 'outbound' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.direction === 'outbound' ? '#6366f1' : '#fff',
                    color: msg.direction === 'outbound' ? '#fff' : '#1a1a1a',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    border: msg.direction === 'inbound' ? '1px solid #f0f0f0' : 'none',
                  }}>
                    <p style={{ fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                    <p style={{ fontSize: 10, margin: '4px 0 0', opacity: 0.65, textAlign: msg.direction === 'outbound' ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, textAlign: 'center' }}>
            Automated message log · Reply via Instagram or Meta inbox
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AutoDMContactsPage() {
  const { contacts, setContacts, contactsLoading, loadContacts, activeAccount, fetchMessagesForContact } = useAutoDM();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const PER_PAGE = 10;

  useEffect(() => {
    if (activeAccount?.id) loadContacts();
  }, [activeAccount?.id]);

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return c.username.toLowerCase().includes(q) || (c.full_name?.toLowerCase() || '').includes(q);
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const openMessages = async (contact) => {
    setSelectedContact(contact);
    setMessages([]);
    setMessagesLoading(true);
    try {
      const data = await fetchMessagesForContact(contact.id);
      setMessages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setMessagesLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Username', 'Name', 'Follows You', 'You Follow', 'Msg Sent', 'First Interaction', 'Last Interaction'];
    const rows = contacts.map(c => [
      c.username, c.full_name || '', c.is_following_you ? 'Yes' : 'No',
      c.you_are_following ? 'Yes' : 'No', c.total_messages_sent,
      c.first_interaction_at, c.last_interaction_at,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'contacts.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div style={{ fontFamily: 'var(--font, Inter, sans-serif)' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>GAP AutoDM</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Contacts</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 14 }}>
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''} · Instagram accounts that interacted with your automations
        </p>
      </div>

      {/* Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search contacts..."
            style={{
              width: '100%', paddingLeft: 34, padding: '9px 12px 9px 34px',
              borderRadius: 9, border: '1px solid #e5e7eb', background: '#fff',
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
          <Download size={14} /> Export
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Head */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #f0f0f0', gap: 12 }}>
          {['CONTACT', 'MESSAGES', 'RELATIONSHIP', 'LAST SEEN', 'ACTION'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>{h}</span>
          ))}
        </div>

        {contactsLoading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(i => <div key={i} style={{ height: 52, background: '#f3f4f6', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <MessageCircle size={36} style={{ color: '#d1d5db', marginBottom: 10 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: '0 0 4px' }}>No contacts yet</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Contacts appear when users interact with your automations</p>
          </div>
        ) : paginated.map((contact, i) => (
          <div key={contact.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px',
            padding: '14px 20px', alignItems: 'center', gap: 12,
            borderBottom: i < paginated.length - 1 ? '1px solid #f0f0f0' : 'none',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Contact */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                {contact.profile_picture_url ? (
                  <img src={contact.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#6366f1' }}>
                    {contact.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {contact.full_name || contact.username}
                </p>
                <a href={`https://instagram.com/${contact.username}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  @{contact.username} <ExternalLink size={9} />
                </a>
              </div>
            </div>
            {/* Messages */}
            <div style={{ fontSize: 12 }}>
              <div style={{ color: '#6366f1', fontWeight: 600 }}>📤 {contact.total_messages_sent || 0}</div>
              <div style={{ color: '#3b82f6', fontWeight: 600 }}>📥 {contact.total_messages_received || 0}</div>
            </div>
            {/* Relationship */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {contact.you_are_following && (
                <span style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>You Follow</span>
              )}
              {contact.is_following_you && (
                <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>Follows You</span>
              )}
              {!contact.you_are_following && !contact.is_following_you && (
                <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
              )}
            </div>
            {/* Last seen */}
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {formatRelativeTime(contact.last_interaction_at)}
            </div>
            {/* Action */}
            <button
              onClick={() => openMessages(contact)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <MessageCircle size={12} /> History
            </button>
          </div>
        ))}

        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}>
                ←
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}>
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message history dialog */}
      {selectedContact && (
        <MessageHistoryDialog
          contact={selectedContact}
          messages={messages}
          loading={messagesLoading}
          onClose={() => { setSelectedContact(null); setMessages([]); }}
        />
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}
