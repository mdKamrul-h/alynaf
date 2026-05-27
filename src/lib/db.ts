import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function getDbPath() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  return path.join(DATA_DIR, "alynaf.db");
}

function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  definition: string
) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch {
    // column already exists — safe to ignore
  }
}

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    db = new Database(getDbPath());
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        items TEXT NOT NULL,
        notes TEXT DEFAULT '',
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        quote_amount REAL,
        quote_currency TEXT DEFAULT 'BDT',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
      CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);

      CREATE TABLE IF NOT EXISTS fb_conversations (
        id TEXT PRIMARY KEY,
        customer_psid TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_avatar TEXT,
        last_message_at TEXT NOT NULL,
        last_message_snippet TEXT NOT NULL DEFAULT '',
        unread_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'open',
        is_likely_order INTEGER NOT NULL DEFAULT 0,
        linked_order_number TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_fb_conversations_last ON fb_conversations(last_message_at DESC);
      CREATE INDEX IF NOT EXISTS idx_fb_conversations_status ON fb_conversations(status);

      CREATE TABLE IF NOT EXISTS fb_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES fb_conversations(id) ON DELETE CASCADE,
        from_type TEXT NOT NULL,
        text TEXT NOT NULL DEFAULT '',
        attachments_json TEXT,
        signals_json TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_fb_messages_conv ON fb_messages(conversation_id, created_at ASC);
    `);

    // Migrate existing orders table — add source + fb_conversation_id if missing
    addColumnIfMissing(db, "orders", "source", "TEXT NOT NULL DEFAULT 'web'");
    addColumnIfMissing(db, "orders", "fb_conversation_id", "TEXT");
  }
  return db;
}
