import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';
import type { InboxEmail } from '../api';
import ThemeToggle from '../components/ThemeToggle';
import './Inbox.css';

const REFRESH_INTERVAL = 30;

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const s = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function getSenderInitial(sender: string): string {
  const name = sender.split('@')[0] || sender;
  return (name[0] || '?').toUpperCase();
}

function getSenderColor(sender: string): string {
  const colors = ['#0d9488', '#059669', '#2563eb', '#7c3aed', '#dc2626', '#ea580c'];
  let h = 0;
  for (let i = 0; i < sender.length; i++) h += sender.charCodeAt(i);
  return colors[h % colors.length];
}

const VALID_USERNAME = /^[a-zA-Z0-9._-]+$/;
const SESSION_STORAGE_KEY = 'mailflow-inbox-session';

function loadSession(): { domain: string; currentEmail: string; addresses: string[] } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { domain?: string; currentEmail?: string; addresses?: string[] };
    if (!data.currentEmail || !Array.isArray(data.addresses)) return null;
    return {
      domain: data.domain || '',
      currentEmail: data.currentEmail,
      addresses: data.addresses,
    };
  } catch {
    return null;
  }
}

function saveSession(domain: string, currentEmail: string | null, addresses: string[]) {
  if (!currentEmail) return;
  try {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ domain, currentEmail, addresses })
    );
  } catch {
    // ignore
  }
}

