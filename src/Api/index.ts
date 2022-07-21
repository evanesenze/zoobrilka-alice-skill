import express, { json, urlencoded } from 'express';
import { getPoem, logsRef, searchPoems } from '../Base';
import io, { Socket } from 'socket.io';
import cors from 'cors';
import { database } from 'firebase-admin';
import http from 'http';
// import https from 'https';
import swagger from 'swagger-ui-express';
import swaggerDoc from './swagger.json';

const port = Number(process.env.PORT) || 3001;
const app = express();

app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cors());

app.get('/api/poem/:id', async (req, res) => {
  const { id } = req.params as { id?: string };
  if (!id) return res.status(400).send({ error: { message: 'Parameter "id" is empty' } });
  const poem = await getPoem(id);
  if (!poem) return res.status(404).send({ error: { message: 'Poem not found' } });
  return res.send({ response: poem });
});

app.get('/api/search', async (req, res) => {
  const { firstName, title, lastName } = req.query as { firstName?: string; title?: string; lastName?: string };
  const response = await searchPoems({ firstName: firstName ?? '', lastName: lastName ?? '' }, title);
  return res.send({ response });
});

app.use('/swagger', swagger.serve, swagger.setup(swaggerDoc));

const onConnection = (socket: Socket) => {
  console.log('Client connected...');
  // let baseRef: database.Reference | undefined = undefined;

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

const server = http.createServer(app);
// const httpsServer = https.createServer(app);

const ioServer = new io.Server(server, { cors: { origin: '*' } });

ioServer.on('connection', onConnection);

server.listen(port, () => console.log('server running on port ' + port));

// app.listen(port, () => console.log('express running on port ' + port));

export { app };
