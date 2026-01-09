/**
 * Script to add a patch note to the database
 * Run with: node scripts/add-patch-note.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'database');
const dbPath = path.join(dbDir, 'georgia_state_rp.db');

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Patch note details
const patchNote = {
    title: 'Website Made and Updated',
    content: `We're excited to announce the official launch of the Georgia State Roleplay website!

**What's New:**
• Brand new modern dark theme design with sleek animations
• Applications system - Apply for Staff, Georgia State Patrol, or FBI positions directly through the website
• Patch Notes section to keep you updated on all changes
• FAQ page answering common questions
• Responsive design that works on all devices
• Smooth scroll animations and interactive elements

**Application System:**
You can now submit applications for whitelisted positions through our new streamlined application portal. Simply visit the Applications page, choose your desired position, and fill out the form. Your application will be sent directly to our staff team for review.

**Stay Connected:**
Join our Discord server to stay up to date with the latest news, events, and community updates.

Thank you for being part of Georgia State Roleplay. We look forward to seeing you in-game!

*— Georgia State Roleplay Team*`,
    author_discord_id: 'system',
    author_username: 'GSRP Ownership'
};

// Create table if it doesn't exist, then insert the patch note
db.serialize(() => {
    // Create blog_posts table if it doesn't exist
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
        if (err) {
            console.error('❌ Error creating table:', err.message);
            db.close();
            return;
        }
        
        // Insert the patch note
        db.run(
            `INSERT INTO blog_posts (title, content, author_discord_id, author_username) VALUES (?, ?, ?, ?)`,
            [patchNote.title, patchNote.content, patchNote.author_discord_id, patchNote.author_username],
            function(err) {
                if (err) {
                    console.error('❌ Error adding patch note:', err.message);
                } else {
                    console.log('✅ Patch note added successfully!');
                    console.log(`   ID: ${this.lastID}`);
                    console.log(`   Title: ${patchNote.title}`);
                }
                db.close();
            }
        );
    });
});
