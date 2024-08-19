import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyATqRCxZ2nb0m-fGRKt_qULAna2gEOj4kI';

export const data = new SlashCommandBuilder()
    .setName('gemini')
    .setDescription('Pergunte algo à API Gemini')
    .addStringOption(option =>
        option.setName('pergunta')
              .setDescription('A pergunta que você quer fazer')
              .setRequired(true));

export async function execute(interaction) {
    const pergunta = interaction.options.getString('pergunta');

    try {
        // Inicialize o cliente da API
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Gere o conteúdo
        const result = await model.generateContent(pergunta);
        const response = await result.response.text(); // Aguarde a resposta e a converta para texto

        const embed = new EmbedBuilder()
            .setTitle('Resposta:')
            .setDescription(response)
            .setColor('#0099ff');

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Erro ao interagir com a API Gemini:', error);
        await interaction.reply({ content: 'Houve um erro ao tentar obter uma resposta da API.', ephemeral: true });
    }
}
