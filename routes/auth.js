/**
 * Authentication Routes
 * Handles Discord OAuth2 login and session management
 */

const express = require('express');
const axios = require('axios');
const { dbHelpers } = require('../database/init');
const router = express.Router();

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const ALLOWED_ROLE_IDS = process.env.ALLOWED_STAFF_ROLE_IDS?.split(',') || [];

/**
 * Initiate Discord OAuth login
 */
router.get('/discord', (req, res) => {
    const state = Math.random().toString(36).substring(7);
    req.session.oauthState = state;
    
    const scopes = ['identify', 'guilds'];
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scopes.join('%20')}&state=${state}`;
    
    // Save session before redirecting to ensure state is persisted
    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.redirect('/login?error=session_error');
        }
        res.redirect(authUrl);
    });
});

/**
 * Discord OAuth callback
 */
router.get('/discord/callback', async (req, res) => {
    const { code, state } = req.query;
    
    // Verify state
    if (state !== req.session.oauthState) {
        return res.redirect('/login?error=invalid_state');
    }
    
    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(
            `${DISCORD_API_BASE}/oauth2/token`,
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );
        
        const { access_token } = tokenResponse.data;
        
        // Get user info
        const userResponse = await axios.get(`${DISCORD_API_BASE}/users/@me`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        
        const user = userResponse.data;
        
        // Get user's guilds to find the server
        const guildsResponse = await axios.get(`${DISCORD_API_BASE}/users/@me/guilds`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        
        // Get user's roles in the guild (requires bot token)
        // We'll use the bot to check roles instead
        const botToken = process.env.DISCORD_BOT_TOKEN;
        const guildId = process.env.DISCORD_GUILD_ID;
        
        let hasAccess = false;
        
        if (guildId && botToken) {
            try {
                const memberResponse = await axios.get(
                    `${DISCORD_API_BASE}/guilds/${guildId}/members/${user.id}`,
                    {
                        headers: {
                            Authorization: `Bot ${botToken}`,
                        },
                    }
                );
                
                const memberRoles = memberResponse.data.roles || [];
                hasAccess = ALLOWED_ROLE_IDS.some(roleId => memberRoles.includes(roleId));
            } catch (error) {
                console.error('Error checking user roles:', error.message);
                // If we can't check roles, deny access
                hasAccess = false;
            }
        }
        
        if (!hasAccess) {
            // Log failed login attempt
            await dbHelpers.run('INSERT INTO failed_logins (ip_address) VALUES (?)', [req.ip]);
            
            return res.redirect('/login?error=unauthorized');
        }
        
        // Store user in session
        req.session.user = {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar,
        };
        
        // Log successful login
        await dbHelpers.run(
            'INSERT INTO logs (action, user_discord_id, user_username, details) VALUES (?, ?, ?, ?)',
            ['login', user.id, user.username, 'Staff dashboard login']
        );
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('OAuth error:', error.message);
        res.redirect('/login?error=oauth_failed');
    }
});

/**
 * Logout
 */
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

/**
 * Check authentication status
 */
router.get('/status', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;

