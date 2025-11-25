const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, '../api/app_data.sqlite');
    this.db = null;
    this.init();
  }

  init() {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database.');
        this.createTables();
      }
    });
  }

  createTables() {
    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'customer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        square_order_id TEXT,
        square_payment_link_id TEXT,
        square_payment_id TEXT,
        customer_email TEXT NOT NULL,
        customer_name TEXT,
        items TEXT NOT NULL, -- JSON string of order items
        total_amount INTEGER NOT NULL, -- Amount in cents
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Payments table (for tracking payment attempts)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        square_payment_id TEXT UNIQUE,
        amount INTEGER NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT NOT NULL,
        payment_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id)
      )
    `);
  }

  // User methods
  async getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async createUser(userData) {
    return new Promise((resolve, reject) => {
      const { email, password_hash, name, role = 'customer' } = userData;
      
      this.db.run(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES (?, ?, ?, ?)`,
        [email, password_hash, name, role],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, email, name, role });
        }
      );
    });
  }

  // Order methods
  async createOrder(orderData) {
    return new Promise((resolve, reject) => {
      const {
        user_id,
        customer_email,
        customer_name,
        items,
        total_amount,
        status = 'pending'
      } = orderData;

      // Convert items array to JSON string
      const itemsJson = JSON.stringify(items);

      this.db.run(
        `INSERT INTO orders (user_id, customer_email, customer_name, items, total_amount, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, customer_email, customer_name, itemsJson, total_amount, status],
        function(err) {
          if (err) reject(err);
          else resolve({ 
            id: this.lastID, 
            user_id, 
            customer_email, 
            customer_name, 
            items, 
            total_amount, 
            status 
          });
        }
      );
    });
  }

  async getOrder(orderId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM orders WHERE id = ?',
        [orderId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row && row.items) {
              // Parse JSON items back to object
              row.items = JSON.parse(row.items);
            }
            resolve(row);
          }
        }
      );
    });
  }

  async getOrderBySquareOrderId(squareOrderId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM orders WHERE square_order_id = ?',
        [squareOrderId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row && row.items) {
              row.items = JSON.parse(row.items);
            }
            resolve(row);
          }
        }
      );
    });
  }

  async updateOrder(orderId, updates) {
    return new Promise((resolve, reject) => {
      const allowedFields = [
        'square_order_id', 
        'square_payment_link_id', 
        'square_payment_id', 
        'status', 
        'paid_at'
      ];
      
      const setClause = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key] !== undefined) {
          setClause.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });

      if (setClause.length === 0) {
        resolve(false);
        return;
      }

      setClause.push('updated_at = CURRENT_TIMESTAMP');
      values.push(orderId);

      this.db.run(
        `UPDATE orders SET ${setClause.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  async updateOrderBySquareOrderId(squareOrderId, updates) {
    return new Promise((resolve, reject) => {
      const allowedFields = ['status', 'square_payment_id', 'paid_at'];
      const setClause = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key] !== undefined) {
          setClause.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });

      if (setClause.length === 0) {
        resolve(false);
        return;
      }

      setClause.push('updated_at = CURRENT_TIMESTAMP');
      values.push(squareOrderId);

      this.db.run(
        `UPDATE orders SET ${setClause.join(', ')} WHERE square_order_id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  // Payment methods
  async createPayment(paymentData) {
    return new Promise((resolve, reject) => {
      const {
        order_id,
        square_payment_id,
        amount,
        currency = 'USD',
        status,
        payment_method
      } = paymentData;

      this.db.run(
        `INSERT INTO payments (order_id, square_payment_id, amount, currency, status, payment_method) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [order_id, square_payment_id, amount, currency, status, payment_method],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...paymentData });
        }
      );
    });
  }

  async updatePaymentStatus(squarePaymentId, status) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE square_payment_id = ?',
        [status, squarePaymentId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  // Get user's orders
  async getUserOrders(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            // Parse JSON items for each order
            rows.forEach(row => {
              if (row.items) {
                row.items = JSON.parse(row.items);
              }
            });
            resolve(rows);
          }
        }
      );
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed.');
        }
      });
    }
  }
}

module.exports = new DatabaseService();