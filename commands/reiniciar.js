import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

export const data = new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Recarrega todos os comandos do bot.');

export async function execute(interaction) {
    // Verifica se o usuário tem permissão de administrador
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
    }

    try {
        const commandsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        // Recarrega os comandos
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const fileURL = pathToFileURL(filePath).href;
            const { data, execute } = await import(fileURL);
            interaction.client.commands.set(data.name, { data, execute });
        }

        await interaction.reply({ content: 'Comandos recarregados com sucesso!', ephemeral: true });
    } catch (error) {
        console.error('Erro ao recarregar comandos:', error);
        await interaction.reply({ content: 'Houve um erro ao tentar recarregar os comandos.', ephemeral: true });
    }
}
