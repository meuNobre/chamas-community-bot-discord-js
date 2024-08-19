import { SlashCommandBuilder } from'discord.js';

export const data = new SlashCommandBuilder()
    .setName('convocar')
    .setDescription('Convoca um dos grupos predefinidos.')
    .addStringOption(option => 
        option.setName('grupo')
            .setDescription('Selecione o grupo para convocar.')
            .setRequired(true)
            .addChoices(
                { name: 'Programação', value: 'programacao' },
                { name: 'Outreaching', value: 'outreaching' },
                { name: 'Engenharia', value: 'engenharia' }
            ));

export async function execute(interaction) {
    const grupo = interaction.options.getString('grupo');
    let cargoId;

    switch (grupo) {
        case'programacao':
            cargoId = '1273760485837373480';
            break;
        case'outreaching':
            cargoId = '1273760696844292118';
            break;
        case'engenharia':
            cargoId = '1273760630096134287';
            break;
        default:
            cargoId = null;
            break;
    }

    if (cargoId) {
        await interaction.reply(`Alô <@&${cargoId}>, convocação geral, precisamos de vocês aqui.\nhttps://discord.com/channels/1182792982424997979/1185000853472563200`);
    } else {
        await interaction.reply({ content: 'Grupo inválido selecionado.', ephemeral: true });
    }
}
