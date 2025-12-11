import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, GatewayIntentBits, TextChannel, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

export interface DiscordNotification {
  title: string;
  description: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  url?: string;
  timestamp?: Date;
}

export interface PullRequestNotification {
  projectName: string;
  pullRequestTitle: string;
  pullRequestUrl: string;
  author: string;
  branch: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  reviewUrl?: string;
}

@Injectable()
export class DiscordService implements OnModuleDestroy {
  private readonly logger = new Logger(DiscordService.name);
  private clients: Map<string, Client> = new Map();

  constructor(private configService: ConfigService) {}

  private async getClient(botToken: string): Promise<Client | null> {
    if (!botToken) {
      return null;
    }

    // Return existing client if already connected
    if (this.clients.has(botToken)) {
      const client = this.clients.get(botToken);
      if (client.isReady()) {
        return client;
      }
    }

    try {
      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
        ],
      });

      client.on('ready', () => {
        this.logger.log(`Discord bot logged in as ${client.user.tag}`);
      });

      client.on('error', (error) => {
        this.logger.error('Discord client error:', error);
      });

      client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        
        // Listen to commands
        if (message.content.startsWith('!context')) {
          await this.handleContextRequest(message);
        } else if (message.content.startsWith('!pr')) {
          await this.handlePRStatusRequest(message);
        } else if (message.content.startsWith('!help')) {
          await this.sendHelpMessage(message);
        }
      });

      await client.login(botToken);
      
      // Store client
      this.clients.set(botToken, client);
      
      return client;
    } catch (error) {
      this.logger.error('Failed to initialize Discord bot:', error);
      return null;
    }
  }

  async onModuleDestroy() {
    for (const [token, client] of this.clients.entries()) {
      await client.destroy();
      this.logger.log('Discord bot disconnected');
    }
    this.clients.clear();
  }

  private async getChannel(botToken: string, channelId?: string): Promise<TextChannel | null> {
    if (!botToken || !channelId) {
      return null;
    }

    const client = await this.getClient(botToken);
    if (!client) {
      return null;
    }

    try {
      const channel = await client.channels.fetch(channelId);
      if (channel instanceof TextChannel) {
        return channel;
      }
    } catch (error) {
      this.logger.error(`Failed to fetch Discord channel ${channelId}:`, error);
    }
    return null;
  }

  async sendNotification(notification: DiscordNotification, botToken: string, channelId?: string): Promise<void> {
    const channel = await this.getChannel(botToken, channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle(notification.title)
      .setDescription(notification.description)
      .setColor(notification.color || 0x5865f2)
      .setTimestamp(notification.timestamp || new Date());

    if (notification.url) {
      embed.setURL(notification.url);
    }

    if (notification.fields) {
      embed.addFields(notification.fields);
    }

    try {
      await channel.send({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Failed to send Discord notification:', error);
    }
  }

  async notifyPullRequest(data: PullRequestNotification, botToken: string, channelId?: string): Promise<void> {
    const channel = await this.getChannel(botToken, channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle(`🔔 New Pull Request: ${data.pullRequestTitle}`)
      .setURL(data.pullRequestUrl)
      .setColor(0x00ff00)
      .addFields([
        { name: '📦 Project', value: data.projectName, inline: true },
        { name: '👤 Author', value: data.author, inline: true },
        { name: '🌿 Branch', value: data.branch, inline: true },
        { name: '📄 Files Changed', value: data.filesChanged.toString(), inline: true },
        { name: '➕ Additions', value: `+${data.additions}`, inline: true },
        { name: '➖ Deletions', value: `-${data.deletions}`, inline: true },
      ])
      .setTimestamp()
      .setFooter({ text: 'AI Code Reviewer' });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('View Pull Request')
        .setStyle(ButtonStyle.Link)
        .setURL(data.pullRequestUrl),
    );

    if (data.reviewUrl) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('View AI Review')
          .setStyle(ButtonStyle.Link)
          .setURL(data.reviewUrl),
      );
    }

    try {
      await channel.send({ 
        content: '@here New PR ready for review! 🚀',
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      this.logger.error('Failed to send PR notification:', error);
    }
  }

  async notifyReviewComplete(data: {
    projectName: string;
    pullRequestTitle: string;
    pullRequestUrl: string;
    totalComments: number;
    status: 'success' | 'failed';
  }, botToken: string, channelId?: string): Promise<void> {
    const channel = await this.getChannel(botToken, channelId);
    if (!channel) return;

    const color = data.status === 'success' ? 0x00ff00 : 0xff0000;
    const emoji = data.status === 'success' ? '✅' : '❌';

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} AI Review ${data.status === 'success' ? 'Complete' : 'Failed'}`)
      .setURL(data.pullRequestUrl)
      .setColor(color)
      .addFields([
        { name: '📦 Project', value: data.projectName, inline: true },
        { name: '📝 PR', value: data.pullRequestTitle, inline: true },
      ])
      .setTimestamp();

    if (data.status === 'success') {
      embed.addFields([
        { name: '💬 Comments', value: data.totalComments.toString(), inline: true },
      ]);
    }

    try {
      await channel.send({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Failed to send review complete notification:', error);
    }
  }

  async sendMessage(message: string, botToken: string, channelId?: string): Promise<void> {
    const channel = await this.getChannel(botToken, channelId);
    if (!channel) return;

    try {
      await channel.send(message);
    } catch (error) {
      this.logger.error('Failed to send Discord message:', error);
    }
  }

  private async handleContextRequest(message: any) {
    try {
      const contextInfo = `
**AI Code Reviewer Context**
━━━━━━━━━━━━━━━━━━━━━

📊 **Status**: Online and monitoring
🤖 **Capabilities**: 
  • Auto review pull requests
  • Comment on code issues
  • Reply to developer questions
  • Learn from feedback

📝 **Available Commands**:
  • \`!context\` - Show this context info
  • \`!pr <number>\` - Check PR status
  • \`!help\` - Show help menu

🔗 **Dashboard**: ${this.configService.get('CORS_ORIGIN')}
      `;
      
      await message.reply(contextInfo);
    } catch (error) {
      this.logger.error('Failed to handle context request:', error);
    }
  }

  private async handlePRStatusRequest(message: any) {
    try {
      const prNumber = message.content.split(' ')[1];
      if (!prNumber) {
        await message.reply('❌ Please provide a PR number: `!pr 123`');
        return;
      }

      // TODO: Implement PR status lookup from database
      await message.reply(`🔍 Checking status for PR #${prNumber}...`);
    } catch (error) {
      this.logger.error('Failed to handle PR status request:', error);
    }
  }

  private async sendHelpMessage(message: any) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 AI Code Reviewer - Help')
      .setDescription('Available commands for interacting with the bot')
      .setColor(0x5865f2)
      .addFields([
        {
          name: '!context',
          value: 'Display current system context and status',
        },
        {
          name: '!pr <number>',
          value: 'Check the review status of a specific PR',
        },
        {
          name: '!help',
          value: 'Show this help message',
        },
      ])
      .setTimestamp()
      .setFooter({ text: 'AI Code Reviewer Bot' });

    try {
      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Failed to send help message:', error);
    }
  }

  isEnabled(botToken?: string): boolean {
    return !!botToken;
  }
}
