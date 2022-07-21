import { Server, Socket } from 'socket.io';
import { database } from 'firebase-admin';
import http from 'http';
import { logsRef } from '../Base';

const onConnection = (socket: Socket) => {
  console.log('Client connected...');

  socket.on('users:get', async () => {
    const users = (await logsRef.once('value')).toJSON();
    if (users) return socket.emit('users', Object.keys(users));
    return socket.emit('users', []);
  });

  socket.on('user:set', (userId) => {
    if (socket.data.baseRef) (socket.data.baseRef as database.Reference).off();
    console.log(userId);
    const base = logsRef.child(userId).limitToLast(2);
    base.on('child_added', (data) => {
      console.log('base edit');
      socket.emit('logs:update', data.val());
    });
    socket.data.baseRef = base;
  });

  socket.on('disconnect', () => {
    if (socket.data.baseRef) (socket.data.baseRef as database.Reference).off();
    console.log('Client disconnect...');
  });
};
const createIoServer = (server: http.Server) => {
  const ioServer = new Server(server, { cors: {} });
  ioServer.on('connection', onConnection);
  return ioServer;
};

export { createIoServer };
