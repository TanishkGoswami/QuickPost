import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Header({ onMenuClick }) {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      right: 0,
      left: 240,
      zIndex: 39,
      height: 56,
      background: 'var(--canvas-lifted)',
      borderBottom: '1px solid rgba(20,20,19,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      fontFamily: 'var(--font)',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        aria-label="Toggle Menu"
        className="lg:hidden"
        style={{
          width: 36, height: 36, borderRadius: 'var(--r-btn)',
          border: '1px solid rgba(20,20,19,0.10)',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--slate)', transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(20,20,19,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Menu size={16} />
      </button>

      {/* Right: user pill */}
      <div style={{ marginLeft: 'auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 12px 5px 5px',
          borderRadius: 'var(--r-pill)',
          background: 'var(--canvas)',
          border: '1px solid rgba(20,20,19,0.10)',
          boxShadow: 'var(--shadow-nav)',
        }}>
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--canvas-lifted)' }}
            />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--ink)', color: 'var(--canvas)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
          )}
          <span style={{
            fontSize: 12, fontWeight: 600, color: 'var(--ink)',
            maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', letterSpacing: '-0.01em',
          }}>
            {user.name || 'Account'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;
