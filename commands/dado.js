import { SlashCommandBuilder } from'discord.js';

export const data = new SlashCommandBuilder()
    .setName('dado')
    .setDescription('Rola um dado e retorna um número.')
    .addStringOption(option => 
        option.setName('tipo')
            .setDescription('Escolha o tipo de dado para rolar.')
            .setRequired(true)
            .addChoices(
                { name: 'd6', value: 'd6' },
                { name: 'd20', value: 'd20' }
            ));

export async function execute(interaction) {
    const tipoDado = interaction.options.getString('tipo');
    let maxNumero;

    // Define o número máximo com base no tipo de dado
    switch (tipoDado) {
        case'd6':
            maxNumero = 6;
            break;
        case'd20':
            maxNumero = 20;
            break;
        default:
            maxNumero = 6; // Default para d6 caso algo dê errado
    }

    // Gera um número aleatório entre 1 e o número máximo (d6 ou d20)
    const numero = Math.floor(Math.random() * maxNumero) + 1;

    // Responde com o número gerado e a descrição do dado
    await interaction.reply(`**Número ${numero}  🎲**`);
}
