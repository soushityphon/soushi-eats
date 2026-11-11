CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL CHECK(json_valid(data)), revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS state_history (id INTEGER PRIMARY KEY AUTOINCREMENT, revision INTEGER NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)), updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS history_revision ON state_history(revision DESC);
