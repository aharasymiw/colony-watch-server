const { Server } = require('socket.io');

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

interface ClientToServerEvents {
  hello: () => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}


const io = new Server(server, {
  cors: { origin: 'https://localhost:5173' }
});

const makeSocketServer = (server) => {
  return (
    new Server<ServerToClientEvents>(server, {
      cors: { origin: 'https://localhost:5173' }
    });
)
}

module.exports = makeSocketServer;
