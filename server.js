const net = require('net');

const clients = new Map();

function broadcastMessage(message, sender) {
    clients.forEach((socket, nickname) => {
        if (nickname !== sender) {
            socket.write(message);
        }
    });
}

const server = net.createServer((socket) => {
    let nickname = '';

    socket.on('data', (data) => {
        const message = data.toString().trim();

        if (message.startsWith('!nick')) {
            nickname = message.split(' ')[1];
            if (!nickname) {
                socket.write('You must provide a nickname!\n');
                socket.end();
            } else {
                clients.set(nickname, socket);
                const users = Array.from(clients.keys()).join(' ');
                socket.write(`!users ${clients.size} ${users}\n`);
                broadcastMessage(`!msg ${nickname} entrou no chat.\n`, nickname);
            }
        } else if (!nickname) {
            socket.write('Please set a nickname using !nick <nickname>\n');
            socket.end();
        } else if (message.startsWith('!sendmsg')) {
            const msgText = message.replace('!sendmsg ', '');
            broadcastMessage(`!msg ${nickname} ${msgText}\n`, nickname);
        } else if (message.startsWith('!changenickname')) {
            const newNickname = message.split(' ')[1];
            if (clients.has(newNickname)) {
                socket.write('This nickname is already in use.\n');
            } else {
                broadcastMessage(`!changenickname ${nickname} ${newNickname}\n`, nickname);
                clients.delete(nickname);
                clients.set(newNickname, socket);
                nickname = newNickname;
            }
        } else if (message.startsWith('!poke')) {
            const pokeTarget = message.split(' ')[1];
            if (clients.has(pokeTarget)) {
                broadcastMessage(`!poke ${nickname} ${pokeTarget}\n`, nickname);
            } else {
                socket.write('User not found.\n');
            }
        } else {
            socket.write('Unknown command.\n');
        }
    });

    socket.on('end', () => {
        clients.delete(nickname);
        broadcastMessage(`!msg ${nickname} saiu do chat.\n`, nickname);
    });

    socket.on('error', (err) => {
        console.error(`Socket error: ${err.message}`);
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
