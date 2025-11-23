const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, 'app_data.sqlite');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  items TEXT,
  status TEXT,
  meta TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT,
  payload TEXT,
  received_at TEXT
);

CREATE TABLE IF NOT EXISTS tokens (
  merchant_id TEXT PRIMARY KEY,
  access_token TEXT,
  scope TEXT,
  created_at TEXT
);
`);

module.exports = {
  createOrder: function(order) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO orders (id, items, status, meta, created_at, updated_at) VALUES (@id, @items, @status, @meta, @created_at, @updated_at)`);
    return stmt.run({
      id: order.orderId,
      items: JSON.stringify(order.items || []),
      status: order.status || 'PENDING',
      meta: JSON.stringify(order.meta || {}),
      created_at: order.createdAt || new Date().toISOString(),
      updated_at: order.updatedAt || new Date().toISOString()
    });
  },

  getOrder: function(orderId) {
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!row) return null;
    try {
      row.items = JSON.parse(row.items || '[]');
      row.meta = JSON.parse(row.meta || '{}');
    } catch (e) {
      // ignore
    }
    return row;
  },

  updateOrderStatus: function(orderId, status, meta) {
    const existing = module.exports.getOrder(orderId);
    if (!existing) return false;
    const mergedMeta = Object.assign(existing.meta || {}, meta || {});
    const stmt = db.prepare('UPDATE orders SET status = ?, meta = ?, updated_at = ? WHERE id = ?');
    stmt.run(status, JSON.stringify(mergedMeta), new Date().toISOString(), orderId);
    return true;
  },

  insertEvent: function(evt) {
    const stmt = db.prepare('INSERT OR REPLACE INTO events (id, type, payload, received_at) VALUES (?, ?, ?, ?)');
    return stmt.run(evt.id, evt.type, JSON.stringify(evt.payload || {}), evt.receivedAt || new Date().toISOString());
  },

  getEvent: function(eventId) {
    const row = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    if (!row) return null;
    try { row.payload = JSON.parse(row.payload || '{}'); } catch (e) {}
    return row;
  },

  storeToken: function(merchantId, accessToken, scope) {
    const stmt = db.prepare('INSERT OR REPLACE INTO tokens (merchant_id, access_token, scope, created_at) VALUES (?, ?, ?, ?)');
    return stmt.run(merchantId, accessToken, scope || '', new Date().toISOString());
  },

  getToken: function(merchantId) {
    const row = db.prepare('SELECT * FROM tokens WHERE merchant_id = ?').get(merchantId);
    return row || null;
  },

  listTokens: function() {
    return db.prepare('SELECT * FROM tokens').all();
  }
};
