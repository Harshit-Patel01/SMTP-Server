// Use relative URLs so API calls go to same origin (works with nginx proxy on AWS)
const API_BASE = '';
export type InboxEmail = {
  id: string;
  sender: string;
  header: string;
  created_at: string;
  is_read: boolean;
};

export type FullEmail = InboxEmail & {
  receiver: string;
  body: string;
};

export type Config = { domain: string };
export type RandomEmail = { email: string; username: string };
export type Stats = { emailCount: number };

export async function getConfig(): Promise<Config> {
  const r = await fetch(`${API_BASE}/api/config`);
  if (!r.ok) throw new Error('Failed to fetch config');
  return r.json();
}

export async function getRandomEmail(): Promise<RandomEmail> {
  const r = await fetch(`${API_BASE}/api/email/random`);
  if (!r.ok) throw new Error('Failed to generate email');
  return r.json();
}

export async function getInbox(email: string): Promise<{ emails: InboxEmail[] }> {
  const r = await fetch(`${API_BASE}/api/inbox/${encodeURIComponent(email)}`);
  if (!r.ok) throw new Error('Failed to fetch inbox');
  return r.json();
}

export async function getMail(id: string): Promise<{ email: FullEmail }> {
  const r = await fetch(`${API_BASE}/api/mail/${id}`);
  if (!r.ok) throw new Error('Failed to fetch email');
  return r.json();
}

export async function deleteMail(id: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/mail/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Failed to delete email');
}

export async function clearInbox(email: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/inbox/${encodeURIComponent(email)}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Failed to clear inbox');
}

export async function markAllRead(email: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/inbox/${encodeURIComponent(email)}/read`, { method: 'PATCH' });
  if (!r.ok) throw new Error('Failed to mark all read');
}

export async function getStats(email: string): Promise<Stats> {
  const r = await fetch(`${API_BASE}/api/stats/${encodeURIComponent(email)}`);
  if (!r.ok) throw new Error('Failed to fetch stats');
  return r.json();
}
