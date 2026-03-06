import { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import './Landing.css';

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="logo">
          <span className="logo-icon">◇</span>
          <span>Mailflow</span>
        </div>
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
        <nav className={`landing-nav ${menuOpen ? 'open' : ''}`}>
          <a href="#features" onClick={() => setMenuOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            Features
          </a>
          <a href="#how" onClick={() => setMenuOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            How it works
          </a>
          <Link to="/inbox" className="btn btn-primary nav-cta" onClick={() => setMenuOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
            Get started
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} aria-hidden />}

      <section className="hero">
        <h1>Disposable email that flows.</h1>
        <p>Keep your real inbox clean. Get a temporary address in one click—no signup, no tracking.</p>
        <Link to="/inbox" className="btn btn-hero">Create temporary email</Link>
      </section>

      <section id="features" className="section why">
        <h2>Why Mailflow?</h2>
        <p className="section-desc">Protect your real email from spam, signups, and bots with instant disposable addresses.</p>
        <div className="cards">
          <div className="feature-card">
            <div className="feature-icon anonymous">◆</div>
            <h3>100% Anonymous</h3>
            <p>No signup, no personal info. Your privacy stays yours.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon instant">⚡</div>
            <h3>Instant</h3>
            <p>New address in one click. Start receiving in seconds.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon refresh">↻</div>
            <h3>Live inbox</h3>
            <p>Inbox updates automatically. Never miss a code or link.</p>
          </div>
        </div>
      </section>

      <section id="how" className="section how">
        <h2>How it works</h2>
        <p className="section-desc">Three steps. No account. No hassle.</p>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <h3>Get your address</h3>
            <p>Open Mailflow and get a random temporary email. Copy it or generate another.</p>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <h3>Use it anywhere</h3>
            <p>Paste it into signup forms, trials, or any site that needs an email.</p>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <h3>Read mail here</h3>
            <p>Messages show up in your Mailflow inbox. Read, copy codes, then forget the address.</p>
          </div>
        </div>
      </section>

      <section id="faq" className="section faq">
        <h2>FAQ</h2>
        <details className="faq-item">
          <summary>What happens to my emails after the session?</summary>
          <p>When you close the tab or the session ends, the temporary address stops receiving. Emails stored on our servers for that address can be deleted; we don’t keep them long-term.</p>
        </details>
        <details className="faq-item">
          <summary>Do I need to sign up?</summary>
          <p>No. Open Mailflow, get an address, and use it. No account, no password.</p>
        </details>
      </section>

      <section className="cta">
        <h2>Ready to keep your inbox clean?</h2>
        <p>Start using temporary email today. No registration, no cost.</p>
        <Link to="/inbox" className="btn btn-cta">Get started now</Link>
      </section>

      <footer className="landing-footer">
        <div className="footer-brand">
          <span className="logo-icon">◇</span>
          <span>Mailflow</span>
          <p>Disposable email for a cleaner inbox.</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <Link to="/inbox">App</Link>
          </div>
          <div>
            <h4>Legal</h4>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="copyright">© {new Date().getFullYear()} Mailflow.</p>
          <p className="footer-credit">
            Developed by <a href="https://www.instagram.com/hxrshit_s/" target="_blank" rel="noopener noreferrer">Harshit Singh</a> <span className="footer-handle">@hxrshit_s</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
