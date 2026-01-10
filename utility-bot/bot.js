/**
 * GSRP | Utility Bot
 * Roblox to Discord Verification & Moderation System
 */

require('dotenv').config();
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActivityType,
    PermissionFlagsBits,
    SlashCommandBuilder
} = require('discord.js');
const axios = require('axios');

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const VERIFICATION_CHANNEL_ID = process.env.VERIFICATION_CHANNEL_ID;
const VERIFIED_ROLE_ID = process.env.VERIFIED_ROLE_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const OWNER_ID = process.env.OWNER_ID;

// Banner URLs
const TOP_BANNER = 'https://cdn.discordapp.com/attachments/1458164064139350200/1459369400401658034/image.png?ex=6963072a&is=6961b5aa&hm=bd3103446d93c0846e112c8ab20ae51846fe5db9c72fd5e5d12998883fe784a7&';
const BOTTOM_BANNER = 'https://cdn.discordapp.com/attachments/1458164064139350200/1458164115871764562/Screenshot_2026-01-05_174055.png';
const EMBED_COLOR = 0x242429;

// Store pending verifications
const pendingVerifications = new Map();

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

/**
 * Check if user is staff
 */
function isStaff(member) {
    if (!member) return false;
    if (member.id === OWNER_ID) return true;
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    if (STAFF_ROLE_ID && member.roles.cache.has(STAFF_ROLE_ID)) return true;
    return false;
}

/**
 * Check if user is owner
 */
function isOwner(userId) {
    return userId === OWNER_ID;
}

/**
 * Generate a random verification code
 */
function generateVerificationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'GSRP-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Get Roblox user ID from username
 */
async function getRobloxUserId(username) {
    try {
        const response = await axios.post('https://users.roblox.com/v1/usernames/users', {
            usernames: [username],
            excludeBannedUsers: true
        });
        
        if (response.data.data && response.data.data.length > 0) {
            return response.data.data[0];
        }
        return null;
    } catch (error) {
        console.error('Error fetching Roblox user:', error.message);
        return null;
    }
}

/**
 * Get Roblox user profile description
 */
async function getRobloxUserDescription(userId) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        return response.data.description || '';
    } catch (error) {
        console.error('Error fetching Roblox description:', error.message);
        return '';
    }
}

/**
 * Get Roblox user avatar
 */
