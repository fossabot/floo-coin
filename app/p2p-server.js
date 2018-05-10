const Websocket = require('ws');

const P2P_PORT = process.env.P2P_PORT || 5001
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];
const MESSAGE_TYPES = {
    chain: 'CHAIN',
    transaction: 'TRANSACTION',
    lastblocktime: 'LAST_BLOCK_TIME'
};

class P2pServer {
    constructor(blockchain, transactionPool) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.sockets = [];
    }

    listen() {
        const server = new Websocket.Server({ port: P2P_PORT });
        server.on('connection', socket => this.connectSocket(socket));
        this.connectToPeers();
        console.log(`Listening for peer-to-peer connections on: ${P2P_PORT}`);
    }

    connectToPeers() {
        peers.forEach(peer => {
            const socket = new Websocket(peer);
            socket.on('open', () => this.connectSocket(socket));
        });
    }

    connectSocket(socket) {
        this.sockets.push(socket);
        console.log('Socket connected');

        this.messageHandler(socket);
        this.sendChain(socket);
    }

    messageHandler(socket) {
        socket.on('message', message => {
            const data = JSON.parse(message);

            switch (data.type) {
                case MESSAGE_TYPES.chain:
                    this.blockchain.replaceChain(data.chain);
                    
                    break;
                case MESSAGE_TYPES.transaction:
                    this.transactionPool.upsertTransaction(data.transaction);
                    break;
                case MESSAGE_TYPES.lastblocktime:
                    this.transactionPool.clear(data.lastblocktime);
                    console.log(JSON.stringify(data.lastblocktime));
                    
                    
            
                    
                    
                    break;
            }
        });
    }

    sendChain(socket) {
        socket.send(JSON.stringify({
            type: MESSAGE_TYPES.chain,
            chain: this.blockchain.chain
        }));
    }

    sendTransaction(socket, transaction) {
        socket.send(JSON.stringify({
            type: MESSAGE_TYPES.transaction,
            transaction
        }));
    }
    sendClear(socket,lastblocktime){
        
        socket.send(JSON.stringify({
            type: MESSAGE_TYPES.lastblocktime,
            lastblocktime
        }));
        
    }
    syncChain() {
        this.sockets.forEach(socket => this.sendChain(socket));
    }

    broadcastTransaction(transaction) {
        this.sockets.forEach(socket => this.sendTransaction(socket, transaction));
    }

    broadcastClearTransactions(lastblocktime) {
        
        this.sockets.forEach(socket => this.sendClear(socket,lastblocktime));
        
    }
}

module.exports = P2pServer;