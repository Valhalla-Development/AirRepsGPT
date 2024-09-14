import type { ArgsOf, Client } from 'discordx';
import { Discord, On } from 'discordx';
import { ChannelType, codeBlock, EmbedBuilder } from 'discord.js';
import moment from 'moment';
import 'colors';

@Discord()
export class InteractionCreate {
    /**
     * Handler for interactionCreate event.
     * @param args - An array containing the interaction and client objects.
     * @param client - The Discord client.
     */
    @On({ event: 'interactionCreate' })
    async onInteraction([interaction]: ArgsOf<'interactionCreate'>, client: Client) {
        // Check if the interaction is in a guild and in a guild text channel, and is either a string select menu or a chat input command.
        if (!interaction || !interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText
            || (!interaction.isStringSelectMenu() && !interaction.isChatInputCommand()
                && !interaction.isContextMenuCommand() && !interaction.isButton())) return;

        // Return if guild is not whitelisted
        const { ServerWhitelist } = process.env;
        if (ServerWhitelist && !ServerWhitelist.split(',').some((item) => item === interaction.guild?.id.toString())) return;

        try {
            await client.executeInteraction(interaction);
        } catch (err) {
            console.error('Error executing interaction');
            console.error(err);
        }

        if (process.env.Logging && process.env.Logging.toLowerCase() === 'true') {
            if (interaction.isChatInputCommand()) {
                const nowInMs = Date.now();
                const nowInSecond = Math.round(nowInMs / 1000);

                const logEmbed = new EmbedBuilder().setColor('#EC645D');
                const executedCommand = interaction.toString();

                logEmbed.addFields({
                    name: `Guild: ${interaction.guild.name} | Date: <t:${nowInSecond}>`,
                    value: codeBlock('kotlin', `${interaction.user.username} executed the '${executedCommand}' command`),
                });

                console.log(
                    `${'~~~~'.bgWhite.black.bold} ${moment().format('MMM D, h:mm A')} ${'~~~~'.bgWhite.black.bold}\n`
                    + `${'🔧 Command:'.blue.bold} ${executedCommand.yellow.bold}\n${
                        `${'🔍 Executor:'.green.bold} ${interaction.user.displayName.red.bold} ${'(Guild: '.blue.bold}${interaction.guild.name.magenta.bold})`.blue.bold}\n`,
                );

                if (process.env.CommandLogging) {
                    const channel = client.channels.cache.get(process.env.CommandLogging);
                    if (channel && channel.type === ChannelType.GuildText) {
                        channel.send({ embeds: [logEmbed] });
                    }
                }
            }
        }
    }
}