async function getRobloxAvatar(userId) {
    try {
        const response = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`);
        if (response.data.data && response.data.data.length > 0) {
            return response.data.data[0].imageUrl;
        }
        return null;
    } catch (error) {
        console.error('Error fetching Roblox avatar:', error.message);
        return null;
    }
}

/**
 * Send verification panel to channel
 */
async function sendVerificationPanel() {
    const channel = await client.channels.fetch(VERIFICATION_CHANNEL_ID);
    if (!channel) {
        console.error('Could not find verification channel');
        return;
    }

    const topBannerEmbed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setImage(TOP_BANNER);

    const mainEmbed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle('Roblox Verification')
        .setDescription(`>>> Link your Roblox account to your Discord account to access the server and verify your identity.`)
        .addFields(
            {
                name: 'How to Verify',
                value: `>>> **1.** Click the **Verify** button below\n**2.** Enter your Roblox username\n**3.** Add the verification code to your Roblox profile description\n**4.** Click **Confirm Verification**`,
                inline: false
            },
            {
                name: 'Why Verify?',
                value: `>>> Verification helps us maintain a safe community and ensures you can access all server features.`,
                inline: false
            }
        )
        .setImage(BOTTOM_BANNER)
        .setFooter({ text: 'GSRP Verification System' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('start_verification')
                .setLabel('Verify')
                .setStyle(ButtonStyle.Success)
        );

    await channel.send({
        embeds: [topBannerEmbed, mainEmbed],
        components: [row]
    });

    console.log('Verification panel sent successfully');
}

/**
 * Log moderation action
 */
async function logModAction(moderator, target, action, reason, duration = null) {
    if (!LOG_CHANNEL_ID) return;

    try {
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`Moderation Action: ${action}`)
            .setDescription(`>>> **Moderator:** <@${moderator.id}> (${moderator.user?.username || moderator.username})`)
            .addFields(
                { name: 'Target', value: `>>> <@${target.id}> (${target.user?.username || target.username})`, inline: true },
                { name: 'Action', value: `>>> ${action}`, inline: true }
            )
            .setFooter({ text: `Target ID: ${target.id}` })
            .setTimestamp();

        if (reason) {
            embed.addFields({ name: 'Reason', value: `>>> ${reason}`, inline: false });
        }

        if (duration) {
            embed.addFields({ name: 'Duration', value: `>>> ${duration}`, inline: true });
        }

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error logging mod action:', error.message);
    }
}

/**
 * Log verification event
 */
async function logVerification(user, robloxUser, success, reason = '') {
    if (!LOG_CHANNEL_ID) return;

    try {
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor(success ? 0x28a745 : 0xdc3545)
            .setTitle(success ? 'Verification Successful' : 'Verification Failed')
            .setDescription(`>>> **Discord User:** <@${user.id}> (${user.username})`)
            .addFields(
                { name: 'Roblox Username', value: `>>> ${robloxUser?.name || 'N/A'}`, inline: true },
                { name: 'Roblox ID', value: `>>> ${robloxUser?.id || 'N/A'}`, inline: true }
            )
            .setFooter({ text: `User ID: ${user.id}` })
            .setTimestamp();

        if (!success && reason) {
            embed.addFields({ name: 'Reason', value: `>>> ${reason}`, inline: false });
        }

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error logging verification:', error.message);
    }
}

/**
 * Parse duration string to milliseconds
 */
function parseDuration(durationStr) {
    const match = durationStr.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

/**
 * Format duration for display
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day(s)`;
    if (hours > 0) return `${hours} hour(s)`;
    if (minutes > 0) return `${minutes} minute(s)`;
    return `${seconds} second(s)`;
}

// Bot ready event
client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);
    
    client.user.setActivity('Watching over GSRP', { type: ActivityType.Watching });

    // Register slash commands
    const commands = [
        // Owner only
        new SlashCommandBuilder()
            .setName('sendpanel')
            .setDescription('Send the verification panel (Owner only)'),

        // Moderation commands
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Ban a user from the server')
            .addUserOption(option => option.setName('user').setDescription('User to ban').setRequired(true))
            .addStringOption(option => option.setName('reason').setDescription('Reason for ban'))
            .addBooleanOption(option => option.setName('delete_messages').setDescription('Delete recent messages')),

        new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kick a user from the server')
            .addUserOption(option => option.setName('user').setDescription('User to kick').setRequired(true))
            .addStringOption(option => option.setName('reason').setDescription('Reason for kick')),

        new SlashCommandBuilder()
            .setName('timeout')
            .setDescription('Timeout a user')
            .addUserOption(option => option.setName('user').setDescription('User to timeout').setRequired(true))
            .addStringOption(option => option.setName('duration').setDescription('Duration (e.g., 10m, 1h, 1d)').setRequired(true))
            .addStringOption(option => option.setName('reason').setDescription('Reason for timeout')),

        new SlashCommandBuilder()
            .setName('untimeout')
            .setDescription('Remove timeout from a user')
            .addUserOption(option => option.setName('user').setDescription('User to untimeout').setRequired(true)),

        new SlashCommandBuilder()
            .setName('mute')
            .setDescription('Server mute a user in voice channels')
            .addUserOption(option => option.setName('user').setDescription('User to mute').setRequired(true))
            .addStringOption(option => option.setName('reason').setDescription('Reason for mute')),

        new SlashCommandBuilder()
            .setName('unmute')
            .setDescription('Unmute a user in voice channels')
            .addUserOption(option => option.setName('user').setDescription('User to unmute').setRequired(true)),

        new SlashCommandBuilder()
            .setName('deafen')
            .setDescription('Server deafen a user in voice channels')
            .addUserOption(option => option.setName('user').setDescription('User to deafen').setRequired(true))
            .addStringOption(option => option.setName('reason').setDescription('Reason for deafen')),

        new SlashCommandBuilder()
            .setName('undeafen')
            .setDescription('Undeafen a user in voice channels')
            .addUserOption(option => option.setName('user').setDescription('User to undeafen').setRequired(true)),

        new SlashCommandBuilder()
            .setName('warn')
            .setDescription('Warn a user')
            .addUserOption(option => option.setName('user').setDescription('User to warn').setRequired(true))
            .addStringOption(option => option.setName('reason').setDescription('Reason for warning').setRequired(true)),

        // Utility commands
        new SlashCommandBuilder()
            .setName('clear')
            .setDescription('Clear messages from a channel')
            .addIntegerOption(option => option.setName('amount').setDescription('Number of messages (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
            .addUserOption(option => option.setName('user').setDescription('Only delete messages from this user')),

        new SlashCommandBuilder()
            .setName('userinfo')
            .setDescription('Get information about a user')
            .addUserOption(option => option.setName('user').setDescription('User to get info about')),

        new SlashCommandBuilder()
            .setName('serverinfo')
            .setDescription('Get information about the server'),

        new SlashCommandBuilder()
            .setName('role')
            .setDescription('Add or remove a role from a user')
            .addUserOption(option => option.setName('user').setDescription('User to modify').setRequired(true))
            .addRoleOption(option => option.setName('role').setDescription('Role to add/remove').setRequired(true))
            .addStringOption(option => option.setName('action').setDescription('Add or remove').setRequired(true).addChoices(
                { name: 'Add', value: 'add' },
                { name: 'Remove', value: 'remove' }
            )),

        new SlashCommandBuilder()
            .setName('slowmode')
            .setDescription('Set slowmode for the channel')
            .addIntegerOption(option => option.setName('seconds').setDescription('Slowmode in seconds (0 to disable)').setRequired(true).setMinValue(0).setMaxValue(21600)),

        new SlashCommandBuilder()
            .setName('lock')
            .setDescription('Lock the current channel'),

        new SlashCommandBuilder()
            .setName('unlock')
            .setDescription('Unlock the current channel'),

        new SlashCommandBuilder()
            .setName('announce')
            .setDescription('Send an announcement embed')
            .addStringOption(option => option.setName('title').setDescription('Announcement title').setRequired(true))
            .addStringOption(option => option.setName('message').setDescription('Announcement message').setRequired(true))
            .addChannelOption(option => option.setName('channel').setDescription('Channel to send to')),

        new SlashCommandBuilder()
            .setName('nick')
            .setDescription('Change a user\'s nickname')
            .addUserOption(option => option.setName('user').setDescription('User to change nickname').setRequired(true))
            .addStringOption(option => option.setName('nickname').setDescription('New nickname (leave empty to reset)')),

        new SlashCommandBuilder()
            .setName('avatar')
            .setDescription('Get a user\'s avatar')
            .addUserOption(option => option.setName('user').setDescription('User to get avatar')),

        new SlashCommandBuilder()
            .setName('membercount')
            .setDescription('Get the server member count'),
    ];

    try {
        await client.application.commands.set(commands);
        console.log('Slash commands registered');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // Owner only command
    if (commandName === 'sendpanel') {
        if (!isOwner(interaction.user.id)) {
            return interaction.reply({
                content: '>>> This command is restricted to the server owner.',
                ephemeral: true
            });
        }

        await sendVerificationPanel();
        return interaction.reply({
            content: '>>> Verification panel sent!',
            ephemeral: true
        });
    }

    // Staff commands - check permissions
    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: '>>> You do not have permission to use this command.',
            ephemeral: true
        });
    }

    // BAN
    if (commandName === 'ban') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteMessages = interaction.options.getBoolean('delete_messages') || false;

        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            
            if (member && !member.bannable) {
                return interaction.reply({ content: '>>> I cannot ban this user.', ephemeral: true });
            }

            await interaction.guild.members.ban(user.id, {
                reason: `${reason} | Banned by ${interaction.user.username}`,
                deleteMessageSeconds: deleteMessages ? 604800 : 0
            });

            const embed = new EmbedBuilder()
                .setColor(0xdc3545)
                .setTitle('User Banned')
                .setDescription(`>>> **${user.username}** has been banned from the server.`)
                .addFields({ name: 'Reason', value: `>>> ${reason}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModAction(interaction.member, user, 'Ban', reason);
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to ban user: ${error.message}`, ephemeral: true });
        }
    }

    // KICK
    if (commandName === 'kick') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (!member.kickable) {
                return interaction.reply({ content: '>>> I cannot kick this user.', ephemeral: true });
            }

            await member.kick(`${reason} | Kicked by ${interaction.user.username}`);

            const embed = new EmbedBuilder()
                .setColor(0xffc107)
                .setTitle('User Kicked')
                .setDescription(`>>> **${user.username}** has been kicked from the server.`)
                .addFields({ name: 'Reason', value: `>>> ${reason}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModAction(interaction.member, user, 'Kick', reason);
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to kick user: ${error.message}`, ephemeral: true });
        }
    }

    // TIMEOUT
    if (commandName === 'timeout') {
        const user = interaction.options.getUser('user');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const duration = parseDuration(durationStr);
        if (!duration) {
            return interaction.reply({ content: '>>> Invalid duration format. Use: 10s, 10m, 1h, 1d', ephemeral: true });
        }

        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (!member.moderatable) {
                return interaction.reply({ content: '>>> I cannot timeout this user.', ephemeral: true });
            }

            await member.timeout(duration, `${reason} | By ${interaction.user.username}`);

            const embed = new EmbedBuilder()
                .setColor(0xffc107)
                .setTitle('User Timed Out')
                .setDescription(`>>> **${user.username}** has been timed out.`)
                .addFields(
                    { name: 'Duration', value: `>>> ${formatDuration(duration)}`, inline: true },
                    { name: 'Reason', value: `>>> ${reason}`, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModAction(interaction.member, user, 'Timeout', reason, formatDuration(duration));
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to timeout user: ${error.message}`, ephemeral: true });
        }
    }

    // UNTIMEOUT
    if (commandName === 'untimeout') {
        const user = interaction.options.getUser('user');

        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.timeout(null);

            const embed = new EmbedBuilder()
                .setColor(0x28a745)
                .setTitle('Timeout Removed')
                .setDescription(`>>> **${user.username}**'s timeout has been removed.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModAction(interaction.member, user, 'Untimeout', 'Timeout removed');
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to remove timeout: ${error.message}`, ephemeral: true });
        }
    }

    // VOICE MUTE
    if (commandName === 'mute') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (!member.voice.channel) {
                return interaction.reply({ content: '>>> User is not in a voice channel.', ephemeral: true });
            }

            await member.voice.setMute(true, `${reason} | By ${interaction.user.username}`);

            const embed = new EmbedBuilder()
                .setColor(0xdc3545)
                .setTitle('User Server Muted')
                .setDescription(`>>> **${user.username}** has been server muted.`)
                .addFields({ name: 'Reason', value: `>>> ${reason}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModAction(interaction.member, user, 'Server Mute', reason);
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to mute user: ${error.message}`, ephemeral: true });
        }
    }

    // VOICE UNMUTE
    if (commandName === 'unmute') {
        const user = interaction.options.getUser('user');

        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (!member.voice.channel) {
                return interaction.reply({ content: '>>> User is not in a voice channel.', ephemeral: true });
            }

            await member.voice.setMute(false);

            const embed = new EmbedBuilder()
                .setColor(0x28a745)
                .setTitle('User Unmuted')
                .setDescription(`>>> **${user.username}** has been unmuted.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModAction(interaction.member, user, 'Server Unmute', 'Unmuted');
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to unmute user: ${error.message}`, ephemeral: true });
        }
    }

    // VOICE DEAFEN
    if (commandName === 'deafen') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (!member.voice.channel) {
                return interaction.reply({ content: '>>> User is not in a voice channel.', ephemeral: true });
            }

            await member.voice.setDeaf(true, `${reason} | By ${interaction.user.username}`);

            const embed = new EmbedBuilder()
                .setColor(0xdc3545)
                .setTitle('User Server Deafened')
                .setDescription(`>>> **${user.username}** has been server deafened.`)
                .addFields({ name: 'Reason', value: `>>> ${reason}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModAction(interaction.member, user, 'Server Deafen', reason);
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to deafen user: ${error.message}`, ephemeral: true });
        }
    }

    // VOICE UNDEAFEN
    if (commandName === 'undeafen') {
        const user = interaction.options.getUser('user');

        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (!member.voice.channel) {
                return interaction.reply({ content: '>>> User is not in a voice channel.', ephemeral: true });
            }

            await member.voice.setDeaf(false);

            const embed = new EmbedBuilder()
                .setColor(0x28a745)
                .setTitle('User Undeafened')
                .setDescription(`>>> **${user.username}** has been undeafened.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModAction(interaction.member, user, 'Server Undeafen', 'Undeafened');
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to undeafen user: ${error.message}`, ephemeral: true });
        }
    }

    // WARN
    if (commandName === 'warn') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        try {
            // Send DM to user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xffc107)
                    .setTitle('Warning Received')
                    .setDescription(`>>> You have received a warning in **${interaction.guild.name}**.`)
                    .addFields({ name: 'Reason', value: `>>> ${reason}` })
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (e) {
                // Can't DM user
            }

            const embed = new EmbedBuilder()
                .setColor(0xffc107)
                .setTitle('User Warned')
                .setDescription(`>>> **${user.username}** has been warned.`)
                .addFields({ name: 'Reason', value: `>>> ${reason}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModAction(interaction.member, user, 'Warn', reason);
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to warn user: ${error.message}`, ephemeral: true });
        }
    }

    // CLEAR MESSAGES
    if (commandName === 'clear') {
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');

        try {
            await interaction.deferReply({ ephemeral: true });

            let messages = await interaction.channel.messages.fetch({ limit: 100 });
            
            if (targetUser) {
                messages = messages.filter(m => m.author.id === targetUser.id);
            }

            messages = messages.filter(m => !m.pinned);
            const toDelete = messages.first(amount);

            const deleted = await interaction.channel.bulkDelete(toDelete, true);

            await interaction.editReply({
                content: `>>> Deleted **${deleted.size}** message(s)${targetUser ? ` from ${targetUser.username}` : ''}.`
            });

            await logModAction(interaction.member, interaction.user, 'Clear Messages', `Cleared ${deleted.size} messages`);
        } catch (error) {
            await interaction.editReply({ content: `>>> Failed to clear messages: ${error.message}` });
        }
    }

    // USERINFO
    if (commandName === 'userinfo') {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle('User Information')
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: 'Username', value: `>>> ${user.username}`, inline: true },
                { name: 'User ID', value: `>>> ${user.id}`, inline: true },
                { name: 'Account Created', value: `>>> <t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
            );

        if (member) {
            embed.addFields(
                { name: 'Joined Server', value: `>>> <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Nickname', value: `>>> ${member.nickname || 'None'}`, inline: true },
                { name: 'Top Role', value: `>>> ${member.roles.highest}`, inline: true },
                { name: 'Roles', value: `>>> ${member.roles.cache.size - 1} roles`, inline: true }
            );
        }

        await interaction.reply({ embeds: [embed] });
    }

    // SERVERINFO
    if (commandName === 'serverinfo') {
        const guild = interaction.guild;

        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle('Server Information')
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields(
                { name: 'Server Name', value: `>>> ${guild.name}`, inline: true },
                { name: 'Server ID', value: `>>> ${guild.id}`, inline: true },
                { name: 'Owner', value: `>>> <@${guild.ownerId}>`, inline: true },
                { name: 'Members', value: `>>> ${guild.memberCount}`, inline: true },
                { name: 'Channels', value: `>>> ${guild.channels.cache.size}`, inline: true },
                { name: 'Roles', value: `>>> ${guild.roles.cache.size}`, inline: true },
                { name: 'Created', value: `>>> <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Boost Level', value: `>>> Level ${guild.premiumTier}`, inline: true },
                { name: 'Boosts', value: `>>> ${guild.premiumSubscriptionCount || 0}`, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }

    // ROLE
    if (commandName === 'role') {
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const action = interaction.options.getString('action');

        try {
            const member = await interaction.guild.members.fetch(user.id);

            if (action === 'add') {
                await member.roles.add(role);
                await interaction.reply({
                    content: `>>> Added **${role.name}** to **${user.username}**.`,
                    ephemeral: true
                });
            } else {
                await member.roles.remove(role);
                await interaction.reply({
                    content: `>>> Removed **${role.name}** from **${user.username}**.`,
                    ephemeral: true
                });
            }

            await logModAction(interaction.member, user, `Role ${action === 'add' ? 'Added' : 'Removed'}`, role.name);
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to modify role: ${error.message}`, ephemeral: true });
        }
    }

    // SLOWMODE
    if (commandName === 'slowmode') {
        const seconds = interaction.options.getInteger('seconds');

        try {
            await interaction.channel.setRateLimitPerUser(seconds);
            
            const message = seconds === 0 
                ? '>>> Slowmode has been disabled.' 
                : `>>> Slowmode set to **${seconds}** seconds.`;

            await interaction.reply({ content: message });
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to set slowmode: ${error.message}`, ephemeral: true });
        }
    }

    // LOCK
    if (commandName === 'lock') {
        try {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false
            });

            const embed = new EmbedBuilder()
                .setColor(0xdc3545)
                .setDescription('>>> This channel has been locked.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModAction(interaction.member, interaction.user, 'Channel Lock', interaction.channel.name);
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to lock channel: ${error.message}`, ephemeral: true });
        }
    }

    // UNLOCK
    if (commandName === 'unlock') {
        try {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null
            });

            const embed = new EmbedBuilder()
                .setColor(0x28a745)
                .setDescription('>>> This channel has been unlocked.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModAction(interaction.member, interaction.user, 'Channel Unlock', interaction.channel.name);
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to unlock channel: ${error.message}`, ephemeral: true });
        }
    }

    // ANNOUNCE
    if (commandName === 'announce') {
        const title = interaction.options.getString('title');
        const message = interaction.options.getString('message');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        const topBanner = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setImage(TOP_BANNER);

        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(title)
            .setDescription(`>>> ${message}`)
            .setImage(BOTTOM_BANNER)
            .setFooter({ text: `Announced by ${interaction.user.username}` })
            .setTimestamp();

        try {
            await channel.send({ embeds: [topBanner, embed] });
            await interaction.reply({ content: `>>> Announcement sent to ${channel}.`, ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to send announcement: ${error.message}`, ephemeral: true });
        }
    }

    // NICK
    if (commandName === 'nick') {
        const user = interaction.options.getUser('user');
        const nickname = interaction.options.getString('nickname');

        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.setNickname(nickname || null);

            const message = nickname 
                ? `>>> Changed **${user.username}**'s nickname to **${nickname}**.`
                : `>>> Reset **${user.username}**'s nickname.`;

            await interaction.reply({ content: message, ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: `>>> Failed to change nickname: ${error.message}`, ephemeral: true });
        }
    }

    // AVATAR
    if (commandName === 'avatar') {
        const user = interaction.options.getUser('user') || interaction.user;

        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ size: 512 }))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    // MEMBERCOUNT
    if (commandName === 'membercount') {
        const guild = interaction.guild;
        
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle('Member Count')
            .setDescription(`>>> **${guild.name}** has **${guild.memberCount}** members.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});

// Handle button interactions for verification
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // Start verification button
    if (interaction.customId === 'start_verification') {
        const member = interaction.member;
        if (member.roles.cache.has(VERIFIED_ROLE_ID)) {
            return interaction.reply({
                content: '>>> You are already verified.',
                ephemeral: true
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('roblox_username_modal')
            .setTitle('Roblox Verification');

        const usernameInput = new TextInputBuilder()
            .setCustomId('roblox_username')
            .setLabel('Enter your Roblox username')
            .setPlaceholder('Your exact Roblox username')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(20);

        const row = new ActionRowBuilder().addComponents(usernameInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    // Confirm verification button
    if (interaction.customId === 'confirm_verification') {
        await interaction.deferReply({ ephemeral: true });

        const pending = pendingVerifications.get(interaction.user.id);
        if (!pending) {
            return interaction.editReply({
                content: '>>> Your verification session has expired. Please start again.'
            });
        }

        const description = await getRobloxUserDescription(pending.robloxId);
        
        if (description.includes(pending.code)) {
            try {
                const member = interaction.member;
                await member.roles.add(VERIFIED_ROLE_ID);

                try {
                    await member.setNickname(pending.robloxUsername);
                } catch (e) {}

                pendingVerifications.delete(interaction.user.id);

                const successEmbed = new EmbedBuilder()
                    .setColor(0x28a745)
                    .setTitle('Verification Successful')
                    .setDescription(`>>> You have been successfully verified as **${pending.robloxUsername}**!`)
                    .setThumbnail(pending.avatar)
                    .setFooter({ text: 'You can now remove the code from your profile' });

                await interaction.editReply({ embeds: [successEmbed] });
                await logVerification(interaction.user, { name: pending.robloxUsername, id: pending.robloxId }, true);
            } catch (error) {
                console.error('Error assigning role:', error);
                await interaction.editReply({
                    content: '>>> An error occurred while verifying. Please contact a staff member.'
                });
            }
        } else {
            await interaction.editReply({
                content: `>>> Could not find the verification code in your Roblox profile description.\n\n**Your code:** \`${pending.code}\`\n\nMake sure you:\n1. Added the code to your **About** section on your Roblox profile\n2. Saved your profile\n3. Wait a few seconds and try again`
            });

            await logVerification(interaction.user, { name: pending.robloxUsername, id: pending.robloxId }, false, 'Verification code not found');
        }
    }

    // Cancel verification button
    if (interaction.customId === 'cancel_verification') {
        pendingVerifications.delete(interaction.user.id);
        await interaction.update({
            content: '>>> Verification cancelled.',
            embeds: [],
            components: []
        });
    }
});

