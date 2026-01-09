/**
 * Georgia State Roleplay - Ticket Bot
 * Handles ticket creation, management, and closing
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder,
    ChannelType,
    PermissionFlagsBits,
    ActivityType
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Configuration from .env
const TICKET_CHANNEL_ID = process.env.TICKET_CHANNEL_ID; // Channel where ticket panel will be sent
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID; // Category for ticket channels
const TICKET_LOGS_CHANNEL_ID = process.env.TICKET_LOGS_CHANNEL_ID; // Channel for ticket logs
const SUPPORT_ROLE_ID = process.env.SUPPORT_ROLE_ID; // Role that can see/manage tickets
const HIGH_RANK_ROLE_ID = process.env.HIGH_RANK_ROLE_ID; // Role for high rank support tickets
const GUILD_ID = process.env.GUILD_ID;

// Banner images
const TOP_BANNER = 'https://cdn.discordapp.com/attachments/1458164064139350200/1458986482747445453/image.png?ex=6961a28c&is=6960510c&hm=cb9c31fde303241d94a1fcfcf8b130f3fb0288d50baad955473c625d11f8c9b3&';
const BOTTOM_BANNER = 'https://cdn.discordapp.com/attachments/1458164064139350200/1458164115871764562/Screenshot_2026-01-05_174055.png?ex=696147a8&is=695ff628&hm=c135d1faa49ca631d772178fabe1d550c5a53062966b3c62e09d722ff4ceed1a&';
const EMBED_COLOR = 0x242429;

// Ticket types configuration
const TICKET_TYPES = {
    general: {
        name: 'General Support',
        description: 'Get help with general questions or issues',
        color: EMBED_COLOR
    },
    staff_report: {
        name: 'Staff Report',
        description: 'Report a staff member for misconduct',
        color: EMBED_COLOR
    },
    high_rank: {
        name: 'High Rank Support',
        description: 'Contact high ranking staff for sensitive matters',
        color: EMBED_COLOR
    }
};

// Track active tickets (in production, use a database)
const activeTickets = new Map();

/**
 * Create the top banner embed
 */
function createTopBannerEmbed() {
    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setImage(TOP_BANNER);
}

/**
 * Bot ready event
 */
client.once('ready', async () => {
    console.log(`Ticket Bot logged in as ${client.user.tag}`);
    
    // Set bot status
    client.user.setActivity('Watching over GSRP Tickets', { type: ActivityType.Watching });
    
    console.log('Ticket Bot is ready!');
});

/**
 * Handle interactions (buttons, select menus)
 */
client.on('interactionCreate', async (interaction) => {
    // Handle select menu for ticket type selection
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_type_select') {
            await handleTicketCreation(interaction);
        }
    }
    
    // Handle buttons
    if (interaction.isButton()) {
        if (interaction.customId === 'create_ticket') {
            await showTicketOptions(interaction);
        } else if (interaction.customId === 'close_ticket') {
            await handleCloseTicket(interaction);
        } else if (interaction.customId === 'confirm_close_ticket') {
            await confirmCloseTicket(interaction);
        } else if (interaction.customId === 'cancel_close_ticket') {
            await interaction.update({ 
                content: '>>> Ticket close cancelled.', 
                components: [] 
            });
        }
    }
});

/**
 * Show ticket type options
 */
async function showTicketOptions(interaction) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_type_select')
        .setPlaceholder('Select ticket type...')
        .addOptions([
            {
                label: TICKET_TYPES.general.name,
                description: TICKET_TYPES.general.description,
                value: 'general'
            },
            {
                label: TICKET_TYPES.staff_report.name,
                description: TICKET_TYPES.staff_report.description,
                value: 'staff_report'
            },
            {
                label: TICKET_TYPES.high_rank.name,
                description: TICKET_TYPES.high_rank.description,
                value: 'high_rank'
            }
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        content: '>>> **Please select a ticket type:**',
        components: [row],
        ephemeral: true
    });
}

/**
 * Handle ticket creation
 */