export default function Inbox() {
  const [domain, setDomain] = useState<string>('');
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customUsername, setCustomUsername] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (currentEmail && domain) saveSession(domain, currentEmail, addresses);
  }, [currentEmail, domain, addresses]);

  const loadConfigAndEmail = useCallback(async () => {
    try {
      const config = await api.getConfig();
      setDomain(config.domain);
      const stored = loadSession();
      if (stored && stored.currentEmail && stored.addresses.length > 0) {
        setCurrentEmail(stored.currentEmail);
        setAddresses(stored.addresses);
        return;
      }
      const random = await api.getRandomEmail();
      setCurrentEmail(random.email);
      setAddresses((prev) => (prev.includes(random.email) ? prev : [random.email, ...prev].slice(0, 10)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    loadConfigAndEmail();
  }, [loadConfigAndEmail]);

  const handleUseCustomUsername = () => {
    setCustomError(null);
    const username = customUsername.trim().toLowerCase();
    if (!username) {
      setCustomError('Enter a username');
      return;
    }
    if (username.includes('@')) {
      setCustomError('Enter only the username (no @ or domain)');
      return;
    }
    if (!VALID_USERNAME.test(username)) {
      setCustomError('Use only letters, numbers, dots, hyphens, underscores');
      return;
    }
    if (!domain) {
      setCustomError('Loading domain…');
      return;
    }
    const email = `${username}@${domain}`;
    setCurrentEmail(email);
    setAddresses((prev) => (prev.includes(email) ? prev : [email, ...prev].slice(0, 10)));
    setLoading(true);
    setShowCustomInput(false);
    setCustomUsername('');
  };

  const fetchInbox = useCallback(async () => {
    if (!currentEmail) return;
    setError(null);
    try {
      const [inboxRes] = await Promise.all([
        api.getInbox(currentEmail),
        api.getStats(currentEmail),
      ]);
      setEmails(inboxRes.emails);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch inbox');
    } finally {
      setLoading(false);
    }
  }, [currentEmail]);

  useEffect(() => {
    if (!currentEmail) return;
    setLoading(true);
    fetchInbox();
  }, [currentEmail, fetchInbox]);

  useEffect(() => {
    if (!autoRefresh || !currentEmail) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          fetchInbox();
          return REFRESH_INTERVAL;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [autoRefresh, currentEmail, fetchInbox]);

  const handleGenerate = async () => {
    try {
      const { email } = await api.getRandomEmail();
      setCurrentEmail(email);
      setAddresses((prev) => (prev.includes(email) ? prev : [email, ...prev].slice(0, 10)));
      setLoading(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
    }
  };

  const handleCopy = () => {
    if (currentEmail) navigator.clipboard.writeText(currentEmail);
  };

  const handleMarkAllRead = async () => {
    if (!currentEmail) return;
    try {
      await api.markAllRead(currentEmail);
      setEmails((prev) => prev.map((e) => ({ ...e, is_read: true })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  };

  const handleDeleteAll = async () => {
    if (!currentEmail) return;
    try {
      await api.clearInbox(currentEmail);
      setEmails([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  };

  const handleDeleteOne = async (id: string) => {
    try {
      await api.deleteMail(id);
      setEmails((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  };

  const filteredEmails = search.trim()
    ? emails.filter(
        (e) =>
          e.sender.toLowerCase().includes(search.toLowerCase()) ||
          (e.header || '').toLowerCase().includes(search.toLowerCase())
      )
    : emails;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        fetchInbox();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fetchInbox]);

  return (
    <div className="inbox-page">
      <header className="inbox-header">
        <Link to="/" className="logo">
          <span className="logo-icon">◇</span>
          <span>Mailflow</span>
        </Link>
        <button
          type="button"
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
        <div className={`header-actions header-nav ${menuOpen ? 'open' : ''}`}>
          <button
            type="button"
            className="icon-btn nav-item"
            onClick={() => { setAutoRefresh((a) => !a); setMenuOpen(false); }}
            title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M21 21v-5h-5" /></svg>
            {autoRefresh ? 'Auto-refresh' : 'Paused'} ({countdown}s)
          </button>
          <Link to="/" className="text-link nav-item" onClick={() => setMenuOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            Home
          </Link>
          <ThemeToggle />
        </div>
      </header>
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} aria-hidden />}

      <main className="inbox-main">
        <div className="inbox-hero">
          <h1>Temporary email</h1>
          <p>No signup. Instant address. Your inbox stays clean.</p>
        </div>

        <div className="email-card">
          <div className="email-card-top">
            <span className="label">Your temporary email</span>
            <div className="email-card-hints">
              {autoRefresh && (
                <span className="auto-refresh">Auto-refresh in {countdown}s</span>
              )}
              <span className="kbd-hint" title="Refresh inbox">Ctrl+R</span>
            </div>
          </div>
          <div className="email-display-row">
            <div className="email-input-wrap">
              <span className="email-at">@</span>
              <input
                type="text"
                readOnly
                value={currentEmail || 'Loading…'}
                className="email-input"
                aria-label="Current email address"
              />
            </div>
            <div className="email-actions-row">
              <button type="button" className="btn btn-primary" onClick={handleGenerate}>
                + Generate new
              </button>
              <button type="button" className="btn btn-icon" onClick={handleCopy} title="Copy">
                ⎘
              </button>
            </div>
          </div>
          {addresses.length > 1 && (
            <div className="address-switcher">
              <span className="address-switcher-label">Switch to address:</span>
              <div className="address-chips">
                {addresses.map((addr) => (
                  <button
                    key={addr}
                    type="button"
                    className={`address-chip ${addr === currentEmail ? 'active' : ''}`}
                    onClick={() => setCurrentEmail(addr)}
                  >
                    {addr}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!showCustomInput ? (
            <button
              type="button"
              className="btn btn-ghost choose-custom-btn"
              onClick={() => setShowCustomInput(true)}
            >
              Choose custom address
            </button>
          ) : (
            <div className="custom-username-row">
              <label htmlFor="custom-username" className="custom-username-label">
                Enter your username
              </label>
              <div className="custom-username-input-group">
                <input
                  id="custom-username"
                  type="text"
                  placeholder="username"
                  value={customUsername}
                  onChange={(e) => { setCustomUsername(e.target.value); setCustomError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleUseCustomUsername()}
                  className="custom-username-input"
                  autoComplete="off"
                />
                <span className="custom-username-domain">@{domain || '…'}</span>
                <button type="button" className="btn btn-secondary" onClick={handleUseCustomUsername}>
                  Use this address
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowCustomInput(false); setCustomError(null); setCustomUsername(''); }}>
                  Cancel
                </button>
              </div>
              {customError && <p className="custom-username-error">{customError}</p>}
            </div>
          )}
        </div>


        <section className="inbox-section">
          <div className="inbox-section-head">
            <h2>Inbox</h2>
            <div className="inbox-actions">
              <button type="button" className="text-link" onClick={handleMarkAllRead}>
                Mark all read
              </button>
              <button type="button" className="text-link danger" onClick={handleDeleteAll}>
                Delete all
              </button>
            </div>
          </div>
          <div className="inbox-toolbar">
            <input
              type="search"
              placeholder="Search sender or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          {loading && emails.length === 0 ? (
            <p className="empty-msg">Loading inbox…</p>
          ) : filteredEmails.length === 0 ? (
            <p className="empty-msg">No emails yet. Use your address to sign up somewhere—messages appear here.</p>
          ) : (
            <ul className="email-list">
              {filteredEmails.map((email) => (
                <li key={email.id} className={`email-item ${!email.is_read ? 'unread' : ''}`}>
                  <div
                    className="email-item-avatar"
                    style={{ background: getSenderColor(email.sender) }}
                  >
                    {getSenderInitial(email.sender)}
                  </div>
                  <Link to={`/mail/${email.id}`} className="email-item-body">
                    <div className="email-item-top">
                      <span className="sender-name">{email.sender}</span>
                      {!email.is_read && <span className="badge new">New</span>}
                      <span className="email-item-time">{formatTimeAgo(email.created_at)}</span>
                    </div>
                    <div className="email-item-addr">{email.sender}</div>
                    <div className="email-item-subject">{email.header || '(No subject)'}</div>
                  </Link>
                  <div className="email-item-actions">
                    <button
                      type="button"
                      className="icon-btn small"
                      title="Delete"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteOne(email.id);
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
