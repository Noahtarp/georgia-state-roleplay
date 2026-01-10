# Georgia State Roleplay

**Roleplay you can rely on.**

A production-ready website, backend, and Discord bot system for a Roblox roleplay community.

## 🎯 Features

- **Professional Website**: Modern, minimal design with all essential pages
- **Discord Integration**: Full Discord bot with application management
- **Application System**: Whitelisted positions (Staff, GSP, FBI) with automated workflow
- **Staff Dashboard**: Secure, role-based access control via Discord OAuth
- **Blog System**: Patch notes and updates
- **FAQ Section**: Comprehensive questions and answers

## 📋 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Fill in all Discord credentials and IDs
   - See `SETUP_GUIDE.md` for detailed instructions

3. **Run the Server**
   ```bash
   npm start
   ```

4. **Access the Website**
   - Open `http://localhost:3000` in your browser

## 📚 Documentation

For complete setup instructions, see **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**

## 🏗️ Architecture

- **Frontend**: Vanilla HTML, CSS, JavaScript (no frameworks)
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Discord Bot**: discord.js v14
- **Authentication**: Discord OAuth2

## 📁 Project Structure

```
georgia-state-roleplay/
├── bot/                 # Discord bot logic
├── database/            # Database initialization
├── public/              # Frontend files
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── *.html          # HTML pages
├── routes/              # Express routes
│   ├── auth.js         # Authentication
│   └── api.js          # API endpoints
├── server.js           # Main server file
└── package.json        # Dependencies
```

## 🔐 Application Types

- **Staff**: Requires application and approval
- **GSP (Georgia State Patrol)**: Whitelisted position
- **FBI**: Whitelisted position
- **Regular LEO**: NOT whitelisted (no application needed)

## 🚀 Application Flow

1. User fills application on website
2. Application saved to database
3. Bot posts application to Discord submissions channel
4. Staff reviews via Accept/Deny buttons
5. Staff provides reason via modal
6. Status updated in database
7. Result posted to results channel
8. Applicant receives DM with decision
9. Role automatically assigned (if accepted)
10. All actions logged to staff channel

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Discord**: discord.js v14
- **Authentication**: Discord OAuth2
- **Session**: express-session
- **Security**: express-rate-limit

## 📝 Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DISCORD_BOT_TOKEN` - Your Discord bot token
- `DISCORD_CLIENT_ID` - OAuth2 client ID
- `DISCORD_CLIENT_SECRET` - OAuth2 client secret
- `DISCORD_GUILD_ID` - Your Discord server ID
- `ALLOWED_STAFF_ROLE_IDS` - Comma-separated role IDs for dashboard access

## 🔒 Security Features

- Rate limiting on authentication endpoints
- Role-based access control
- Secure session management
- Input sanitization
- Failed login attempt logging

## 📄 License

ISC

## 👥 Support

For setup help, see `SETUP_GUIDE.md`. For issues, check the troubleshooting section in the setup guide.

---

**Georgia State Roleplay** - Roleplay you can rely on.



