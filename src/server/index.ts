import http from 'http';
import makeDebug from 'debug';

import app from 'app';
import { io } from 'socket-io';
import env from 'config/env';

const info = makeDebug('prytaneum:server');
info('Starting server');

const server = http.createServer(app);
io.attach(server);
server.listen(env.PORT);

server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = `Port ${env.PORT}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            info(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            info(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});

server.on('listening', () => {
    const addr = server.address();
    if (addr) {
        const bind =
            typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        info(`Listening on ${bind}`);
    } else {
        info('Address is null');
    }
});
