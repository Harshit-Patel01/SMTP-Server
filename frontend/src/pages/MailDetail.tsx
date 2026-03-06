import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';
import type { FullEmail } from '../api';
import ThemeToggle from '../components/ThemeToggle';
import './MailDetail.css';

export default function MailDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState<FullEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api.getMail(id)
      .then((res) => {
        if (!cancelled) setEmail(res.email);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await api.deleteMail(id);
      navigate('/inbox');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  if (loading) return <div className="mail-detail-loading">Loading…</div>;
  if (error || !email) {
    return (
      <div className="mail-detail-page">
        <header className="detail-header">
          <Link to="/inbox" className="back">← Inbox</Link>
          <ThemeToggle />
        </header>
        <p className="error-msg">{error || 'Email not found.'}</p>
      </div>
    );
  }

  const isHtml = email.body.trim().startsWith('<');
  const date = new Date(email.created_at).toLocaleString();

  return (
    <div className="mail-detail-page">
      <header className="detail-header">
        <Link to="/inbox" className="back">← Back to inbox</Link>
        <div className="detail-header-actions">
          <ThemeToggle />
          <button type="button" className="text-link danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </header>

      <article className="mail-detail-card">
        <div className="mail-detail-meta">
          <div className="mail-detail-from">
            <strong>From:</strong> {email.sender}
          </div>
          <div className="mail-detail-to">
            <strong>To:</strong> {email.receiver}
          </div>
          <div className="mail-detail-date">{date}</div>
        </div>
        <h1 className="mail-detail-subject">{email.header || '(No subject)'}</h1>
        {isHtml ? (
          <div
            className="mail-detail-body html"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
        ) : (
          <div className="mail-detail-body text">
            <pre>{email.body || 'No content.'}</pre>
          </div>
        )}
      </article>
    </div>
  );
}
