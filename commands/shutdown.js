import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('shutdown')
    .setDescription('Desliga o bot com uma contagem regressiva.')
    .addIntegerOption(option =>
        option.setName('timer')
            .setDescription('Tempo em segundos até o bot desligar')
            .setRequired(true))

    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    const timer = interaction.options.getInteger('timer');

    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
    }

    if (timer <= 0) {
        return interaction.reply({ content: 'O tempo deve ser maior que 0 segundos.', ephemeral: true });
    }

    
    
    await interaction.reply(`O bot será desligado em ${timer} segundos.`);
    
    setTimeout(() => {
        interaction.followUp('Desligando o bot agora.');
        console.log('Desligando o bot agora.');
        process.exit();
    }, timer * 1000);
}