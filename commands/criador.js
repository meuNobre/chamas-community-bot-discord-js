import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const data = new SlashCommandBuilder()
    .setName('sobre-o-criador')
    .setDescription('Informações sobre o criador.');

export async function execute(interaction) {
    // Defina seu GitHub e ID do Discord
    const githubUrl = 'https://github.com/meuNobre';
    const contactUser = '<@966396759880400986>'; // Marcação do usuário

    // Frases elogiando o criador
    const praiseQuotes = [
        'Amo meu criador, ele que me fez assim! 🌟',
        'Meu criador é incrível, ele é o melhor! 🎉',
        'Estou aqui graças ao meu criador maravilhoso! 🚀',
        'Meu criador é um gênio! 💡',
        'Não seria nada sem meu criador genial! 👏'
    ];

    // Selecione uma frase aleatória
    const randomQuote = praiseQuotes[Math.floor(Math.random() * praiseQuotes.length)];

    // Crie o caminho da imagem
    const imagePath = path.join(__dirname, '..', 'assets', 'oi.png'); // Ajuste o caminho para a pasta assets

    // Crie a embed
    const embed = new EmbedBuilder()
        .setTitle('Informações sobre o criador')
        .setDescription(`Aqui estão algumas informações sobre o criador\n deste bot!`)
        .addFields(
            { name: 'GitHub', value: `[Meu GitHub](${githubUrl})`, inline: true },
            { name: 'Contato', value: `Você pode entrar em contato \ncom ele por: ${contactUser}`, inline: true }
        )
        .setFooter({ text: `Frase aleatória: ${randomQuote}` })
        .setColor('#0099ff')
        .setThumbnail(`attachment://${path.basename(imagePath)}`); // Define o thumbnail

    // Crie botões
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('contact_me')
                .setLabel('Bate-papo')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('report_bug')
                .setLabel('Reportar Bug')
                .setStyle(ButtonStyle.Danger)
        );

    // Envie a embed com botões
    await interaction.reply({ 
        embeds: [embed],
        components: [row],
        files: [imagePath] // Anexa a imagem
    });
}
