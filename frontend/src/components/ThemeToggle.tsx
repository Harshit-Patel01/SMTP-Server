import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') return 'light';
    return (document.documentElement.getAttribute('data-theme') as 'dark') || 'light';
  });

  useEffect(() => {
    const stored = localStorage.getItem('mailflow-theme') as 'dark' | null;
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
      setTheme(stored);
    }
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mailflow-theme', next);
    setTheme(next);
  };

  return (
    <button type="button" className="theme-toggle-header" onClick={toggle} title="Toggle theme">
      {theme === 'dark' ? '☀' : '☽'}
    </button>
  );
}
