/**
 * Database Initialization
 * Creates SQLite database and tables
 * Uses sqlite3 (async) instead of better-sqlite3 for better compatibility
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'gsr.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

/**
 * Initialize database connection and tables
 */
function initDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Database connection error:', err);
                return reject(err);
            }
            console.log('✅ Connected to SQLite database');
            
            // Enable foreign keys
            db.run('PRAGMA foreign_keys = ON');
            
            // Create tables
            createTables()
                .then(() => {
                    console.log('✅ Database initialized successfully');
                    resolve();
                })
                .catch(reject);
        });
    });
}

/**
 * Create all database tables
 */
function createTables() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Applications table
            db.run(`
                CREATE TABLE IF NOT EXISTS applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    discord_user_id TEXT NOT NULL,
                    discord_username TEXT NOT NULL,
                    application_type TEXT NOT NULL,
                    answers TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    reviewer_discord_id TEXT,
                    review_reason TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    reviewed_at DATETIME
                )
            `, (err) => {
                if (err) return reject(err);
            });

            // Blog posts table
            db.run(`
                CREATE TABLE IF NOT EXISTS blog_posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    author_discord_id TEXT NOT NULL,
                    author_username TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME
                )
            `, (err) => {
                if (err) return reject(err);
            });

            // Logs table
            db.run(`
                CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    action TEXT NOT NULL,
                    user_discord_id TEXT,
                    user_username TEXT,
                    details TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) return reject(err);
            });

            // Failed login attempts table
            db.run(`
                CREATE TABLE IF NOT EXISTS failed_logins (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ip_address TEXT NOT NULL,
                    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

/**
 * Get database instance
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

/**
 * Promisified database methods for easier async/await usage
 */
const dbHelpers = {
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            getDatabase().run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    },
    
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            getDatabase().get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            getDatabase().all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },
    
    exec: (sql) => {
        return new Promise((resolve, reject) => {
            getDatabase().exec(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
};

module.exports = {
    initDatabase,
    getDatabase,
    dbHelpers
};
