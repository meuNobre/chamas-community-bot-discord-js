import { Client, IntentsBitField, Collection, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events, InteractionType } from 'discord.js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import express from 'express';

dotenv.config();

// Configurações e chaves
const API_KEY = process.env.API_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const WEBHOOK_LOG_URL = process.env.WEBHOOK_LOG_URL;
const WEBHOOK_ERROR_URL = process.env.WEBHOOK_ERROR_URL;
const PANEL_CHANNEL_ID = process.env.PANEL_CHANNEL_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USER = process.env.GITHUB_USER;
const DISCORD_NOTIFICATION_CHANNEL_ID = process.env.DISCORD_NOTIFICATION_CHANNEL_ID;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
    ]
});

client.commands = new Collection();

const loadCommands = async () => {
    const commands = [];
    const commandsPath = path.resolve(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.resolve(commandsPath, file);
        const command = await import(`file://${filePath}`);

        if (!command.data || !command.execute) {
            console.error(`Erro ao carregar o comando no arquivo ${file}. Verifique se ele exporta 'data' e 'execute'.`);
            continue;
        }

        if (command.data.toJSON) {
            commands.push(command.data.toJSON());
        } else {
            console.error(`O comando ${command.data.name} não possui o método 'toJSON'.`);
        }

        client.commands.set(command.data.name, command);
        console.log(`Comando ${command.data.name} carregado.`);
    }

    if (client.application) {
        await client.application.commands.set(commands);
    }
};

const sendLog = async (webhookUrl, title, description, fields) => {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .addFields(fields)
        .setColor(0x5865F2);

    const body = JSON.stringify({ embeds: [embed.toJSON()] });

    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body
    });
};

const formatUptime = (uptimeInSeconds) => {
    const days = Math.floor(uptimeInSeconds / (24 * 3600));
    const hours = Math.floor((uptimeInSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeInSeconds % 60);

    let formattedUptime = '';

    if (days > 0) formattedUptime += `${days} dias `;
    if (hours > 0) formattedUptime += `${hours} horas `;
    if (minutes > 0) formattedUptime += `${minutes} minutos `;
    if (seconds > 0 || formattedUptime === '') formattedUptime += `${seconds} segundos`;

    return formattedUptime.trim();
};

const systemStats = () => {
    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const totalMemory = os.totalmem() / 1024 / 1024;
    const cpuUsage = `${(os.loadavg()[0] * 100).toFixed(2)}%`;
    return {
        usedMemory: usedMemory.toFixed(2),
        totalMemory: totalMemory.toFixed(2),
        cpuUsage: cpuUsage
    };
};

const sendControlPanel = async (channelId) => {
    const channel = client.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setTitle('Painel de Controle do Bot')
        .setDescription('Informações úteis e de diagnóstico')
        .addFields([
            { name: 'Ping', value: `${client.ws.ping} ms` },
            { name: 'Número de Servidores', value: `${client.guilds.cache.size}` },
            { name: 'Número de Usuários', value: `${client.users.cache.size}` },
            { name: 'Tempo de Atividade', value: formatUptime(process.uptime()) },
            { name: 'Memória Usada', value: `${systemStats().usedMemory} MB` },
            { name: 'Memória Total', value: `${systemStats().totalMemory} MB` },
            { name: 'Uso da CPU', value: systemStats().cpuUsage }
        ])
        .setColor(0x5865F2);

    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('shutdown')
                .setLabel('Desligar')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('restart')
                .setLabel('Reiniciar')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('contact_me')
                .setLabel('Entrar em Contato')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('report_bug')
                .setLabel('Reportar Bug')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('show_avatar')
                .setLabel('Ver Avatar Global')
                .setStyle(ButtonStyle.Primary)
        );

    const message = await channel.send({ embeds: [embed], components: [actionRow] });

    return message;
};

const getGitHubRepos = async () => {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    if (!response.ok) throw new Error('Erro ao buscar repositórios do GitHub');
    return response.json();
};

const sendNewRepoNotification = async (repo) => {
    const embed = new EmbedBuilder()
        .setTitle('Novo Repositório no GitHub!')
        .setDescription(`Um novo repositório foi publicado: [${repo.name}](${repo.html_url})`)
        .addFields(
            { name: 'Descrição', value: repo.description || 'Sem descrição' },
            { name: 'Data de Criação', value: new Date(repo.created_at).toLocaleDateString() }
        )
        .setColor(0x6b8e23);

    const channel = client.channels.cache.get(DISCORD_NOTIFICATION_CHANNEL_ID);
    if (channel && channel.isTextBased()) {
        await channel.send({ embeds: [embed] });
    }
};

const checkForNewRepos = async () => {
    let lastRepoCount = 0;

    const updateRepos = async () => {
        try {
            const repos = await getGitHubRepos();
            const newRepoCount = repos.length;

            if (newRepoCount > lastRepoCount) {
                const newRepos = repos.slice(lastRepoCount);
                for (const repo of newRepos) {
                    await sendNewRepoNotification(repo);
                }
            }
            lastRepoCount = newRepoCount;
        } catch (error) {
            console.error('Erro ao verificar repositórios:', error);
        }
    };

    setInterval(updateRepos, 15 * 1000);
    console.log("Checando!")
    await updateRepos();
};

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/github-webhook', async (req, res) => {
    const { ref, description } = req.body;

    if (ref && description) {
        const embed = new EmbedBuilder()
            .setTitle('Novo Commit no GitHub!')
            .setDescription(`Foi feito um novo commit: ${description}`)
            .setColor(0x6b8e23);

        const channel = client.channels.cache.get(DISCORD_NOTIFICATION_CHANNEL_ID);
        if (channel && channel.isTextBased()) {
            await channel.send({ embeds: [embed] });
        }
    }

    res.status(200).send('Webhook recebido');
});

