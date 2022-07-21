import express, { json, urlencoded } from 'express';
import { getPoem, getTodayPoem, searchPoems } from '../Base';
import { serve, setup } from 'swagger-ui-express';
import { alice } from '../Alice';
import cors from 'cors';
import swaggerDoc from './swagger.json';

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

app.get('/api/poem/today', async (req, res) => {
  const poem = await getTodayPoem();
  if (!poem) return res.status(404).send({ error: { message: 'Today poem not found' } });
  return res.send({ response: poem });
});

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
