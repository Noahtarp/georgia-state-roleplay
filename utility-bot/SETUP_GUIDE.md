# GSRP | Utility Bot - Setup Guide

A Discord bot for Roblox verification and server moderation.

## Features

### Verification System
- Roblox account verification via profile description
- Automatic role assignment upon verification
- Nickname sync to Roblox username

### Moderation Commands (Staff Only)
| Command | Description |
|---------|-------------|
| `/ban` | Ban a user from the server |
| `/kick` | Kick a user from the server |
| `/timeout` | Timeout a user (e.g., 10m, 1h, 1d) |
| `/untimeout` | Remove timeout from a user |
| `/mute` | Server mute a user in voice |
| `/unmute` | Unmute a user in voice |
| `/deafen` | Server deafen a user in voice |
| `/undeafen` | Undeafen a user in voice |
| `/warn` | Warn a user (sends DM) |
| `/clear` | Clear messages (up to 100) |
| `/role` | Add/remove a role from a user |
| `/slowmode` | Set channel slowmode |
| `/lock` | Lock the current channel |
| `/unlock` | Unlock the current channel |
| `/announce` | Send a styled announcement |
| `/nick` | Change a user's nickname |

### Utility Commands (Staff Only)
| Command | Description |
|---------|-------------|
| `/userinfo` | Get information about a user |
| `/serverinfo` | Get server information |
| `/avatar` | Get a user's avatar |
| `/membercount` | Get the member count |

### Owner Only
| Command | Description |
|---------|-------------|
| `/sendpanel` | Send the verification panel |

## Setup Instructions

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Name it `GSRP | Utility` and create
4. Go to **Bot** section
5. Click **Add Bot**
6. Copy the **Token**

### 2. Configure Bot Settings

In the **Bot** section, enable:
- **Server Members Intent**
- **Message Content Intent**

### 3. Invite the Bot

1. Go to **OAuth2** → **URL Generator**
2. Select scopes:
   - `bot`
   - `applications.commands`
3. Select bot permissions:
   - `Administrator` (recommended for full functionality)
   
   Or individually:
   - `Manage Roles`
   - `Manage Nicknames`
   - `Kick Members`
   - `Ban Members`
   - `Moderate Members`
   - `Manage Channels`
   - `Manage Messages`
   - `Send Messages`
   - `Embed Links`
   - `Mute Members`
   - `Deafen Members`
   - `Use Slash Commands`

4. Copy and open the URL to invite the bot

### 4. Configure Environment

1. Copy `env.template` to `.env`:
   ```bash
   cp env.template .env
   ```

2. Fill in the values:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   OWNER_ID=your_discord_user_id_here
   STAFF_ROLE_ID=your_staff_role_id_here
   VERIFICATION_CHANNEL_ID=your_channel_id_here
   VERIFIED_ROLE_ID=your_verified_role_id_here
   LOG_CHANNEL_ID=your_log_channel_id_here
   ```

### 5. Get Your Discord User ID

1. Enable **Developer Mode** in Discord
2. Right-click your own username
3. Click **Copy User ID**
4. This is your `OWNER_ID`

### 6. Get Channel/Role IDs

Right-click to copy IDs:
- Verification channel → `VERIFICATION_CHANNEL_ID`
- Verified role → `VERIFIED_ROLE_ID`
- Staff role → `STAFF_ROLE_ID`
- Log channel → `LOG_CHANNEL_ID`

### 7. Role Hierarchy

Make sure the bot's role is **ABOVE**:
- The verified role
- The staff role
- Any roles you want to manage

### 8. Install & Run

```bash
cd utility-bot
npm install
npm start
```

## Command Usage Examples

### Moderation

```
/ban user:@BadUser reason:Breaking rules delete_messages:true
/kick user:@User reason:Spamming
/timeout user:@User duration:1h reason:Being disruptive
/mute user:@User reason:Loud noises
/clear amount:50 user:@User
/warn user:@User reason:First warning for spam
```

### Utilities

```
/userinfo user:@User
/serverinfo
/role user:@User role:@Member action:add
/slowmode seconds:10
/announce title:Important message:Server maintenance tomorrow!
```

## Permissions

| User Type | Can Use |
|-----------|---------|
| Owner | All commands |
| Administrators | All commands except /sendpanel |
| Staff Role | All commands except /sendpanel |
| Everyone | Verification only |

## Logging

All moderation actions and verifications are logged to the configured log channel with:
- Moderator who performed the action
- Target user
- Action taken
- Reason (if provided)
- Timestamp

## Troubleshooting

### Commands not showing
- Wait a few minutes for Discord to update
- Try kicking and re-inviting the bot

### Can't ban/kick users
- Check the bot's role is above the target user's highest role
- Verify the bot has the required permissions

### Verification not working
- Ensure the verified role exists
- Check the bot can manage the verified role

### Voice mute/deafen not working
- User must be in a voice channel
- Bot needs voice channel permissions

## File Structure

```
utility-bot/
├── bot.js           # Main bot code
├── package.json     # Dependencies
├── env.template     # Environment template
├── .env             # Your configuration
└── SETUP_GUIDE.md   # This file
```
