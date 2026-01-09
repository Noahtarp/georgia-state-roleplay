/**
 * Discord Bot
 * Handles application posting, button interactions, modals, and role management
 */

require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ActivityType } = require('discord.js');
const { dbHelpers } = require('../database/init');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
});

const SUBMISSIONS_CHANNEL_ID = process.env.DISCORD_SUBMISSIONS_CHANNEL_ID;
const RESULTS_CHANNEL_ID = process.env.DISCORD_RESULTS_CHANNEL_ID;
const LOGS_CHANNEL_ID = process.env.DISCORD_LOGS_CHANNEL_ID;
const ROLE_STAFF = process.env.ROLE_STAFF;
const ROLE_GSP = process.env.ROLE_GSP;
const ROLE_FBI = process.env.ROLE_FBI;

// Banner images
const TOP_BANNER = 'https://cdn.discordapp.com/attachments/1458164064139350200/1458253311412011028/image.png?ex=6960f1fa&is=695fa07a&hm=dc989097444606c4248c252d636086a6ef844e0c4a1c36457927ed301825e4c2&';
const BOTTOM_BANNER = 'https://cdn.discordapp.com/attachments/1458164064139350200/1458164115871764562/Screenshot_2026-01-05_174055.png?ex=696147a8&is=695ff628&hm=c135d1faa49ca631d772178fabe1d550c5a53062966b3c62e09d722ff4ceed1a&';
const EMBED_COLOR = 0x242429;

let botReady = false;

/**
 * Create the top banner embed
 */
function createTopBannerEmbed() {
    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setImage(TOP_BANNER);
}

/**
 * Setup and start the bot
 */
function setupDiscordBot() {
    client.once('ready', () => {
        console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
        botReady = true;
        
        // Set bot status - displays "Watching over GSRP Applications"
        client.user.setActivity('Watching over GSRP Applications', { type: ActivityType.Watching });
    });

    client.on('interactionCreate', async (interaction) => {
        // Handle button clicks
        if (interaction.isButton()) {
            if (interaction.customId.startsWith('app_accept_') || interaction.customId.startsWith('app_deny_')) {
                await handleApplicationButton(interaction);
            }
        }
        
        // Handle modal submissions
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('app_review_')) {
                await handleApplicationModal(interaction);
            }
        }
    });

    client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
        console.error('❌ Failed to login Discord bot:', err.message);
    });
}

/**
 * Post application to Discord submissions channel
 */
async function postApplicationToDiscord(application) {
    if (!botReady) {
        console.warn('Bot not ready, queuing application...');
        setTimeout(() => postApplicationToDiscord(application), 2000);
        return;
    }

    try {
        const channel = client.channels.cache.get(SUBMISSIONS_CHANNEL_ID);
        if (!channel) {
            console.error('Submissions channel not found');
            return;
        }

        const answers = typeof application.answers === 'string' 
            ? JSON.parse(application.answers) 
            : application.answers;

        // Top banner embed
        const topBannerEmbed = createTopBannerEmbed();

        // Main content embed
        const mainEmbed = new EmbedBuilder()
            .setTitle(`📝 ${application.application_type.toUpperCase()} Application`)
            .setDescription(`>>> **Applicant:** <@${application.discord_user_id}>\n**Username:** ${application.discord_username}`)
            .setColor(EMBED_COLOR)
            .addFields(
                { name: 'Application ID', value: `>>> #${application.id}`, inline: true },
                { name: 'Type', value: `>>> ${application.application_type.toUpperCase()}`, inline: true },
                { name: 'Status', value: `>>> ${application.status}`, inline: true },
                { name: 'Submitted', value: `>>> ${new Date(application.created_at).toLocaleString()}`, inline: false }
            )
            .setImage(BOTTOM_BANNER)
            .setFooter({ text: `Application ID: ${application.id} • Georgia State Roleplay` })
            .setTimestamp();

        // Add application answers as fields
        if (Array.isArray(answers)) {
            answers.forEach((answer, index) => {
                if (answer.question && answer.answer) {
                    let value = answer.answer.length > 1000 
                        ? answer.answer.substring(0, 997) + '...' 
                        : answer.answer;
                    mainEmbed.addFields({ 
                        name: answer.question || `Question ${index + 1}`, 
                        value: `>>> ${value}`,
                        inline: false 
                    });
                }
            });
        } else if (typeof answers === 'object') {
            Object.entries(answers).forEach(([key, value]) => {
                let displayValue = String(value).length > 1000 
                    ? String(value).substring(0, 997) + '...' 
                    : String(value);
                mainEmbed.addFields({ 
                    name: key, 
                    value: `>>> ${displayValue}`,
                    inline: false 
                });
            });
        }

        // Create buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`app_accept_${application.id}`)
                    .setLabel('Accept')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId(`app_deny_${application.id}`)
                    .setLabel('Deny')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        // Send both embeds together with role ping
        await channel.send({ 
            content: `<@&1457723127349117002>`,
            embeds: [topBannerEmbed, mainEmbed], 
            components: [row] 
        });
        
        // Log action
        await dbHelpers.run(
            'INSERT INTO logs (action, user_discord_id, user_username, details) VALUES (?, ?, ?, ?)',
            ['application_posted_discord', application.discord_user_id, application.discord_username, `Application ID: ${application.id}`]
        );
    } catch (error) {
        console.error('Error posting application to Discord:', error);
    }
}

