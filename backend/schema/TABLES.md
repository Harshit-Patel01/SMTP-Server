# Mailflow – Required tables and columns (Postgres)

All tables are created by `01_init.sql` when the Postgres container is first started (or when you run the script manually).

## Table: `mails`

Stores every email received by the SMTP server for temporary addresses.

| Column      | Type         | Nullable | Default              | Description                    |
|------------|--------------|----------|----------------------|--------------------------------|
| `id`       | UUID         | NO       | `gen_random_uuid()`  | Primary key                    |
| `sender`   | TEXT         | NO       | —                    | Sender address/name             |
| `receiver` | TEXT         | NO       | —                    | Recipient (temp email address) |
| `header`   | TEXT         | NO       | `''`                 | Subject line                   |
| `body`     | TEXT         | NO       | `''`                 | HTML or plain body             |
| `created_at` | TIMESTAMPTZ | NO       | `now()`              | When the email was received    |
| `is_read`  | BOOLEAN      | NO       | `false`              | Whether the user marked it read |

### Indexes

- `idx_mails_receiver_created_at` on `(receiver, created_at DESC)` – for inbox listing
- `idx_mails_id` on `(id)` – for single-email lookups
