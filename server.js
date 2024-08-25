const net = require('net');

const clients = new Map();  // Armazena os clientes com seus sockets

// Função para broadcast de mensagem para todos os clientes, exceto o remetente
function broadcastMessage(message, senderSocket) {
    clients.forEach((socket) => {
        if (socket !== senderSocket) {  // Evita que o remetente receba a própria mensagem
            socket.write(message);
        }
    });
}

// Criação do servidor
const server = net.createServer((socket) => {
    let nickname = '';

    socket.on('data', (data) => {
        const message = data.toString().trim();

        // Primeiro comando deve ser para definir o nickname
        if (message.startsWith('!nick')) {
            nickname = message.split(' ')[1];
            if (!nickname) {
                socket.write('You must provide a nickname!\n');
                socket.end();
            } else if (clients.has(nickname)) {
                socket.write('This nickname is already in use.\n');
            } else {
                clients.set(nickname, socket);
                const users = Array.from(clients.keys()).join(' ');
                socket.write(`!users ${clients.size} ${users}\n`);
                broadcastMessage(`!msg ${nickname} has joined the chat.\n`, socket);
            }
        } else if (!nickname) {
            socket.write('Please set a nickname using !nick <nickname>\n');
            socket.end();
        } else if (message.startsWith('!sendmsg')) {
            const msgText = message.replace('!sendmsg ', '');
            broadcastMessage(`!msg ${nickname} ${msgText}\n`, socket);
        } else if (message.startsWith('!changenickname')) {
            const newNickname = message.split(' ')[1];
            if (clients.has(newNickname)) {
                socket.write('This nickname is already in use.\n');
            } else {
                broadcastMessage(`!changenickname ${nickname} ${newNickname}\n`, socket);
                clients.delete(nickname);
                clients.set(newNickname, socket);
                nickname = newNickname;
            }
        } else if (message.startsWith('!poke')) {
            const pokeTarget = message.split(' ')[1];
            if (clients.has(pokeTarget)) {
                const pokeMessage = `!poke ${nickname}-poker ${pokeTarget}-poked\n`;
                broadcastMessage(pokeMessage, socket);
                clients.get(pokeTarget).write(`!poke ${nickname}-poker ${pokeTarget}-poked\n`);
            } else {
                socket.write('User not found.\n');
            }
        } else {
            socket.write('Unknown command.\n');
        }
    });

    socket.on('end', () => {
        if (nickname) {
            clients.delete(nickname);
            broadcastMessage(`!left ${nickname}-has-left\n`, socket);
        }
    });

    socket.on('error', (err) => {
        console.error(`Socket error: ${err.message}`);
    });
});

const port = 3000;   
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});