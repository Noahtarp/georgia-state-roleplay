/**
 * API Routes
 * Handles application submissions, blog posts, and dashboard data
 */

const express = require('express');
const { dbHelpers } = require('../database/init');
const { postApplicationToDiscord } = require('../bot/bot');
const router = express.Router();

/**
 * Middleware to check authentication
 */
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

/**
 * Submit application
 */
router.post('/applications', async (req, res) => {
    try {
        const { discordUserId, discordUsername, applicationType, answers } = req.body;
        
        // Validate input
        if (!discordUserId || !discordUsername || !applicationType || !answers) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Validate application type
        const validTypes = ['staff', 'gsp', 'fbi'];
        if (!validTypes.includes(applicationType.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid application type' });
        }
        
        // Save to database
        const result = await dbHelpers.run(
            `INSERT INTO applications (discord_user_id, discord_username, application_type, answers, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [discordUserId, discordUsername, applicationType.toLowerCase(), JSON.stringify(answers)]
        );
        
        const applicationId = result.lastID;
        
        // Get the full application
        const application = await dbHelpers.get('SELECT * FROM applications WHERE id = ?', [applicationId]);
        
        // Post to Discord
        await postApplicationToDiscord(application);
        
        // Log action
        await dbHelpers.run(
            'INSERT INTO logs (action, user_discord_id, user_username, details) VALUES (?, ?, ?, ?)',
            ['application_submitted', discordUserId, discordUsername, `Application type: ${applicationType}`]
        );
        
        res.json({ success: true, applicationId: applicationId });
    } catch (error) {
        console.error('Application submission error:', error);
        res.status(500).json({ error: 'Failed to submit application' });
    }
});

/**
 * Get all applications (staff only)
 */
router.get('/applications', requireAuth, async (req, res) => {
    try {
        const applications = await dbHelpers.all('SELECT * FROM applications ORDER BY created_at DESC');
        
        // Parse JSON answers
        const formatted = applications.map(app => ({
            ...app,
            answers: JSON.parse(app.answers)
        }));
        
        res.json({ success: true, applications: formatted });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

/**
 * Get single application (staff only)
 */
router.get('/applications/:id', requireAuth, async (req, res) => {
    try {
        const application = await dbHelpers.get('SELECT * FROM applications WHERE id = ?', [req.params.id]);
        
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        
        application.answers = JSON.parse(application.answers);
        res.json({ success: true, application });
    } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ error: 'Failed to fetch application' });
    }
});

/**
 * Get blog posts
 */
router.get('/blog', async (req, res) => {
    try {
        const posts = await dbHelpers.all('SELECT * FROM blog_posts ORDER BY created_at DESC');
        res.json({ success: true, posts });
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
});

/**
 * Get single blog post
 */
router.get('/blog/:id', async (req, res) => {
    try {
        const post = await dbHelpers.get('SELECT * FROM blog_posts WHERE id = ?', [req.params.id]);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json({ success: true, post });
    } catch (error) {
        console.error('Error fetching blog post:', error);
        res.status(500).json({ error: 'Failed to fetch blog post' });
    }
});

/**
 * Create blog post (staff only - Owner only in practice)
 */
router.post('/blog', requireAuth, async (req, res) => {
    try {
        const { title, content } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const result = await dbHelpers.run(
            `INSERT INTO blog_posts (title, content, author_discord_id, author_username)
             VALUES (?, ?, ?, ?)`,
            [title, content, req.session.user.id, req.session.user.username]
        );
        
        // Log action
        await dbHelpers.run(
            'INSERT INTO logs (action, user_discord_id, user_username, details) VALUES (?, ?, ?, ?)',
            ['blog_post_created', req.session.user.id, req.session.user.username, `Post: ${title}`]
        );
        
        res.json({ success: true, postId: result.lastID });
    } catch (error) {
        console.error('Error creating blog post:', error);
        res.status(500).json({ error: 'Failed to create blog post' });
    }
});

/**
 * Get logs (staff only)
 */
router.get('/logs', requireAuth, async (req, res) => {
    try {
        const logs = await dbHelpers.all('SELECT * FROM logs ORDER BY created_at DESC LIMIT 100');
        res.json({ success: true, logs });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

module.exports = router;
