# Georgia State Roleplay - Ticket Bot Setup Guide

A Discord ticket bot for managing support tickets with three categories: General Support, Staff Report, and High Rank Support.

---

## 📋 Features

- **Three Ticket Types:**
  - 🎫 **General Support** - For general questions and issues
  - ⚠️ **Staff Report** - For reporting staff misconduct
  - 👑 **High Rank Support** - For sensitive matters requiring high-rank attention

- **Features:**
  - Beautiful embedded messages with custom banners
  - Automatic ticket channel creation
  - Role-based permissions
  - Ticket transcripts on close
  - Ticket logging system
  - Close confirmation to prevent accidents

---

## 🚀 Setup Instructions

### Step 1: Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name (e.g., "GSRP Tickets")
3. Go to the **"Bot"** section
4. Click **"Add Bot"**
5. Under **"Privileged Gateway Intents"**, enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
6. Click **"Reset Token"** and copy the token (save it securely!)

### Step 2: Invite the Bot to Your Server

1. Go to **"OAuth2"** → **"URL Generator"**
2. Under **Scopes**, select:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Under **Bot Permissions**, select:
   - ✅ Manage Channels
   - ✅ Manage Roles
   - ✅ View Channels
   - ✅ Send Messages
   - ✅ Manage Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Add Reactions
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

### Step 3: Configure Your Discord Server

Create the following in your Discord server:

1. **Ticket Category** - A category where ticket channels will be created
   - Right-click on the category → Copy ID

2. **Ticket Panel Channel** - Where users click to create tickets
   - Right-click on the channel → Copy ID

3. **Ticket Logs Channel** - Where ticket logs are sent
   - Right-click on the channel → Copy ID

4. **Support Role** - Role for staff who can manage tickets
   - Right-click on the role → Copy ID

5. **High Rank Role** - Role for high-ranking staff (optional)
   - Right-click on the role → Copy ID

> **Note:** Enable Developer Mode in Discord (Settings → Advanced → Developer Mode) to copy IDs.

### Step 4: Configure Environment Variables

1. Copy `env.template` to `.env`:
   ```bash
   cp env.template .env
   ```

2. Edit `.env` with your values:
   ```env
   # Discord Bot Token (from Discord Developer Portal)
   DISCORD_BOT_TOKEN=your_bot_token_here

   # Server/Guild ID
   GUILD_ID=your_guild_id_here

   # Channel where the ticket panel will be displayed
   TICKET_CHANNEL_ID=your_ticket_channel_id_here

   # Category ID where ticket channels will be created
   TICKET_CATEGORY_ID=your_category_id_here

   # Channel for ticket logs (transcripts, open/close logs)
   TICKET_LOGS_CHANNEL_ID=your_logs_channel_id_here

   # Role ID for support staff (can view and manage all tickets)
   SUPPORT_ROLE_ID=your_support_role_id_here

   # Role ID for high rank staff (for high rank support tickets)
   HIGH_RANK_ROLE_ID=your_high_rank_role_id_here
   ```

### Step 5: Install Dependencies

```bash
cd ticket-bot
npm install
```

### Step 6: Start the Bot

```bash
npm start
```

You should see:
```
🎫 Ticket Bot logged in as YourBot#1234
✅ Ticket Bot is ready!
```

---

## 📝 Usage

### Deploy Ticket Panel

In any channel (the message will be deleted), type:
```
!deploytickets
```

This will create the ticket panel with the "Create Ticket" button.

> **Note:** You need Administrator permissions to use this command.

### Creating a Ticket

1. Click the **"Create Ticket"** button on the panel
2. Select a ticket type from the dropdown:
   - 🎫 General Support
   - ⚠️ Staff Report
   - 👑 High Rank Support
3. A private ticket channel will be created
4. Describe your issue in the ticket channel

### Closing a Ticket

1. Click the **"Close Ticket"** button in the ticket channel
2. Confirm by clicking **"Confirm Close"**
3. The ticket transcript will be saved to the logs channel
4. The channel will be deleted after 5 seconds

---

## 🔧 Customization

### Changing Ticket Types

Edit the `TICKET_TYPES` object in `bot.js`:

```javascript
const TICKET_TYPES = {
    general: {
        name: 'General Support',
        emoji: '🎫',
        description: 'Get help with general questions or issues',
        color: EMBED_COLOR
    },
    // Add more types here...
};
```

### Changing Banners

Edit the `TOP_BANNER` and `BOTTOM_BANNER` constants in `bot.js`:

```javascript
const TOP_BANNER = 'your_top_banner_url';
const BOTTOM_BANNER = 'your_bottom_banner_url';
```

### Changing Embed Color

Edit the `EMBED_COLOR` constant in `bot.js`:

```javascript
const EMBED_COLOR = 0x242429; // Hex color without #
```

---

## 🐛 Troubleshooting

### Bot is not responding
- Check that the bot token is correct
- Ensure all intents are enabled in the Developer Portal
- Verify the bot has proper permissions in the server

### Tickets not creating
- Check that `TICKET_CATEGORY_ID` is correct
- Ensure the bot has "Manage Channels" permission
- Verify the bot role is above other roles that need access

### Cannot see ticket channels
- Check that `SUPPORT_ROLE_ID` is correct
- Ensure the support role exists and is spelled correctly

### Transcripts not sending
- Check that `TICKET_LOGS_CHANNEL_ID` is correct
- Ensure the bot can send messages in the logs channel

---

## 📁 File Structure

```
ticket-bot/
├── bot.js           # Main bot code
├── package.json     # Dependencies
├── env.template     # Environment template (copy to .env)
├── .env             # Your configuration (create this)
└── SETUP_GUIDE.md   # This file
```

---

## 🔒 Security Notes

- **Never share your bot token** - If compromised, regenerate it immediately
- **Keep `.env` private** - Never commit it to version control
- **Use role permissions** - Only give necessary permissions to roles

---

## 📞 Support

For issues with the ticket bot, contact the Georgia State Roleplay development team.

---

*Georgia State Roleplay - Roleplay you can rely on.*



