import {
  deletePoemRecord,
  getAllPoemRecords,
  getAllUserRecords,
  getPoem,
  getPoemRecord,
  getPoemRecords,
  getTodayPoem,
  getUserRecords,
  saveNewPoemRecord,
  searchPoems,
  setPoemRecordScore,
} from '../Base';
import express, { json, urlencoded } from 'express';
import { serve, setup } from 'swagger-ui-express';
import { alice } from '../Alice';
import cors from 'cors';
import fileupload from 'express-fileupload';
import swaggerDoc from './swagger.json';
// import swaggerDoc from './swagger.dev.json';

const app = express();

app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cors());
app.use(fileupload({ limits: { files: 1 } }));

// POEM
// Возвращает стих
app.get('/api/poem/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  const poem = id === 'today' ? await getTodayPoem() : await getPoem(id);
  if (!poem) return res.status(404).send({ error: { message: 'Poem not found' } });
  return res.send({ response: poem });
});
// Возвращает записи стиха
app.get('/api/records/:poemId', async (req, res) => {
  const { poemId } = req.params as { poemId: string };
  const { offset } = req.query as { offset?: number };
  const response = await getPoemRecords(poemId, offset ?? 0);
  return res.send({ response });
});
// Возвращает записи стихов
app.get('/api/records', async (req, res) => {
  const { offset } = req.query as { offset?: number };
  const response = await getAllPoemRecords(offset ?? 0);
  return res.send({ response });
});

// RECORD
// Загрузка новой записи
app.post('/api/record', async (req, res) => {
  const { files } = req;
  const { userId, poemId } = req.body;
  if (!files?.record) return res.status(400).send({ error: { message: 'Parameter "record" is empty' } });
  if (!userId) return res.status(400).send({ error: { message: 'Parameter "userId" is empty' } });
  if (!poemId) return res.status(400).send({ error: { message: 'Parameter "poemId" is empty' } });
  const record = files.record as fileupload.UploadedFile;
  const response = await saveNewPoemRecord(userId, poemId, record);
  return res.send({ response });
});
// Возвращает запись
app.get('/api/record/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  const poemRecord = await getPoemRecord(id);
  if (!poemRecord) return res.status(404).send({ error: { message: 'Poem record not found' } });
  return res.send({ response: poemRecord });
});
// Удаляет запись
app.delete('/api/record/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  const { userId } = req.body;
  if (!userId) return res.status(400).send({ error: { message: 'Parameter "userId" is empty' } });
  const ok = await deletePoemRecord(userId, id);
  return res.sendStatus(ok ? 201 : 403);
});
// Оценить запись
app.post('/api/record/:id/vote', async (req, res) => {
  const { id } = req.params as { id?: string };
  const { userId, vote } = req.body as { userId?: string; vote?: number };
  if (!id) return res.status(400).send({ error: { message: 'Parameter "id" is empty' } });
  if (!userId) return res.status(400).send({ error: { message: 'Parameter "userId" is empty' } });
  if (!vote) return res.status(400).send({ error: { message: 'Parameter "vote" is empty' } });
  const ok = await setPoemRecordScore(id, userId, Number(vote));
  return res.sendStatus(ok ? 201 : 403);
});

// USER
// Возвращает топ записей юзера
app.get('/api/user/:id/records', async (req, res) => {
  const { id } = req.params as { id?: string };
  const { poemId } = req.query as { poemId?: string };
  if (!id) return res.status(400).send({ error: { message: 'Parameter "id" is empty' } });
  const response = await getUserRecords(id, poemId);
  return res.send({ response });
});
// Возвращает топ юзеров и их записей
app.get('/api/users/records', async (req, res) => {
  const { poemId, offset } = req.query as { poemId?: string; offset?: number };
  const response = await getAllUserRecords(offset ?? 0, poemId);
  return res.send({ response });
});

// EXTRA

app.get('/api/search', async (req, res) => {
  const { firstName, title, lastName } = req.query as { firstName?: string; title?: string; lastName?: string };
  const response = await searchPoems({ firstName: firstName ?? '', lastName: lastName ?? '' }, title);
  return res.send({ response });
});

app.get('/wakeup', (req, res) => res.send('OK'));

app.use('/swagger', serve, setup(swaggerDoc));

app.post('/', async (req, res) => {
  const result = await alice.handleRequest(req.body);
  return res.send(result);
});

export { app };
