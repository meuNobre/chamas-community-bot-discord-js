import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('retirar-ban')
    .setDescription('Remove o ban de um usuário especificado.')
    .addStringOption(option =>
        option.setName('usuario')
            .setDescription('ID do usuário a ter o ban removido.')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    try {
        const userId = interaction.options.getString('usuario');

        await interaction.guild.bans.remove(userId);

        // Log de remoção de ban
        const logChannelId = '1273769399970562061';
        const logChannel = interaction.guild.channels.cache.get(logChannelId);

        if (logChannel) {
            await logChannel.send({
                embeds: [
                    {
                        title: 'Ban Removido',
                        description: `**Usuário:** <@${userId}> teve o ban removido.`,
                        color: 0x00ff00,
                        timestamp: new Date(),
                    }
                ]
            });
        }

        await interaction.reply({ content: `O banimento do usuário <@${userId}> foi removido com sucesso.`, ephemeral: true });
    } catch (error) {
        console.error('Erro ao remover ban:', error);

        const logChannelId = '1273769399970562061';
        const logChannel = interaction.guild.channels.cache.get(logChannelId);

        if (logChannel) {
            await logChannel.send({
                embeds: [
                    {
                        title: 'Erro ao Remover Ban',
                        description: `**Erro:** ${error.message}`,
                        color: 0xff0000,
                        timestamp: new Date(),
                    }
                ]
            });
        }

        await interaction.reply({ content: 'Houve um erro ao tentar remover o banimento do usuário.', ephemeral: true });
    }
}
