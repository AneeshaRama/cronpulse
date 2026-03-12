import pg from "pg";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://cronpulse:cronpulse@localhost:5432/cronpulse_test";

export async function setup() {
  const client = new pg.Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE monitor_status AS ENUM ('pending', 'healthy', 'late', 'down');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE alert_channel_type AS ENUM ('email', 'slack', 'discord', 'telegram', 'webhook');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE alert_status AS ENUM ('pending', 'sent', 'failed');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      name TEXT,
      email_verified TIMESTAMP,
      image TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS accounts (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL DEFAULT 'My Project',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS monitors (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      name TEXT NOT NULL,
      status monitor_status NOT NULL DEFAULT 'pending',
      schedule TEXT NOT NULL,
      grace_period INTEGER NOT NULL DEFAULT 300,
      ping_url TEXT NOT NULL UNIQUE,
      last_ping_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pings (
      id TEXT PRIMARY KEY,
      monitor_id TEXT NOT NULL REFERENCES monitors(id),
      pinged_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS alert_channels (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      type alert_channel_type NOT NULL,
      config JSONB NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS alert_queue (
      id TEXT PRIMARY KEY,
      monitor_id TEXT NOT NULL REFERENCES monitors(id),
      alert_channel_id TEXT NOT NULL REFERENCES alert_channels(id),
      status alert_status NOT NULL DEFAULT 'pending',
      payload JSONB NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_attempted_at TIMESTAMP,
      sent_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await client.end();
}
