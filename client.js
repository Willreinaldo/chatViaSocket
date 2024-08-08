const net = require('net');
const readline = require('readline');

const client = net.createConnection({ port: 3000 }, () => {
    console.log('Connected to server!');
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

client.on('data', (data) => {
    console.log(data.toString().trim());
});

client.on('end', () => {
    console.log('Disconnected from server');
    rl.close();
});

client.on('error', (err) => {
    console.error(`Socket error: ${err.message}`);
});

rl.on('line', (input) => {
    client.write(input);
});