async function handleTicketCreation(interaction) {
    const ticketType = interaction.values[0];
    const typeConfig = TICKET_TYPES[ticketType];
    const user = interaction.user;
    const guild = interaction.guild;

    // Check if user already has an open ticket of this type
    const existingTicket = Array.from(activeTickets.values()).find(
        t => t.userId === user.id && t.type === ticketType
    );

    if (existingTicket) {
        return interaction.update({
            content: `>>> You already have an open **${typeConfig.name}** ticket: <#${existingTicket.channelId}>`,
            components: []
        });
    }

    await interaction.update({
        content: '>>> Creating your ticket...',
        components: []
    });

    try {
        // Get the ticket category
        const category = guild.channels.cache.get(TICKET_CATEGORY_ID);
        if (!category) {
            return interaction.editReply({
                content: '>>> Ticket category not found. Please contact an administrator.'
            });
        }

        // Create ticket channel name
        const ticketNumber = Date.now().toString().slice(-6);
        const channelName = `${ticketType.replace('_', '-')}-${user.username}-${ticketNumber}`;

        // Set up permissions
        const permissionOverwrites = [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles
                ]
            },
            {
                id: SUPPORT_ROLE_ID,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.AttachFiles
                ]
            }
        ];

        // Add high rank role for high rank tickets
        if (ticketType === 'high_rank' && HIGH_RANK_ROLE_ID) {
            permissionOverwrites.push({
                id: HIGH_RANK_ROLE_ID,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.AttachFiles
                ]
            });
        }

        // Create the ticket channel
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: TICKET_CATEGORY_ID,
            permissionOverwrites: permissionOverwrites
        });

        // Store ticket info
        activeTickets.set(ticketChannel.id, {
            channelId: ticketChannel.id,
            userId: user.id,
            type: ticketType,
            createdAt: new Date()
        });

        // Create welcome embeds
        const topBannerEmbed = createTopBannerEmbed();

        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`${typeConfig.name}`)
            .setDescription(`>>> Hello <@${user.id}>,\n\nThank you for creating a ticket. Our staff team will be with you shortly.\n\n**Please describe your issue in detail below.**`)
            .setColor(EMBED_COLOR)
            .addFields(
                { name: 'Ticket Type', value: `>>> ${typeConfig.name}`, inline: true },
                { name: 'Created By', value: `>>> <@${user.id}>`, inline: true },
                { name: 'Ticket ID', value: `>>> #${ticketNumber}`, inline: true }
            )
            .setImage(BOTTOM_BANNER)
            .setFooter({ text: 'Georgia State Roleplay | Ticket System' })
            .setTimestamp();

        const closeButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

        // Determine who to ping
        let pingContent = `<@${user.id}>`;
        if (ticketType === 'high_rank' && HIGH_RANK_ROLE_ID) {
            pingContent += ` <@&${HIGH_RANK_ROLE_ID}>`;
        } else if (SUPPORT_ROLE_ID) {
            pingContent += ` <@&${SUPPORT_ROLE_ID}>`;
        }

        await ticketChannel.send({
            content: pingContent,
            embeds: [topBannerEmbed, welcomeEmbed],
            components: [closeButton]
        });

        // Update user's message
        await interaction.editReply({
            content: `>>> Your ticket has been created: <#${ticketChannel.id}>`
        });

        // Log ticket creation
        await logTicketAction('created', ticketChannel, user, ticketType);

    } catch (error) {
        console.error('Error creating ticket:', error);
        await interaction.editReply({
            content: '>>> An error occurred while creating your ticket. Please try again.'
        });
    }
}

/**
 * Handle close ticket button
 */
async function handleCloseTicket(interaction) {
    const confirmRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_close_ticket')
                .setLabel('Confirm Close')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel_close_ticket')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.reply({
        content: '>>> **Are you sure you want to close this ticket?**\nThis action cannot be undone.',
        components: [confirmRow],
        ephemeral: true
    });
}

/**
 * Confirm and close ticket
 */
