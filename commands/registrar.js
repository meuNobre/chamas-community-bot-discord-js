import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import fetch from 'node-fetch';

// Caminho do arquivo onde os dados dos usuários são armazenados
const dataFilePath = './user_data.json';

// Função para ler os dados do arquivo
const readUserData = () => {
    if (fs.existsSync(dataFilePath)) {
        return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    } else {
        return {};
    }
};

// Função para escrever os dados no arquivo
const writeUserData = (data) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

// URL do webhook
const webhookURL = 'https://discord.com/api/webhooks/1274524220273197067/AeScd1oSoVfeUM8esxxlkwnmzW-q7N1VZtPHLuLTVSEWAQGJDsHnYC0p5lyLAdP_8Vzc';

export const data = new SlashCommandBuilder()
    .setName('registrar')
    .setDescription('Registra um nome e muda o seu apelido para ele.')
    .addStringOption(option => 
        option.setName('nome')
            .setDescription('O nome que você quer registrar como seu apelido.')
            .setRequired(true));

export async function execute(interaction) {
    const nome = interaction.options.getString('nome');
    const userId = interaction.user.id;
    const userTag = interaction.user.tag;
    const guildId = interaction.guild.id;
    const guildName = interaction.guild.name;

    try {
        // Muda o apelido do usuário no servidor
        await interaction.member.setNickname(nome);

        // Atualiza o arquivo de dados
        const userData = readUserData();
        userData[userId] = nome;
        writeUserData(userData);

        // Envia a resposta ao usuário
        await interaction.reply({ content: `Seu apelido foi alterado para **${nome}** com sucesso!`, ephemeral: true });

        // Envia notificação via webhook
        await fetch(webhookURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: `<@${userId}>`,
                embeds: [
                    {
                        title: 'Nome Registrado',
                        description: `${userTag} registrou o nome **${nome}** no servidor **${guildName}**.`,
                        color: 0x00ff00,
                        timestamp: new Date(),
                    }
                ]
            })
        });
    } catch (error) {
        await interaction.reply({ content: `Desculpe, não foi possível alterar seu apelido.`, ephemeral: true });

        // Envia o erro para o canal via webhook
        const errorMessage = `Erro ao tentar alterar o apelido de ${userTag} para "${nome}" no servidor ${guildName}. Erro: ${error.message}`;

        try {
            await fetch(webhookURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: `<@${userId}>`,
                    embeds: [
                        {
                            title: 'Erro ao alterar apelido',
                            description: errorMessage,
                            color: 0xff0000,
                            timestamp: new Date(),
                        }
                    ]
                })
            });
        } catch (webhookError) {
            console.error('Erro ao enviar o webhook:', webhookError);
        }
    }
}
