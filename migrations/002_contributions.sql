CREATE TABLE IF NOT EXISTS recipe_notes (recipe_id TEXT NOT NULL, user_id TEXT NOT NULL, author_name TEXT NOT NULL, body TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(recipe_id,user_id));
CREATE TABLE IF NOT EXISTS recipe_photos (id TEXT PRIMARY KEY, recipe_id TEXT NOT NULL, user_id TEXT NOT NULL, author_name TEXT NOT NULL, created_at TEXT NOT NULL, image TEXT NOT NULL, deleted_at TEXT);
CREATE INDEX IF NOT EXISTS photos_by_recipe ON recipe_photos(recipe_id,deleted_at);
CREATE TABLE IF NOT EXISTS recipe_covers (recipe_id TEXT PRIMARY KEY, mode TEXT NOT NULL CHECK(mode IN ('ai','photo')), photo_id TEXT);
