import fs from "fs";
import path from "path";
import pg from "pg";

const MIGRATIONS_DIR = "./src/lib/db/migrations";

async function runMigrations() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Create migrations tracking table if it doesn't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL UNIQUE,
      created_at BIGINT NOT NULL
    )
  `);

  // Read journal to get migration order
  const journal = JSON.parse(
    fs.readFileSync(path.join(MIGRATIONS_DIR, "meta", "_journal.json"), "utf8")
  );

  // Get already-applied migrations
  const { rows: applied } = await client.query(
    "SELECT hash FROM __drizzle_migrations"
  );
  const appliedHashes = new Set(applied.map((r) => r.hash));

  for (const entry of journal.entries) {
    if (appliedHashes.has(entry.tag)) {
      console.log(`[migrate] Skipping ${entry.tag} (already applied)`);
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, `${entry.tag}.sql`);
    const migration = fs.readFileSync(filePath, "utf8");

    // Split by breakpoints (drizzle uses --> statement-breakpoint)
    const statements = migration
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await client.query(statement);
    }

    await client.query(
      "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2)",
      [entry.tag, Date.now()]
    );

    console.log(`[migrate] Applied ${entry.tag}`);
  }

  console.log("[migrate] All migrations complete.");
  await client.end();
}

runMigrations().catch((err) => {
  console.error("[migrate] Migration failed:", err);
  process.exit(1);
});
