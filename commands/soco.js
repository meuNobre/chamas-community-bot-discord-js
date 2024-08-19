import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch'; // Instale com 'npm install node-fetch'
import dotenv from 'dotenv';

dotenv.config();

// Obter a chave da API do ambiente
const GIPHY_API_KEY = process.env.GIPHY_API_KEY; // Substitua pela sua chave da API Giphy

export const data = new SlashCommandBuilder()
    .setName('soco')
    .setDescription('Soca um usuário.')
    .addUserOption(option => 
        option.setName('user')
            .setDescription('O usuário que você deseja socar')
            .setRequired(true));

export async function execute(interaction) {
    const userToHug = interaction.options.getUser('user');
    const bot = interaction.client.user;
    const userName = interaction.user.username;
    const userToHugId = userToHug.id;
    const botId = bot.id;

    // Verifica se o bot está sendo abraçado
    const isBotHugged = userToHugId === botId;

    // Verifica se o usuário está abraçando a si mesmo
    const isSelfHug = userToHugId === interaction.user.id;

    // Pesquisa por GIFs de abraços no Giphy
    const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=punch&limit=200`);
    const data = await response.json();
    const gifs = data.data;
    const randomGif = gifs[Math.floor(Math.random() * gifs.length)].images.original.url;

    // Monta a mensagem de resposta
    const embed = new EmbedBuilder()
        .setImage(randomGif)
        .setColor(0x5865F2);

    let messageContent = '';
    if (isSelfHug) {
        embed.setTitle('Você se bateu?')
            .setDescription('**Lembre-se**: Não é necessária a agressão física em si mesmo. ');
    } else {
        embed.setTitle('ESSA DOEU!')  
            .setDescription(`:punch:  <@${interaction.user.id}> socou <@${userToHugId}>!`);
    }

    if (isBotHugged) {
        embed.setDescription('Ei, não me bata, isso doi! :angry:');
    }

    await interaction.reply({ content: messageContent, embeds: [embed] });
    console.log(`${userName} utilizou /soco`);
}
