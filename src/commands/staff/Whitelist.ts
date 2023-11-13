import {
    Discord, Slash, SlashChoice, SlashOption,
} from 'discordx';
import type { CommandInteraction } from 'discord.js';
import { ApplicationCommandOptionType, GuildMember } from 'discord.js';
import { Category } from '@discordx/utilities';
import { deleteGptWhitelist, getGptWhitelist, setGptWhitelist } from '../../utils/Util.js';

@Discord()
@Category('Staff')
export class Whitelist {
    @Slash({ description: 'Manages the whitelist for the GPT module.' })
    /**
     * Manages the whitelist for the GPT module.
     * @param user - The user to whitelist
     * @param interaction - The command interaction.
     * @param client - The Discord client.
     */
    async whitelist(
    @SlashChoice({ name: 'Add', value: 'add' })
    @SlashChoice({ name: 'Remove', value: 'remove' })
    @SlashChoice({ name: 'Check', value: 'check' })
    @SlashOption({
        description: 'Whitelist',
        name: 'option',
        required: true,
        type: ApplicationCommandOptionType.String,
    })
        option: string,

    @SlashOption({
        description: 'User',
        name: 'user',
        required: true,
        type: ApplicationCommandOptionType.User,
    })
        user: GuildMember,

        interaction: CommandInteraction,
    ) {
        if (!interaction.channel) return;

        // Check if command was executed by an admin defined in the environment variable.
        const adminIds = process.env.AdminIds?.split(',');
        const isAdmin = adminIds?.some((id) => id === interaction.user.id);

        if (!isAdmin) {
            await interaction.reply({
                content: '⚠️ Access Denied - This command is restricted to administrators only.',
                ephemeral: true,
            });
            return;
        }

        // Fetch the users whitelist status
        const getDb = await getGptWhitelist(user.id);

        // Add user to whitelist
        if (option === 'add') {
            // User is already whitelisted.
            if (getDb) {
                await interaction.reply({ content: '⚠️ User Already Whitelisted.', ephemeral: true });
                return;
            }

            // Update the whitelist and send a success message.
            await setGptWhitelist(user.id);
            await interaction.reply({
                content: '✅ User Whitelisted - The user has been successfully added to the whitelist.',
                ephemeral: true,
            });
        }

        // Remove user from whitelist
        if (option === 'remove') {
            // User is not whitelisted.
            if (!getDb) {
                await interaction.reply({ content: '⚠️ User is not Whitelisted.', ephemeral: true });
                return;
            }

            // Update the whitelist and send a success message.
            await deleteGptWhitelist(user.id);
            await interaction.reply({
                content: '✅ User Removed - The user has been successfully removed from the whitelist.',
                ephemeral: true,
            });
        }

        // Remove user from whitelist
        if (option === 'check') {
            // User is not whitelisted.
            if (!getDb) {
                await interaction.reply({ content: '⚠️ User is not Whitelisted.', ephemeral: true });
            } else {
                await interaction.reply({ content: '✅️ User is Whitelisted.', ephemeral: true });
            }
        }
    }
}