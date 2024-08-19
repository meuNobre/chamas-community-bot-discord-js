import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('gracious')
    .setDescription('Quem sabe o que é... Gracious Professionalism!!');

export async function execute(interaction) {

    const userId = interaction.user.id;    
    await interaction.reply(`<@${userId}> \n **Hey!!**`);
}
