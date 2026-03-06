-- Mailflow: required tables and columns for local Postgres
-- Run this once (e.g. via Docker init or manually) to create the schema.

-- Enable UUID extension (optional; we use gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: mails
-- Stores incoming emails received by the SMTP server for temporary addresses.
CREATE TABLE IF NOT EXISTS mails (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender      TEXT NOT NULL,
    receiver    TEXT NOT NULL,
    header      TEXT NOT NULL DEFAULT '',
    body        TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_read     BOOLEAN NOT NULL DEFAULT false
);

-- Index for listing inbox by receiver and sorting by time
CREATE INDEX IF NOT EXISTS idx_mails_receiver_created_at
    ON mails (receiver, created_at DESC);

-- Index for lookups by id (primary key already gives this; optional)
CREATE INDEX IF NOT EXISTS idx_mails_id ON mails (id);

COMMENT ON TABLE mails IS 'Temporary email messages received by Mailflow SMTP server';
