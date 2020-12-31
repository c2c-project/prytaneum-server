import io from './socket-io';

io.use((socket, next) => {
    console.log(socket);
    next();
});
