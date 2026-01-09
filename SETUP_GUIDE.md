# Georgia State Roleplay - Setup Guide

This guide will walk you through setting up the Georgia State Roleplay website, backend, and Discord bot.

## 📋 Prerequisites

- Node.js (v16 or higher)
- A Discord Bot Token
- A Discord Application (for OAuth2)
- A Discord Server (Guild)
- Hostinger hosting account (or similar hosting)

## 🔧 Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages:
- express
- discord.js
- better-sqlite3
- axios
- express-session
- dotenv
- express-rate-limit

### 2. Discord Bot Setup

#### Step 2.1: Create a Discord Application

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "Georgia State Roleplay" (or your preferred name)
4. Go to the "Bot" section
5. Click "Add Bot"
6. Under "Privileged Gateway Intents", enable:
   - SERVER MEMBERS INTENT (required for role checking)
   - MESSAGE CONTENT INTENT (if needed)
7. Copy the **Bot Token** (you'll need this for `DISCORD_BOT_TOKEN`)

#### Step 2.2: Get OAuth2 Credentials

1. In your Discord Application, go to "OAuth2" → "General"
2. Copy the **Client ID** (for `DISCORD_CLIENT_ID`)
3. Click "Reset Secret" and copy the **Client Secret** (for `DISCORD_CLIENT_SECRET`)
4. Under "Redirects", add your redirect URI:
   - For local: `http://localhost:3000/auth/discord/callback`
   - For production: `https://yourdomain.com/auth/discord/callback`

#### Step 2.3: Invite Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Select scopes:
   - `bot`
   - `applications.commands`
3. Select bot permissions:
   - Administrator (or specific permissions: Manage Roles, Send Messages, Embed Links, Read Message History, Add Reactions, Use External Emojis)
4. Copy the generated URL and open it in your browser
5. Select your server and authorize

#### Step 2.4: Get Channel and Role IDs

1. Enable Developer Mode in Discord:
   - User Settings → Advanced → Developer Mode
2. Right-click on channels and select "Copy ID":
   - Submissions channel (for applications)
   - Results channel (for application results)
   - Logs channel (for staff logs)
3. Right-click on roles and select "Copy ID":
   - Staff role ID (for dashboard access)
   - GSP role ID (for auto-assignment)
   - FBI role ID (for auto-assignment)

### 3. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in all values:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
DISCORD_GUILD_ID=your_guild_id_here

# Discord Channel IDs
DISCORD_SUBMISSIONS_CHANNEL_ID=your_submissions_channel_id
DISCORD_RESULTS_CHANNEL_ID=your_results_channel_id
DISCORD_LOGS_CHANNEL_ID=your_logs_channel_id

# Discord Role IDs (comma-separated for multiple roles)
ALLOWED_STAFF_ROLE_IDS=role_id_1,role_id_2

# Discord Role IDs for Auto-Assignment
ROLE_STAFF=your_staff_role_id
ROLE_GSP=your_gsp_role_id
ROLE_FBI=your_fbi_role_id

# Session Secret (generate a random string)
SESSION_SECRET=your_random_session_secret_here

# Database Path
DATABASE_PATH=./database/gsr.db
```

**Important Notes:**
- `DISCORD_GUILD_ID`: Right-click your Discord server → Copy ID
- `ALLOWED_STAFF_ROLE_IDS`: Comma-separated list of role IDs that can access the dashboard
- `SESSION_SECRET`: Generate a random string (you can use: `openssl rand -base64 32`)

### 4. Database Setup

The database will be created automatically on first run. The SQLite database file will be created at `./database/gsr.db`.

**Database Tables:**
- `applications` - Stores all application submissions
- `blog_posts` - Stores blog posts/patch notes
- `logs` - Stores system logs
- `failed_logins` - Tracks failed login attempts for rate limiting

### 5. Running Locally

#### Start the Server

```bash
npm start
```

Or for development:

```bash
node server.js
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

#### Verify Setup

1. Open `http://localhost:3000` in your browser
2. Check that the homepage loads correctly
3. Try accessing `/login` and test Discord OAuth (make sure you have the required role)
4. Test the application form at `/apply`

### 6. Hosting on Hostinger

#### Step 6.1: Upload Files

1. Connect to your Hostinger hosting via FTP/SFTP or File Manager
2. Upload all project files to your domain's root or a subdirectory
3. Make sure to upload:
   - All files in the project root
   - The `public/` folder
   - The `routes/` folder
   - The `database/` folder (create it if it doesn't exist)
   - The `bot/` folder
   - `package.json`
   - `server.js`

#### Step 6.2: Configure Environment

1. Create a `.env` file on the server with production values
2. Update `DISCORD_REDIRECT_URI` to your production domain:
   ```
   DISCORD_REDIRECT_URI=https://yourdomain.com/auth/discord/callback
   ```
3. Set `NODE_ENV=production`

#### Step 6.3: Install Dependencies on Server

SSH into your Hostinger server and run:

```bash
cd /path/to/your/project
npm install --production
```

#### Step 6.4: Set Up Process Manager (PM2 recommended)

Install PM2 globally:

```bash
npm install -g pm2
```

Start the application:

```bash
pm2 start server.js --name gsr-server
pm2 save
pm2 startup
```

This will:
- Start the server
- Save the process list
- Configure it to start on server reboot

#### Step 6.5: Configure Domain/Subdomain

1. Point your domain or subdomain to your Hostinger hosting
2. If using a subdomain (e.g., `gsr.yourdomain.com`), configure it in your hosting panel
3. Update the Discord OAuth redirect URI to match your domain

#### Step 6.6: Set Up SSL Certificate

Hostinger usually provides free SSL certificates. Enable SSL for your domain to ensure secure OAuth connections.

### 7. Testing the System

#### Test Application Flow

1. Go to `/apply` on your website
2. Fill out an application form
3. Submit the application
4. Check Discord:
   - Application should appear in the submissions channel
   - Should have Accept/Deny buttons
5. Click Accept or Deny:
   - Modal should appear for reason
   - Submit the review
   - Check results channel for the decision
   - Applicant should receive a DM
   - Role should be assigned (if accepted)

#### Test Staff Dashboard

1. Log in with a Discord account that has the required role
2. Access `/dashboard`
3. Verify you can see:
   - Application statistics
   - List of applications
   - Application details

#### Test Blog System

1. Log in to the dashboard
2. Create a blog post via API (you'll need to add this functionality or use a tool like Postman)
3. Check `/blog` page to see the post

### 8. Troubleshooting

#### Bot Not Responding

- Check that the bot token is correct
- Verify the bot is online in your Discord server
- Check bot permissions in the server
- Review server logs for errors

#### OAuth Not Working

- Verify redirect URI matches exactly in Discord Developer Portal
- Check that `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` are correct
- Ensure SSL is enabled (required for OAuth in production)
- Check browser console for errors

#### Database Errors

- Ensure the `database/` folder exists and is writable
- Check file permissions on the database file
- Verify `DATABASE_PATH` in `.env` is correct

#### Role Assignment Not Working

- Verify role IDs are correct in `.env`
- Check bot has "Manage Roles" permission
- Ensure bot's role is higher than the roles it's assigning
- Check Discord server logs

### 9. Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong SESSION_SECRET** - Generate a random, long string
3. **Enable rate limiting** - Already configured for auth endpoints
4. **Keep dependencies updated** - Regularly run `npm update`
5. **Monitor logs** - Check application and Discord logs regularly
6. **Use HTTPS in production** - Required for OAuth2

### 10. Maintenance

#### Regular Tasks

- Monitor application submissions
- Review and respond to applications
- Update blog posts/patch notes
- Check system logs for errors
- Update dependencies periodically

#### Backup

- Regularly backup the database file (`database/gsr.db`)
- Backup your `.env` file securely
- Consider automated backups

## 📝 Additional Notes

### Application Types

- **Staff**: Requires application and approval
- **GSP (Georgia State Patrol)**: Whitelisted position
- **FBI**: Whitelisted position
- **Regular LEO**: NOT whitelisted (no application needed)

### File Structure

```
georgia-state-roleplay/
├── bot/
│   └── bot.js              # Discord bot logic
├── database/
│   └── init.js             # Database initialization
├── public/
│   ├── css/
│   │   └── style.css       # Main stylesheet
│   ├── js/
│   │   ├── main.js        # General JavaScript
│   │   ├── blog.js         # Blog functionality
│   │   ├── dashboard.js    # Dashboard functionality
│   │   └── apply.js        # Application form
│   ├── index.html          # Homepage
│   ├── about.html          # About page
│   ├── blog.html           # Blog page
│   ├── faq.html            # FAQ page
│   ├── contact.html        # Contact page
│   ├── login.html          # Login page
│   ├── dashboard.html      # Staff dashboard
│   └── apply.html          # Application form
├── routes/
│   ├── auth.js             # Authentication routes
│   └── api.js              # API routes
├── .env                    # Environment variables (create from .env.example)
├── .env.example            # Example environment file
├── .gitignore              # Git ignore file
├── package.json            # Dependencies
├── server.js               # Main server file
└── SETUP_GUIDE.md          # This file
```

### Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs
3. Check Discord bot logs
4. Verify all environment variables are set correctly
5. Ensure all dependencies are installed

## ✅ Setup Complete!

Once you've completed all steps, your Georgia State Roleplay website, backend, and Discord bot should be fully operational. Good luck with your roleplay community!


