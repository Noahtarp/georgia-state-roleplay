/**
 * Georgia State Roleplay - Main Server
 * Express server handling frontend, API, and Discord OAuth
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const { setupDiscordBot } = require('./bot/bot');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true only with HTTPS in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window (increased for development)
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/api', apiRoutes);

// Frontend routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'faq.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    // Check if user is authenticated
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/applications', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'applications.html'));
});

app.get('/uptime', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'uptime.html'));
});

// Redirect old /apply route to /applications
app.get('/apply', (req, res) => {
    res.redirect('/applications');
});

// 404 handler - must be after all other routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Initialize database and start server
async function startServer() {
    try {
        await initDatabase();
        
        // Initialize Discord bot
        setupDiscordBot();
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (err) {
        console.error('❌ Failed to initialize database:', err);
        process.exit(1);
    }
}

startServer();
