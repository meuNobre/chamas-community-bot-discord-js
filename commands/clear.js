import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpa um número especificado de mensagens em um canal.')
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('Número de mensagens a serem limpas')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100));

export async function execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
    }

    if (amount < 1 || amount > 100) {
        return interaction.reply({ content: 'Você deve especificar um número entre 1 e 100!!', ephemeral: true });
    }

    try {
        const fetchedMessages = await interaction.channel.messages.fetch({ limit: amount });
        await interaction.channel.bulkDelete(fetchedMessages);

        await interaction.reply({ content: `Limpadas ${amount} mensagens.`, ephemeral: true });
    } catch (error) {
        console.error('Erro ao limpar mensagens:', error);
        await interaction.reply({ content: 'Houve um erro ao tentar limpar as mensagens no canal.', ephemeral: true });
    }
}