async function confirmCloseTicket(interaction) {
    const channel = interaction.channel;
    const user = interaction.user;

    await interaction.update({
        content: '>>> Closing ticket...',
        components: []
    });

    try {
        const ticketInfo = activeTickets.get(channel.id);
        
        // Create transcript (basic)
        const messages = await channel.messages.fetch({ limit: 100 });
        const transcript = messages.reverse().map(m => 
            `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content || '[Embed/Attachment]'}`
        ).join('\n');

        // Log ticket closure
        await logTicketAction('closed', channel, user, ticketInfo?.type || 'unknown', transcript);

        // Remove from active tickets
        activeTickets.delete(channel.id);

        // Send closing message
        const topBannerEmbed = createTopBannerEmbed();
        
        const closeEmbed = new EmbedBuilder()
            .setTitle('Ticket Closed')
            .setDescription(`>>> This ticket has been closed by <@${user.id}>.\n\nThis channel will be deleted in **5 seconds**.`)
            .setColor(EMBED_COLOR)
            .setImage(BOTTOM_BANNER)
            .setFooter({ text: 'Georgia State Roleplay | Ticket System' })
            .setTimestamp();

        await channel.send({ embeds: [topBannerEmbed, closeEmbed] });

        // Delete channel after 5 seconds
        setTimeout(async () => {
            try {
                await channel.delete();
            } catch (err) {
                console.error('Error deleting ticket channel:', err);
            }
        }, 5000);

    } catch (error) {
        console.error('Error closing ticket:', error);
        await interaction.editReply({
            content: '>>> An error occurred while closing the ticket.'
        });
    }
}

/**
 * Log ticket action to logs channel
 */
async function logTicketAction(action, channel, user, ticketType, transcript = null) {
    const logsChannel = client.channels.cache.get(TICKET_LOGS_CHANNEL_ID);
    if (!logsChannel) return;

    const topBannerEmbed = createTopBannerEmbed();

    const logEmbed = new EmbedBuilder()
        .setTitle(`Ticket ${action.charAt(0).toUpperCase() + action.slice(1)}`)
        .setColor(EMBED_COLOR)
        .addFields(
            { name: 'Channel', value: `>>> ${channel.name}`, inline: true },
            { name: 'User', value: `>>> <@${user.id}>`, inline: true },
            { name: 'Type', value: `>>> ${TICKET_TYPES[ticketType]?.name || ticketType}`, inline: true },
            { name: 'Action By', value: `>>> <@${user.id}>`, inline: true }
        )
        .setImage(BOTTOM_BANNER)
        .setFooter({ text: 'Georgia State Roleplay | Ticket Logs' })
        .setTimestamp();

    await logsChannel.send({ embeds: [topBannerEmbed, logEmbed] });

    // Send transcript as file if closing
    if (transcript && action === 'closed') {
        const buffer = Buffer.from(transcript, 'utf-8');
        await logsChannel.send({
            content: `>>> **Transcript for ${channel.name}**`,
            files: [{
                attachment: buffer,
                name: `transcript-${channel.name}.txt`
            }]
        });
    }
}

/**
 * Command to deploy ticket panel
 */
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;
    
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Deploy ticket panel command (admin only)
    if (command === 'deploytickets') {
        // Check if user has admin permissions
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('>>> You need Administrator permissions to use this command.');
        }

        const topBannerEmbed = createTopBannerEmbed();

        const panelEmbed = new EmbedBuilder()
            .setTitle('Support Tickets')
            .setDescription(`>>> Welcome to **Georgia State Roleplay** Support!\n\nClick the button below to create a ticket and get assistance from our staff team.\n\n**Available Ticket Types:**\n**General Support** - General questions or issues\n**Staff Report** - Report staff misconduct\n**High Rank Support** - Sensitive matters`)
            .setColor(EMBED_COLOR)
            .setImage(BOTTOM_BANNER)
            .setFooter({ text: 'Georgia State Roleplay | Ticket System' })
            .setTimestamp();

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Create Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

        await message.channel.send({
            embeds: [topBannerEmbed, panelEmbed],
            components: [button]
        });

        await message.delete().catch(() => {});
    }
});

// Login
client.login(process.env.DISCORD_BOT_TOKEN);