/**
 * Handle application button click (Accept/Deny)
 */
async function handleApplicationButton(interaction) {
    const applicationId = interaction.customId.split('_').pop();
    const action = interaction.customId.includes('accept') ? 'accept' : 'deny';

    // Create modal for reason
    const modal = new ModalBuilder()
        .setCustomId(`app_review_${action}_${applicationId}`)
        .setTitle(`${action === 'accept' ? 'Accept' : 'Deny'} Application`);

    const reasonInput = new TextInputBuilder()
        .setCustomId('review_reason')
        .setLabel('Reason')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Enter the reason for this decision...')
        .setRequired(true)
        .setMaxLength(1000);

    const actionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
}

/**
 * Handle application review modal submission
 */
async function handleApplicationModal(interaction) {
    const parts = interaction.customId.split('_');
    const action = parts[2]; // 'accept' or 'deny'
    const applicationId = parseInt(parts[3]);
    const reason = interaction.fields.getTextInputValue('review_reason');

    await interaction.deferReply({ ephemeral: true });

    try {
        // Get application
        const application = await dbHelpers.get('SELECT * FROM applications WHERE id = ?', [applicationId]);
        if (!application) {
            return interaction.editReply({ content: '❌ Application not found.' });
        }

        // Update application status
        await dbHelpers.run(
            `UPDATE applications 
             SET status = ?, reviewer_discord_id = ?, review_reason = ?, reviewed_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [action === 'accept' ? 'accepted' : 'denied', interaction.user.id, reason, applicationId]
        );

        // Assign role if accepted
        if (action === 'accept') {
            const guild = interaction.guild;
            const member = await guild.members.fetch(application.discord_user_id).catch(() => null);
            
            if (member) {
                let roleId = null;
                if (application.application_type === 'staff') {
                    roleId = ROLE_STAFF;
                } else if (application.application_type === 'gsp') {
                    roleId = ROLE_GSP;
                } else if (application.application_type === 'fbi') {
                    roleId = ROLE_FBI;
                }

                if (roleId) {
                    const role = guild.roles.cache.get(roleId);
                    if (role) {
                        await member.roles.add(role);
                    }
                }
            }
        }

        // Post result to results channel
        const resultsChannel = client.channels.cache.get(RESULTS_CHANNEL_ID);
        if (resultsChannel) {
            const topBannerEmbed = createTopBannerEmbed();
            
            const resultEmbed = new EmbedBuilder()
                .setTitle(`${action === 'accept' ? '✅ Application Accepted' : '❌ Application Denied'}`)
                .setDescription(`>>> **Applicant:** <@${application.discord_user_id}>\n**Username:** ${application.discord_username}\n**Type:** ${application.application_type.toUpperCase()}`)
                .setColor(EMBED_COLOR)
                .addFields(
                    { name: 'Application ID', value: `>>> #${application.id}`, inline: true },
                    { name: 'Reviewed by', value: `>>> <@${interaction.user.id}>`, inline: true },
                    { name: 'Reason', value: `>>> ${reason}`, inline: false }
                )
                .setImage(BOTTOM_BANNER)
                .setFooter({ text: `Application ID: ${application.id} • Georgia State Roleplay` })
                .setTimestamp();

            await resultsChannel.send({ embeds: [topBannerEmbed, resultEmbed] });
        }

        // Send DM to applicant
        try {
            const user = await client.users.fetch(application.discord_user_id);
            
            const topBannerEmbed = createTopBannerEmbed();
            
            const dmEmbed = new EmbedBuilder()
                .setTitle(`${action === 'accept' ? '✅ Application Accepted' : '❌ Application Denied'}`)
                .setDescription(`>>> Your **${application.application_type.toUpperCase()}** application has been **${action === 'accept' ? 'accepted' : 'denied'}**.`)
                .setColor(EMBED_COLOR)
                .addFields(
                    { name: 'Application ID', value: `>>> #${application.id}`, inline: true },
                    { name: 'Reason', value: `>>> ${reason}`, inline: false }
                )
                .setImage(BOTTOM_BANNER)
                .setFooter({ text: 'Georgia State Roleplay • Roleplay you can rely on' })
                .setTimestamp();

            if (action === 'accept') {
                dmEmbed.addFields({ 
                    name: 'Next Steps', 
                    value: '>>> Congratulations! Please check the Discord server for further instructions.', 
                    inline: false 
                });
            }

            await user.send({ embeds: [topBannerEmbed, dmEmbed] });
        } catch (dmError) {
            console.error('Failed to send DM to applicant:', dmError);
        }

        // Log action
        await dbHelpers.run(
            'INSERT INTO logs (action, user_discord_id, user_username, details) VALUES (?, ?, ?, ?)',
            [
                `application_${action}ed`,
                interaction.user.id,
                interaction.user.username,
                `Application ID: ${applicationId}, Applicant: ${application.discord_username}`
            ]
        );

        // Log to Discord logs channel
        const logsChannel = client.channels.cache.get(LOGS_CHANNEL_ID);
        if (logsChannel) {
            const topBannerEmbed = createTopBannerEmbed();
            
            const logEmbed = new EmbedBuilder()
                .setTitle(`📋 Application ${action === 'accept' ? 'Accepted' : 'Denied'}`)
                .setColor(EMBED_COLOR)
                .addFields(
                    { name: 'Application ID', value: `>>> #${applicationId}`, inline: true },
                    { name: 'Type', value: `>>> ${application.application_type.toUpperCase()}`, inline: true },
                    { name: 'Applicant', value: `>>> <@${application.discord_user_id}>`, inline: true },
                    { name: 'Reviewed by', value: `>>> <@${interaction.user.id}>`, inline: true },
                    { name: 'Reason', value: `>>> ${reason}`, inline: false }
                )
                .setImage(BOTTOM_BANNER)
                .setFooter({ text: 'Georgia State Roleplay • Logs' })
                .setTimestamp();

            await logsChannel.send({ embeds: [topBannerEmbed, logEmbed] });
        }

        await interaction.editReply({ content: `✅ Application ${action === 'accept' ? 'accepted' : 'denied'} successfully.` });

        // Update original message to remove buttons
        const originalMessage = interaction.message;
        if (originalMessage) {
            // Keep the top banner embed, update the main embed
            const topEmbed = originalMessage.embeds[0];
            const updatedMainEmbed = EmbedBuilder.from(originalMessage.embeds[1])
                .setColor(EMBED_COLOR)
                .spliceFields(-1, 0, { name: 'Decision', value: `>>> ${action === 'accept' ? '✅ **Accepted**' : '❌ **Denied**'} by <@${interaction.user.id}>`, inline: false });

            await originalMessage.edit({ embeds: [topEmbed, updatedMainEmbed], components: [] });
        }
    } catch (error) {
        console.error('Error handling application review:', error);
        await interaction.editReply({ content: '❌ An error occurred while processing the application.' });
    }
}

module.exports = {
    setupDiscordBot,
    postApplicationToDiscord,
    getClient: () => client
};
