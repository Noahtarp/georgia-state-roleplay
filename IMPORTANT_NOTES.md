# Important Notes & Configuration

## 🔴 Action Required Before Launch

### 1. Update Discord Invite Links

Replace all instances of `https://discord.gg/your-invite-link` with your actual Discord server invite link in:
- `public/index.html`
- `public/about.html`
- `public/contact.html`
- Any other files that reference Discord

### 2. Environment Variables

**CRITICAL**: Before running the application, you MUST:

1. Copy `.env.example` to `.env`
2. Fill in ALL environment variables with your actual values
3. Never commit `.env` to version control (already in `.gitignore`)

### 3. Discord Bot Setup Checklist

- [ ] Bot created in Discord Developer Portal
- [ ] Bot token copied to `.env`
- [ ] Bot invited to server with Administrator permissions (or specific permissions)
- [ ] OAuth2 redirect URI configured in Discord Developer Portal
- [ ] Client ID and Client Secret added to `.env`
- [ ] Server (Guild) ID added to `.env`
- [ ] Channel IDs added to `.env`:
  - Submissions channel
  - Results channel
  - Logs channel
- [ ] Role IDs added to `.env`:
  - Staff role(s) for dashboard access
  - GSP role for auto-assignment
  - FBI role for auto-assignment

### 4. Database

The database will be created automatically on first run. Ensure the `database/` folder exists and is writable.

### 5. Production Deployment

When deploying to production (Hostinger):

1. Update `DISCORD_REDIRECT_URI` to your production domain
2. Set `NODE_ENV=production`
3. Enable SSL/HTTPS (required for OAuth2)
4. Use a process manager like PM2
5. Configure domain/subdomain properly

## 📝 Application Questions

The application questions are defined in `public/js/apply.js`. You can customize these questions for each application type:
- Staff applications
- GSP applications
- FBI applications

## 🎨 Customization

### Branding
- Primary color: `#fdcd04` (defined in `public/css/style.css`)
- Secondary color: `#000000`
- Font: Poppins (loaded from Google Fonts)

### Content
- Update homepage content in `public/index.html`
- Update About page in `public/about.html`
- Update FAQ questions in `public/faq.html`
- Blog posts are created via the API (staff dashboard)

## 🔒 Security Reminders

1. **Session Secret**: Use a strong, random string for `SESSION_SECRET`
   - Generate with: `openssl rand -base64 32`

2. **Rate Limiting**: Already configured for auth endpoints (5 requests per 15 minutes)

3. **HTTPS**: Required in production for OAuth2 to work

4. **Bot Permissions**: Only grant necessary permissions (Administrator is convenient but not required)

## 🐛 Troubleshooting

### Bot Not Responding
- Check bot is online in Discord
- Verify bot token is correct
- Check bot has necessary permissions
- Review server console logs

### OAuth Not Working
- Verify redirect URI matches exactly
- Check SSL is enabled (production)
- Verify client ID and secret are correct
- Check browser console for errors

### Applications Not Posting to Discord
- Verify channel IDs are correct
- Check bot has permission to send messages in those channels
- Verify bot is ready (check console logs)
- Check database for application records

### Role Assignment Not Working
- Verify role IDs are correct
- Check bot's role is higher than roles it's assigning
- Ensure bot has "Manage Roles" permission
- Verify user is in the server

## 📞 Support

For detailed setup instructions, see `SETUP_GUIDE.md`.

For issues:
1. Check server logs
2. Check Discord bot logs
3. Verify all environment variables
4. Review troubleshooting section in setup guide

---

**Remember**: This is a production-ready system. Test thoroughly before going live!



