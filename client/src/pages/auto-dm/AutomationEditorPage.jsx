import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAutoDM } from '../../context/AutoDMContext';
import {
  ArrowLeft, Save, Loader2, Instagram, X, Image as ImageIcon,
  Zap, Clock, MessageCircle, Video, Radio, AtSign, Plus, Trash2, Info,
} from 'lucide-react';

const TRIGGER_TYPES = [
  { value: 'comment_on_post', label: 'User comments on your post', icon: '📷', description: 'Trigger when someone comments on an Instagram post', available: true },
  { value: 'comment_on_reel', label: 'User comments on your reel', icon: '🎬', description: 'Trigger when someone comments on an Instagram reel', available: true },
  { value: 'dm_received', label: 'User DMs to you', icon: '💬', description: 'Trigger when you receive a direct message', available: true },
  { value: 'live_comment', label: 'User comments on LIVE', icon: '🔴', description: 'Trigger when someone comments during your live stream', available: true },
  { value: 'story_reply', label: 'User replies to your stories', icon: '📸', description: 'Trigger when someone replies to your story', available: true },
  { value: 'story_mention', label: 'User mentions you in story', icon: '@', description: 'Coming soon', available: false },
];

// ── Keyword Input ──────────────────────────────────────────────────────────────
function KeywordInput({ keywords, onChange, caseSensitive, onCaseSensitiveChange }) {
  const [input, setInput] = useState('');

  const addKeyword = () => {
    const kw = input.trim();
    if (kw && !keywords.includes(kw)) {
      onChange([...keywords, kw]);
      setInput('');
    }
  };

  const removeKeyword = (kw) => onChange(keywords.filter(k => k !== kw));

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {keywords.map(kw => (
          <span key={kw} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: '#f0f4ff', border: '1px solid #c7d2fe', fontSize: 12, fontWeight: 600, color: '#6366f1' }}>
            {kw}
            <button onClick={() => removeKeyword(kw)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#818cf8', display: 'flex', alignItems: 'center' }}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
          placeholder="Type keyword and press Enter"
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none' }}
        />
        <button onClick={addKeyword} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Add
        </button>
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => onCaseSensitiveChange(!caseSensitive)} style={{
          width: 38, height: 20, borderRadius: 10, border: 'none',
          background: caseSensitive ? '#6366f1' : '#d1d5db',
          cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
        }}>
          <span style={{ position: 'absolute', top: 2, left: caseSensitive ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
        </button>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Case-sensitive matching</span>
      </div>
    </div>
  );
}

// ── Response Flow Builder ──────────────────────────────────────────────────────
function ResponseFlowBuilder({ responseFlow, onChange }) {
  const { nodes, opening_message_enabled, opening_message } = responseFlow;

  const addNode = (type) => {
    const id = `node-${Date.now()}`;
    const newNode = { id, type };
    if (type === 'text') newNode.content = '';
    if (type === 'buttons') newNode.content = ''; newNode.buttons = [{ id: `btn-${Date.now()}`, type: 'url', title: 'Button', url: '' }];
    if (type === 'card') { newNode.card_title = ''; newNode.card_subtitle = ''; newNode.buttons = []; }
    onChange({ ...responseFlow, nodes: [...nodes, newNode] });
  };

  const updateNode = (id, updates) => {
    onChange({ ...responseFlow, nodes: nodes.map(n => n.id === id ? { ...n, ...updates } : n) });
  };

  const removeNode = (id) => {
    onChange({ ...responseFlow, nodes: nodes.filter(n => n.id !== id) });
  };

  const nodeTypeLabel = (type) => ({ text: '💬 Text', buttons: '🔘 Buttons', card: '🃏 Card', image: '🖼️ Image', delay: '⏱️ Delay' }[type] || type);

  return (
    <div>
      <div style={{ marginBottom: 14, padding: 12, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Opening message (optional)</span>
          <button onClick={() => onChange({ ...responseFlow, opening_message_enabled: !opening_message_enabled })} style={{
            width: 38, height: 20, borderRadius: 10, border: 'none',
            background: opening_message_enabled ? '#22c55e' : '#d1d5db',
            cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          }}>
            <span style={{ position: 'absolute', top: 2, left: opening_message_enabled ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
        {opening_message_enabled && (
          <textarea
            value={opening_message || ''}
            onChange={e => onChange({ ...responseFlow, opening_message: e.target.value })}
            placeholder="Hi {{first_name}}! Thanks for reaching out..."
            rows={2}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
          />
        )}
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>DM Response Flow</p>

      {nodes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 13 }}>
          Add your first message node below
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {nodes.map((node, i) => (
          <div key={node.id} style={{ padding: 14, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fafafa', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af' }}>#{i+1}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: '#f0f4ff', padding: '2px 8px', borderRadius: 6 }}>{nodeTypeLabel(node.type)}</span>
              <button onClick={() => removeNode(node.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}>
                <Trash2 size={13} />
              </button>
            </div>

            {(node.type === 'text') && (
              <textarea
                value={node.content || ''}
                onChange={e => updateNode(node.id, { content: e.target.value })}
                placeholder="Message text... Use {{first_name}} for personalization"
                rows={3}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
              />
            )}
            {(node.type === 'card') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={node.card_title || ''} onChange={e => updateNode(node.id, { card_title: e.target.value })} placeholder="Card title" style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none' }} />
                <input value={node.card_subtitle || ''} onChange={e => updateNode(node.id, { card_subtitle: e.target.value })} placeholder="Card subtitle / body text" style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none' }} />
                {(node.buttons || []).map((btn, bi) => (
                  <div key={btn.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input value={btn.title} onChange={e => updateNode(node.id, { buttons: (node.buttons||[]).map((b,j) => j===bi ? {...b, title: e.target.value} : b) })} placeholder="Button label" style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none' }} />
                    <select value={btn.type} onChange={e => updateNode(node.id, { buttons: (node.buttons||[]).map((b,j) => j===bi ? {...b, type: e.target.value} : b) })} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none' }}>
                      <option value="url">URL</option>
                      <option value="postback">Postback</option>
                    </select>
                    {btn.type === 'url' && <input value={btn.url||''} onChange={e => updateNode(node.id, { buttons: (node.buttons||[]).map((b,j) => j===bi ? {...b, url: e.target.value} : b) })} placeholder="https://..." style={{ flex: 2, padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none' }} />}
                    <button onClick={() => updateNode(node.id, { buttons: (node.buttons||[]).filter((_,j) => j!==bi) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={12} /></button>
                  </div>
                ))}
                <button onClick={() => updateNode(node.id, { buttons: [...(node.buttons||[]), { id: `btn-${Date.now()}`, type: 'postback', title: 'SETUP', payload: 'setup' }] })} style={{ padding: '5px 10px', borderRadius: 6, border: '1px dashed #c7d2fe', background: 'transparent', fontSize: 11, fontWeight: 600, color: '#6366f1', cursor: 'pointer' }}>
                  + Add button
                </button>
              </div>
            )}
            {node.type === 'buttons' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea value={node.content||''} onChange={e => updateNode(node.id, { content: e.target.value })} placeholder="Button message text..." rows={2} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                {(node.buttons||[]).map((btn, bi) => (
                  <div key={btn.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input value={btn.title} onChange={e => updateNode(node.id, { buttons: (node.buttons||[]).map((b,j) => j===bi ? {...b, title: e.target.value} : b) })} placeholder="Button label" style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none' }} />
                    <input value={btn.url||btn.payload||''} onChange={e => updateNode(node.id, { buttons: (node.buttons||[]).map((b,j) => j===bi ? {...b, url: e.target.value, payload: e.target.value} : b) })} placeholder="URL or payload" style={{ flex: 2, padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none' }} />
                    <button onClick={() => updateNode(node.id, { buttons: (node.buttons||[]).filter((_,j) => j!==bi) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={12} /></button>
                  </div>
                ))}
                <button onClick={() => updateNode(node.id, { buttons: [...(node.buttons||[]), { id: `btn-${Date.now()}`, type: 'url', title: 'Click here', url: '' }] })} style={{ padding: '5px 10px', borderRadius: 6, border: '1px dashed #c7d2fe', background: 'transparent', fontSize: 11, fontWeight: 600, color: '#6366f1', cursor: 'pointer' }}>
                  + Add button
                </button>
              </div>
            )}
            {node.type === 'delay' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" min={1} max={60} value={node.delay_seconds||3} onChange={e => updateNode(node.id, { delay_seconds: parseInt(e.target.value)||3 })} style={{ width: 70, padding: '7px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none' }} />
                <span style={{ fontSize: 13, color: '#6b7280' }}>second delay</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add node buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          { type: 'text', label: '+ Text' },
          { type: 'card', label: '+ Card' },
          { type: 'buttons', label: '+ Buttons' },
          { type: 'delay', label: '+ Delay' },
        ].map(({ type, label }) => (
          <button key={type} onClick={() => addNode(type)} style={{
            padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb',
            background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#a5b4fc'; e.currentTarget.style.color = '#6366f1'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Media Selector ─────────────────────────────────────────────────────────────
function MediaSelectorModal({ onSelect, onClose, fetchMedia }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMedia(30);
        setMedia(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Select Post or Reel</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 16 }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
              {[1,2,3,4,5,6].map(i => <div key={i} style={{ aspectRatio: '1', background: '#f3f4f6', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
              {media.map(item => (
                <button key={item.id} onClick={() => { onSelect(item); onClose(); }} style={{ padding: 0, border: '2px solid transparent', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                  <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                    <img src={item.thumbnail_url || item.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {item.caption && <p style={{ fontSize: 10, color: '#6b7280', margin: '4px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.caption}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}

// ── Section Card ───────────────────────────────────────────────────────────────
function Section({ step, title, children, note }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
          {step}
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>
        {note && <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>{note}</div>}
        {children}
      </div>
    </div>
  );
}

// ── Main Editor ────────────────────────────────────────────────────────────────
export default function AutomationEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { activeAccount, getAutomation, createAutomation, updateAutomation: updateFn, fetchInstagramMedia } = useAutoDM();

  const isNew = !id || id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [toast, setToast] = useState(null);

  // Form state
  const [name, setName] = useState('Untitled Automation');
  const [triggerType, setTriggerType] = useState(searchParams.get('trigger') || 'comment_on_post');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [applyToAll, setApplyToAll] = useState(true);
  const [keywords, setKeywords] = useState([]);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [commentReplyEnabled, setCommentReplyEnabled] = useState(true);
  const [commentReplyText, setCommentReplyText] = useState('Sent it to your DM. Tap SETUP to continue.');
  const [scheduleType, setScheduleType] = useState('duration');
  const [durationDays, setDurationDays] = useState('7');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [responseFlow, setResponseFlow] = useState({
    nodes: [
      { id: 'starter-card', type: 'card', card_title: 'Get your free guide', card_subtitle: 'Tap SETUP below and I will send everything in DM.', buttons: [{ id: 'starter-setup', type: 'postback', title: 'SETUP', payload: 'setup' }] },
      { id: 'starter-text', type: 'text', content: 'Hey {{first_name}}, here is the guide you asked for:\nhttps://your-link.com' },
    ],
    opening_message_enabled: false,
    opening_message: '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!isNew && id) loadAutomation(id);
  }, [id, isNew]);

  const loadAutomation = async (automationId) => {
    try {
      const data = await getAutomation(automationId);
      if (!data) throw new Error('Not found');
      setName(data.name);
      setTriggerType(data.trigger_type);
      if (data.media_id) {
        setSelectedMedia({ id: data.media_id, media_url: data.media_url || '', thumbnail_url: data.media_thumbnail || '', permalink: data.media_permalink || '', media_type: 'IMAGE', timestamp: '' });
        setApplyToAll(false);
      }
      setKeywords(data.keywords || []);
      setCaseSensitive(data.is_case_sensitive);
      setCommentReplyEnabled(data.comment_reply_enabled);
      setCommentReplyText(data.comment_reply_text || '');
      setScheduleType(data.schedule_type || 'manual');
      if (data.starts_at) setStartsAt(new Date(data.starts_at).toISOString().slice(0, 16));
      if (data.ends_at) setEndsAt(new Date(data.ends_at).toISOString().slice(0, 16));
      setResponseFlow(data.response_flow || { nodes: [], opening_message_enabled: false });
      setIsActive(data.is_active);
    } catch (e) {
      showToast(e.message || 'Failed to load', 'error');
      navigate('/dashboard/auto-dm/automations');
    } finally {
      setIsLoading(false);
    }
  };

  const buildSchedule = () => {
    if (scheduleType === 'manual') return { schedule_type: 'manual', starts_at: null, ends_at: null };
    const start = startsAt ? new Date(startsAt) : new Date();
    let end;
    if (scheduleType === 'duration') {
      end = new Date(start.getTime() + parseInt(durationDays) * 24 * 60 * 60 * 1000);
    } else {
      if (!endsAt) return null;
      end = new Date(endsAt);
    }
    return { schedule_type: scheduleType, starts_at: start.toISOString(), ends_at: end.toISOString() };
  };

  const handleSave = async () => {
    if (!activeAccount) {
      showToast('Please connect an Instagram account first', 'error');
      return;
    }
    if (keywords.length === 0) { showToast('Add at least one keyword', 'error'); return; }
    if (responseFlow.nodes.length === 0) { showToast('Add at least one response node', 'error'); return; }

    const schedule = buildSchedule();
    if (!schedule) { showToast('Please select a valid end date', 'error'); return; }

    setIsSaving(true);
    try {
      const payload = {
        instagram_account_id: activeAccount.id,
        name,
        trigger_type: triggerType,
        media_id: applyToAll ? null : selectedMedia?.id || null,
        media_url: applyToAll ? null : selectedMedia?.media_url || null,
        media_thumbnail: applyToAll ? null : selectedMedia?.thumbnail_url || selectedMedia?.media_url || null,
        keywords,
        is_case_sensitive: caseSensitive,
        comment_reply_enabled: commentReplyEnabled,
        comment_reply_text: commentReplyEnabled ? commentReplyText : null,
        response_flow: responseFlow,
        is_active: isActive,
        ...schedule,
        expired_at: null,
      };

      if (isNew) {
        await createAutomation({ ...payload, follower_count_at_create: activeAccount.followers_count || null });
        showToast('Automation created!');
      } else {
        await updateFn(id, payload);
        showToast('Automation saved!');
      }
      setTimeout(() => navigate('/dashboard/auto-dm/automations'), 600);
    } catch (e) {
      showToast(e.response?.data?.error || e.message || 'Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const needsMedia = ['comment_on_post', 'comment_on_reel'].includes(triggerType);
  const isCommentTrigger = ['comment_on_post', 'comment_on_reel', 'live_comment'].includes(triggerType);
  let stepNum = 0;

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#6366f1' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font, Inter, sans-serif)' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 200, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4', color: toast.type === 'error' ? '#991b1b' : '#166534', border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/dashboard/auto-dm/automations')} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280' }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <input value={name} onChange={e => setName(e.target.value)} style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', border: 'none', outline: 'none', background: 'transparent', width: '100%' }} placeholder="Automation name" />
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Click to rename</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Active</span>
          <button onClick={() => setIsActive(!isActive)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: isActive ? '#6366f1' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
            <span style={{ position: 'absolute', top: 2, left: isActive ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
          </button>
          <button onClick={handleSave} disabled={isSaving} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px',
            borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff',
            fontWeight: 600, fontSize: 14, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1,
          }}>
            {isSaving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
            {isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left column */}
        <div>
          {/* Trigger */}
          <Section step={++stepNum} title="Select a Trigger">
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>When should this automation run?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TRIGGER_TYPES.map(t => (
                <button key={t.value} disabled={!t.available} onClick={() => setTriggerType(t.value)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 10, border: `1.5px solid ${triggerType === t.value ? '#6366f1' : '#e5e7eb'}`,
                  background: triggerType === t.value ? '#f0f4ff' : '#fff',
                  cursor: t.available ? 'pointer' : 'not-allowed',
                  opacity: t.available ? 1 : 0.4, textAlign: 'left',
                }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: triggerType === t.value ? '#6366f1' : '#1a1a1a', margin: 0 }}>{t.label}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{t.description}</p>
                  </div>
                  {!t.available && <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>SOON</span>}
                </button>
              ))}
            </div>
          </Section>

          {/* Media */}
          {needsMedia && (
            <Section step={++stepNum} title="Pick Post or Reel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>All posts & reels</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Trigger on any post or reel</p>
                </div>
                <button onClick={() => { setApplyToAll(!applyToAll); if (!applyToAll) setSelectedMedia(null); }} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: applyToAll ? '#6366f1' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 2, left: applyToAll ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
                </button>
              </div>

              {!applyToAll && (
                selectedMedia ? (
                  <div style={{ position: 'relative' }}>
                    <img src={selectedMedia.thumbnail_url || selectedMedia.media_url} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10 }} />
                    <button onClick={() => setSelectedMedia(null)} style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', color: '#fff' }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowMediaPicker(true)} style={{ width: '100%', padding: '24px', borderRadius: 10, border: '2px dashed #c7d2fe', background: '#f9fafb', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <ImageIcon size={24} color="#6366f1" />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', margin: 0 }}>Select Post or Reel</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Choose from your Instagram posts</p>
                  </button>
                )
              )}
            </Section>
          )}

          {/* Keywords */}
          <Section step={++stepNum} title="Add Trigger Keywords">
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
              If a comment or DM contains any of these words, the automation runs.
            </p>
            <KeywordInput keywords={keywords} onChange={setKeywords} caseSensitive={caseSensitive} onCaseSensitiveChange={setCaseSensitive} />
          </Section>

          {/* Schedule */}
          <Section step={++stepNum} title="Automation Duration" note={null}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>How long should this run?</label>
              <select value={scheduleType} onChange={e => setScheduleType(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none' }}>
                <option value="duration">Run for a fixed duration</option>
                <option value="custom">Custom start and end time</option>
                <option value="manual">Run until manually turned off</option>
              </select>
            </div>
            {scheduleType === 'duration' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Duration</label>
                  <select value={durationDays} onChange={e => setDurationDays(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none' }}>
                    <option value="1">24 hours</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Start</label>
                  <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}
            {scheduleType === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Start</label>
                  <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>End</label>
                  <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* Right column */}
        <div>
          {isCommentTrigger && (
            <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, marginBottom: 16, fontSize: 12, color: '#92400e' }}>
              Instagram allows one private reply per comment. Put the main CTA first, then continue the full sequence from a DM keyword like "SETUP".
            </div>
          )}

          <Section step={++stepNum} title="DM Response Flow">
            <ResponseFlowBuilder responseFlow={responseFlow} onChange={setResponseFlow} />
          </Section>

          {isCommentTrigger && (
            <Section step={++stepNum} title="Comment Reply">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Enable comment reply</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Post a public reply under the user's comment</p>
                </div>
                <button onClick={() => setCommentReplyEnabled(!commentReplyEnabled)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: commentReplyEnabled ? '#6366f1' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 2, left: commentReplyEnabled ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
                </button>
              </div>
              {commentReplyEnabled && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Reply text</label>
                  <textarea value={commentReplyText} onChange={e => setCommentReplyText(e.target.value)} placeholder="Check your DM!" rows={3} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: '6px 0 0' }}>Posted once per user per post.</p>
                </div>
              )}
            </Section>
          )}
        </div>
      </div>

      {showMediaPicker && (
        <MediaSelectorModal
          onSelect={setSelectedMedia}
          onClose={() => setShowMediaPicker(false)}
          fetchMedia={fetchInstagramMedia}
        />
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