app.listen(port, () => {
    console.log(`Servidor webhook rodando na porta ${port}`);
});

client.once('ready', async () => {
    console.log(`${client.user.tag} está online!`);
    await loadCommands();

    const guilds = client.guilds.cache.map(guild => guild.name).join(', ');
    const message = `Estou ativo nos servidores: ${guilds}`;
    console.log(message);

    const logChannel = client.channels.cache.get('1274026799235600424');
    if (logChannel && logChannel.isTextBased()) {
        logChannel.send(message);
    }

    const panelChannel = client.channels.cache.get(PANEL_CHANNEL_ID);
    if (panelChannel && panelChannel.isTextBased()) {
        const updatedPanelMessage = await sendControlPanel(panelChannel.id);

        setInterval(async () => {
            try {
                const embed = new EmbedBuilder()
                    .setTitle('Painel de Controle do Bot')
                    .setDescription('Informações úteis e de diagnóstico')
                    .addFields([
                        { name: 'Ping', value: `${client.ws.ping} ms` },
                        { name: 'Número de Servidores', value: `${client.guilds.cache.size}` },
                        { name: 'Número de Usuários', value: `${client.users.cache.size}` },
                        { name: 'Tempo de Atividade', value: formatUptime(process.uptime()) },
                        { name: 'Memória Usada', value: `${systemStats().usedMemory} MB` },
                        { name: 'Memória Total', value: `${systemStats().totalMemory} MB` },
                        { name: 'Uso da CPU', value: systemStats().cpuUsage }
                    ])
                    .setColor(0x5865F2);

                const actionRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('shutdown')
                            .setLabel('Desligar')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('restart')
                            .setLabel('Reiniciar')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('contact_me')
                            .setLabel('Entrar em Contato')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('report_bug')
                            .setLabel('Reportar Bug')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('show_avatar')
                            .setLabel('Ver Avatar Global')
                            .setStyle(ButtonStyle.Primary)
                    );

                await updatedPanelMessage.edit({ embeds: [embed], components: [actionRow] });
            } catch (error) {
                console.error('Erro ao atualizar o painel de controle:', error);
            }
        }, 1000);
    }

    await checkForNewRepos();
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);

            await sendLog(
                WEBHOOK_LOG_URL,
                'Comando Utilizado',
                `O comando ${interaction.commandName} foi utilizado`,
                [
                    { name: 'Usuário', value: interaction.user.tag },
                    { name: 'Canal', value: interaction.channel.name },
                    { name: 'Servidor', value: interaction.guild.name },
                ]
            );
        } catch (error) {
            console.error('Erro ao executar o comando:', error);

            await sendLog(
                WEBHOOK_ERROR_URL,
                'Erro ao Executar Comando',
                `Comando ${interaction.commandName} gerou um erro: ${error.message}`,
                [{ name: 'Comando', value: interaction.commandName }]
            );
        }
    } else if (interaction.isButton()) {
        console.log(`Botão clicado: ${interaction.customId}`);

        try {
            if (interaction.customId.startsWith('show_avatar_')) {
                const userId = interaction.customId.split('_')[2]; // Extrai o ID do usuário
                const user = await client.users.fetch(userId); // Busca o usuário pelo ID

                const embed = new EmbedBuilder()
                    .setTitle(`Avatar Global de ${user.tag}`)
                    .setImage(user.displayAvatarURL({ size: 2048, dynamic: true }))
                    .setColor(0x5865F2);

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else if (interaction.customId === 'shutdown') {
                await interaction.reply('Desligando...');
                client.destroy(); // Desliga o bot
            } else if (interaction.customId === 'restart') {
                await interaction.reply('Reiniciando...');
                client.destroy(); // Desliga o bot
                client.login(DISCORD_TOKEN); // Reinicia o bot
            } else if (interaction.customId === 'contact_me') {
                await interaction.reply(`Para iniciar um bate-papo com o criador, clique no link abaixo:\n[Iniciar Bate-Papo](https://discord.com/users/966396759880400986)`);
            } else if (interaction.customId === 'report_bug') {
                await interaction.reply('Por favor, envie o relatório de bug no próximo passo.');
                client.once('messageCreate', async message => {
                    if (message.author.id === interaction.user.id) {
                        const embed = new EmbedBuilder()
                            .setTitle('Bug Reportado')
                            .setDescription(message.content)
                            .addFields([{ name: 'Reportado por', value: interaction.user.tag }])
                            .setColor(0xff0000);

                        await client.users.cache.get('966396759880400986').send({ embeds: [embed] });
                        await message.delete();
                        await interaction.followUp({ content: 'Obrigado por reportar o bug! Estaremos verificando o problema.', ephemeral: true });
                    }
                });
            } else {
                await interaction.reply({ content: 'Comando de botão desconhecido.', ephemeral: true });
            }
        } catch (error) {
            console.error('Erro ao lidar com o botão:', error);
            await interaction.reply({ content: 'Ocorreu um erro ao processar sua interação.', ephemeral: true });
        }
    }
});

client.login(DISCORD_TOKEN);
