import type { ArgsOf, Client } from 'discordx';
import { Discord, On } from 'discordx';
import { EmbedBuilder, User } from 'discord.js';
import { runGPT } from '../utils/Util.js';

@Discord()
export class MessageCreate {
    /**
     * Handler for messageCreate event.
     * @param args - An array containing the message and client objects.
     * @param client - The Discord client.
     */
    @On({ event: 'messageCreate' })
    async onMessage([message]: ArgsOf<'messageCreate'>, client: Client) {
        // Return if the author is a bot, preventing the bot from replying to itself or other bots.
        if (message.author.bot) return;

        // Direct users to the Discord server if messageCreate is triggered outside a guild.
        if (!message.guild) {
            const embed = new EmbedBuilder().setColor('#EC645D').addFields([
                {
                    name: `**${client.user?.username}**`,
                    value: 'To better assist you, please use our bot within the [AirReps Discord server](https://airreps.link/discord).\nHead over there for a seamless experience. See you on the server!',
                },
            ]);

            await message.reply({ embeds: [embed] });
            return;
        }

        // Function to check whether the bot should respond to the message.
        const shouldRespond = () => {
            const chance = Math.random();
            const regex = /^.{5,100}\?$/;
            return chance <= 0.04 && regex.test(message.content) && message.content.replaceAll(/<@!?(\d+)>/g, '').length;
        };

        // Function to process GPT for a given content and user ID.
        const processGPT = async (content: string, user: User) => {
            await message.channel?.sendTyping();
            const response = await runGPT(content, user);
            await message.reply(response);
        };

        // Respond to the message if the conditions are met.
        if (shouldRespond()) {
            await processGPT(message.content, message.author);
            return;
        }

        // Process the message if it is a reply.
        if (message.reference) {
            try {
                const repliedMessage = await message.channel.messages.fetch(`${message.reference.messageId}`);
                if (!repliedMessage.content.replaceAll(/<@!?(\d+)>/g, '').length) return;

                const isBotReply = repliedMessage.author.id === client.user?.id;

                if (isBotReply && message.author.id !== client.user?.id) {
                    await processGPT(message.content, message.author);
                } else if (message.mentions.has(`${client.user?.id}`) && !message.author.bot) {
                    await processGPT(repliedMessage.content, repliedMessage.author);
                }
            } catch (e) {
                console.error('Error fetching or processing the replied message:', e);
            }
        } else if (message.mentions.has(`${client.user?.id}`)) {
            // Process the message if the bot is mentioned.
            await processGPT(message.content, message.author);
        }
    }
}
