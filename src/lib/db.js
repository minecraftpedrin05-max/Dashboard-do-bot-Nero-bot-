import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "bot.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    persona TEXT DEFAULT 'masculino',
    welcome_channel_id TEXT,
    welcome_message TEXT,
    mod_log_channel_id TEXT,
    xp_enabled INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS xp (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS modals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    output_template TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS modal_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modal_id INTEGER NOT NULL,
    field_key TEXT NOT NULL,
    label TEXT NOT NULL,
    style TEXT NOT NULL DEFAULT 'short',
    required INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS modal_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modal_id INTEGER NOT NULL,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    data TEXT NOT NULL,
    submitted_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS custom_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    title TEXT DEFAULT '',
    body_text TEXT DEFAULT '',
    image_url TEXT,
    color TEXT DEFAULT '#5865F2'
  );

  CREATE TABLE IF NOT EXISTS custom_command_buttons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    style TEXT NOT NULL DEFAULT 'Primary',
    emoji TEXT,
    action_type TEXT NOT NULL DEFAULT 'modal',
    modal_id INTEGER,
    url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS user_guild_config (
    user_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    set_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    type TEXT NOT NULL,
    actor_tag TEXT,
    target_tag TEXT,
    detail TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_activity_log_guild ON activity_log (guild_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS economy (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    last_daily INTEGER,
    PRIMARY KEY (guild_id, user_id)
  );
`);

// Migração leve: adiciona colunas novas em bancos já existentes (não quebra se já existirem)
for (const stmt of [
  "ALTER TABLE custom_command_buttons ADD COLUMN options_json TEXT",
  "ALTER TABLE custom_command_buttons ADD COLUMN output_template TEXT",
  "ALTER TABLE custom_command_buttons ADD COLUMN multi INTEGER DEFAULT 0",
  "ALTER TABLE custom_commands ADD COLUMN is_public INTEGER DEFAULT 1",
  "ALTER TABLE custom_command_buttons ADD COLUMN ai_mode INTEGER DEFAULT 0",
  "ALTER TABLE custom_command_buttons ADD COLUMN ai_open_ticket INTEGER DEFAULT 0",
  "ALTER TABLE custom_command_buttons ADD COLUMN ticket_container_json TEXT",
  "ALTER TABLE custom_command_buttons ADD COLUMN role_id TEXT",
  "ALTER TABLE guild_settings ADD COLUMN autorole_id TEXT",
  "ALTER TABLE guild_settings ADD COLUMN suggestions_channel_id TEXT",
  "ALTER TABLE guild_settings ADD COLUMN counter_channel_id TEXT",
]) {
  try {
    db.exec(stmt);
  } catch {
    // coluna já existe, ok
  }
}

// ---------- settings ----------

export function getSettings(guildId) {
  let row = db.prepare("SELECT * FROM guild_settings WHERE guild_id = ?").get(guildId);
  if (!row) {
    db.prepare("INSERT INTO guild_settings (guild_id) VALUES (?)").run(guildId);
    row = db.prepare("SELECT * FROM guild_settings WHERE guild_id = ?").get(guildId);
  }
  return row;
}

export function updateSettings(guildId, data) {
  const current = getSettings(guildId);
  const merged = { ...current, ...data };
  db.prepare(
    `UPDATE guild_settings
     SET persona = ?, welcome_channel_id = ?, welcome_message = ?, mod_log_channel_id = ?, xp_enabled = ?, autorole_id = ?, suggestions_channel_id = ?, counter_channel_id = ?
     WHERE guild_id = ?`
  ).run(
    merged.persona,
    merged.welcome_channel_id,
    merged.welcome_message,
    merged.mod_log_channel_id,
    merged.xp_enabled ? 1 : 0,
    merged.autorole_id,
    merged.suggestions_channel_id,
    merged.counter_channel_id,
    guildId
  );
  return getSettings(guildId);
}

// ---------- warnings ----------

export function addWarning(guildId, userId, moderatorId, reason) {
  db.prepare(
    `INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(guildId, userId, moderatorId, reason, Date.now());
}

export function getWarnings(guildId, userId) {
  return db
    .prepare(`SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC`)
    .all(guildId, userId);
}

export function getRecentWarnings(guildId, limit = 15) {
  return db
    .prepare(`SELECT * FROM warnings WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(guildId, limit);
}

// ---------- xp ----------

function levelFromXp(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

export function addXp(guildId, userId, amount) {
  const row = db.prepare("SELECT * FROM xp WHERE guild_id = ? AND user_id = ?").get(guildId, userId);
  if (!row) {
    const level = levelFromXp(amount);
    db.prepare("INSERT INTO xp (guild_id, user_id, xp, level) VALUES (?, ?, ?, ?)").run(
      guildId,
      userId,
      amount,
      level
    );
    return { xp: amount, level, leveledUp: level > 0 };
  }
  const newXp = row.xp + amount;
  const newLevel = levelFromXp(newXp);
  db.prepare("UPDATE xp SET xp = ?, level = ? WHERE guild_id = ? AND user_id = ?").run(
    newXp,
    newLevel,
    guildId,
    userId
  );
  return { xp: newXp, level: newLevel, leveledUp: newLevel > row.level };
}

export function getRank(guildId, userId) {
  return (
    db.prepare("SELECT * FROM xp WHERE guild_id = ? AND user_id = ?").get(guildId, userId) || {
      guild_id: guildId,
      user_id: userId,
      xp: 0,
      level: 0,
    }
  );
}

export function getLeaderboard(guildId, limit = 10) {
  return db.prepare("SELECT * FROM xp WHERE guild_id = ? ORDER BY xp DESC LIMIT ?").all(guildId, limit);
}

// ---------- comandos personalizados ----------

export function listCommands(guildId) {
  return db.prepare("SELECT * FROM custom_commands WHERE guild_id = ? ORDER BY name").all(guildId);
}

export function getCommand(id) {
  return db.prepare("SELECT * FROM custom_commands WHERE id = ?").get(id);
}

export function getCommandByName(guildId, name) {
  return db.prepare("SELECT * FROM custom_commands WHERE guild_id = ? AND name = ?").get(guildId, name);
}

export function createCommand(guildId, data) {
  const info = db
    .prepare(
      `INSERT INTO custom_commands (guild_id, name, description, title, body_text, image_url, color, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      guildId,
      data.name,
      data.description || "",
      data.title || "",
      data.body_text || "",
      data.image_url || null,
      data.color || "#5865F2",
      data.is_public === false ? 0 : 1
    );
  return info.lastInsertRowid;
}

export function updateCommand(id, data) {
  db.prepare(
    `UPDATE custom_commands SET name=?, description=?, title=?, body_text=?, image_url=?, color=?, is_public=? WHERE id=?`
  ).run(
    data.name,
    data.description || "",
    data.title || "",
    data.body_text || "",
    data.image_url || null,
    data.color || "#5865F2",
    data.is_public === false ? 0 : 1,
    id
  );
}

export function deleteCommand(id) {
  db.prepare("DELETE FROM custom_command_buttons WHERE command_id = ?").run(id);
  db.prepare("DELETE FROM custom_commands WHERE id = ?").run(id);
}

export function listCommandButtons(commandId) {
  return db
    .prepare("SELECT * FROM custom_command_buttons WHERE command_id = ? ORDER BY order_index")
    .all(commandId);
}

export function getCommandButton(id) {
  return db.prepare("SELECT * FROM custom_command_buttons WHERE id = ?").get(id);
}

export function setCommandButtons(commandId, buttons) {
  db.prepare("DELETE FROM custom_command_buttons WHERE command_id = ?").run(commandId);
  const insert = db.prepare(
    `INSERT INTO custom_command_buttons
     (command_id, label, style, emoji, action_type, modal_id, url, order_index, options_json, output_template, multi, ai_mode, ai_open_ticket, ticket_container_json, role_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  buttons.forEach((b, i) => {
    const needsTemplate = b.action_type === "select" || b.action_type === "ticket" || b.action_type === "ai";
    insert.run(
      commandId,
      b.label,
      b.style || "Primary",
      b.emoji || null,
      b.action_type || "modal",
      b.modal_id || null,
      b.url || null,
      i,
      b.action_type === "select" ? JSON.stringify(b.options || []) : null,
      needsTemplate ? b.output_template || "" : null,
      b.action_type === "select" && b.multi ? 1 : 0,
      b.action_type === "select" && b.ai_mode ? 1 : 0,
      b.action_type === "ai" && b.ai_open_ticket ? 1 : 0,
      b.action_type === "ticket" && b.ticket_container?.enabled
        ? JSON.stringify(b.ticket_container)
        : null,
      b.action_type === "role" ? b.role_id || null : null
    );
  });
}

// ---------- modais (formulários) ----------

export function listModals(guildId) {
  return db.prepare("SELECT * FROM modals WHERE guild_id = ? ORDER BY name").all(guildId);
}

export function getModal(id) {
  return db.prepare("SELECT * FROM modals WHERE id = ?").get(id);
}

export function createModal(guildId, data) {
  const info = db
    .prepare(`INSERT INTO modals (guild_id, name, title, output_template) VALUES (?, ?, ?, ?)`)
    .run(guildId, data.name, data.title, data.output_template || "");
  return info.lastInsertRowid;
}

export function updateModal(id, data) {
  db.prepare(`UPDATE modals SET name=?, title=?, output_template=? WHERE id=?`).run(
    data.name,
    data.title,
    data.output_template || "",
    id
  );
}

export function deleteModal(id) {
  db.prepare("DELETE FROM modal_fields WHERE modal_id = ?").run(id);
  db.prepare("DELETE FROM modals WHERE id = ?").run(id);
}

export function listModalFields(modalId) {
  return db.prepare("SELECT * FROM modal_fields WHERE modal_id = ? ORDER BY order_index").all(modalId);
}

export function setModalFields(modalId, fields) {
  db.prepare("DELETE FROM modal_fields WHERE modal_id = ?").run(modalId);
  const insert = db.prepare(
    `INSERT INTO modal_fields (modal_id, field_key, label, style, required, order_index)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  fields.forEach((f, i) => {
    insert.run(modalId, f.field_key, f.label, f.style || "short", f.required ? 1 : 0, i);
  });
}

export function saveModalSubmission(modalId, guildId, userId, data) {
  db.prepare(
    `INSERT INTO modal_submissions (modal_id, guild_id, user_id, data, submitted_at) VALUES (?, ?, ?, ?, ?)`
  ).run(modalId, guildId, userId, JSON.stringify(data), Date.now());
}

export function setUserGuild(userId, guildId) {
  db.prepare("INSERT OR REPLACE INTO user_guild_config (user_id, guild_id, set_at) VALUES (?, ?, ?)")
    .run(userId, guildId, Date.now());
}

export function getUserGuild(userId) {
  const row = db.prepare("SELECT guild_id FROM user_guild_config WHERE user_id = ?").get(userId);
  return row?.guild_id || null;
}

// --- Log de atividade genérico -------------------------------------------
// type sugeridos: "warn", "ban", "kick", "mute", "settings", "autorole",
// "welcome", "suggestion", "poll" — mas aceita qualquer string, é só pra
// filtro/exibição no dashboard.
export function logActivity(guildId, type, { actorTag, targetTag, detail } = {}) {
  db.prepare(
    `INSERT INTO activity_log (guild_id, type, actor_tag, target_tag, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(guildId, type, actorTag || null, targetTag || null, detail || null, Date.now());
}

export function getActivityLog(guildId, { type, q, page = 1, pageSize = 25 } = {}) {
  const clauses = ["guild_id = ?"];
  const params = [guildId];

  if (type) {
    clauses.push("type = ?");
    params.push(type);
  }
  if (q) {
    clauses.push("(actor_tag LIKE ? OR target_tag LIKE ? OR detail LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const where = clauses.join(" AND ");
  const total = db.prepare(`SELECT COUNT(*) AS n FROM activity_log WHERE ${where}`).get(...params).n;

  const offset = Math.max(0, (page - 1) * pageSize);
  const rows = db
    .prepare(`SELECT * FROM activity_log WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);

  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

// Igual getActivityLog mas sem paginação, usado só pra exportar CSV
// (limitado a 5000 linhas pra não travar o servidor num guild gigante).
export function getActivityLogAll(guildId, { type, q } = {}) {
  const clauses = ["guild_id = ?"];
  const params = [guildId];
  if (type) {
    clauses.push("type = ?");
    params.push(type);
  }
  if (q) {
    clauses.push("(actor_tag LIKE ? OR target_tag LIKE ? OR detail LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const where = clauses.join(" AND ");
  return db
    .prepare(`SELECT * FROM activity_log WHERE ${where} ORDER BY created_at DESC LIMIT 5000`)
    .all(...params);
}

export default db;

// --- Economia --------------------------------------------------------------
// Sistema simples: saldo que cresce conversando (com cooldown, controlado no
// bot) + /diario (recompensa a cada 24h) + /transferir entre membros.
const DAILY_REWARD = 100;
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function ensureEconomyRow(guildId, userId) {
  db.prepare("INSERT OR IGNORE INTO economy (guild_id, user_id, balance) VALUES (?, ?, 0)").run(guildId, userId);
}

export function getBalance(guildId, userId) {
  ensureEconomyRow(guildId, userId);
  return db.prepare("SELECT balance FROM economy WHERE guild_id = ? AND user_id = ?").get(guildId, userId).balance;
}

export function addBalance(guildId, userId, amount) {
  ensureEconomyRow(guildId, userId);
  db.prepare("UPDATE economy SET balance = balance + ? WHERE guild_id = ? AND user_id = ?").run(
    amount,
    guildId,
    userId
  );
  return getBalance(guildId, userId);
}

// Retorna { success: true, amount, newBalance } ou { success: false, remainingMs }
export function claimDaily(guildId, userId) {
  ensureEconomyRow(guildId, userId);
  const row = db.prepare("SELECT balance, last_daily FROM economy WHERE guild_id = ? AND user_id = ?").get(
    guildId,
    userId
  );
  const now = Date.now();

  if (row.last_daily && now - row.last_daily < DAILY_COOLDOWN_MS) {
    return { success: false, remainingMs: DAILY_COOLDOWN_MS - (now - row.last_daily) };
  }

  db.prepare("UPDATE economy SET balance = balance + ?, last_daily = ? WHERE guild_id = ? AND user_id = ?").run(
    DAILY_REWARD,
    now,
    guildId,
    userId
  );
  return { success: true, amount: DAILY_REWARD, newBalance: row.balance + DAILY_REWARD };
}

// Retorna { success: true, fromBalance, toBalance } ou { success: false, reason }
export function transferBalance(guildId, fromUserId, toUserId, amount) {
  if (amount <= 0) return { success: false, reason: "invalid_amount" };
  const fromBalance = getBalance(guildId, fromUserId);
  if (fromBalance < amount) return { success: false, reason: "insufficient_funds" };

  addBalance(guildId, fromUserId, -amount);
  const toBalance = addBalance(guildId, toUserId, amount);
  return { success: true, fromBalance: fromBalance - amount, toBalance };
}

export function getEconomyLeaderboard(guildId, limit = 10) {
  return db
    .prepare("SELECT user_id, balance FROM economy WHERE guild_id = ? ORDER BY balance DESC LIMIT ?")
    .all(guildId, limit);
}