// Handle modal submissions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'roblox_username_modal') {
        await interaction.deferReply({ ephemeral: true });

        const username = interaction.fields.getTextInputValue('roblox_username').trim();
        const robloxUser = await getRobloxUserId(username);

        if (!robloxUser) {
            return interaction.editReply({
                content: `>>> Could not find a Roblox user with the username **${username}**. Please check the spelling and try again.`
            });
        }

        const code = generateVerificationCode();
        const avatar = await getRobloxAvatar(robloxUser.id);

        pendingVerifications.set(interaction.user.id, {
            robloxUsername: robloxUser.name,
            robloxId: robloxUser.id,
            code: code,
            avatar: avatar,
            timestamp: Date.now()
        });

        const instructionEmbed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle('Verification Code')
            .setDescription(`>>> **Roblox Account:** ${robloxUser.name}\n**Roblox ID:** ${robloxUser.id}`)
            .setThumbnail(avatar)
            .addFields(
                {
                    name: 'Your Verification Code',
                    value: `>>> \`\`\`${code}\`\`\``,
                    inline: false
                },
                {
                    name: 'Instructions',
                    value: `>>> **1.** Go to your [Roblox Profile](https://www.roblox.com/users/${robloxUser.id}/profile)\n**2.** Click the **pencil icon** to edit your profile\n**3.** Paste the code above into your **About** section\n**4.** **Save** your profile\n**5.** Click **Confirm Verification** below`,
                    inline: false
                }
            )
            .setFooter({ text: 'This code expires in 10 minutes' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_verification')
                    .setLabel('Confirm Verification')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cancel_verification')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            embeds: [instructionEmbed],
            components: [row]
        });

        setTimeout(() => {
            if (pendingVerifications.has(interaction.user.id)) {
                const pending = pendingVerifications.get(interaction.user.id);
                if (pending.code === code) {
                    pendingVerifications.delete(interaction.user.id);
                }
            }
        }, 10 * 60 * 1000);
    }
});

// Error handling
client.on('error', (error) => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

// Login
if (!DISCORD_TOKEN) {
    console.error('DISCORD_TOKEN is not set in .env file');
    process.exit(1);
}

client.login(DISCORD_TOKEN);
