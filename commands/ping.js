import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Responde com o ping do bot e do jogador.');


export async function execute(interaction) {
    const botPing = interaction.client.ws.ping;
    const interactionPing = Date.now() - interaction.createdTimestamp;
    
    await interaction.reply(`**Pong!** 🏓\n**Ping do bot**: ${botPing}ms\n**Seu ping**: ${interactionPing}ms`);
}
