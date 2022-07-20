import express, { json, urlencoded } from 'express';
import { getPoem, searchPoems } from '../Base';
import cors from 'cors';
import swagger from 'swagger-ui-express';
import swaggerDoc from './swagger.json';

const port = Number(process.env.PORT) || 3000;
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
  const { author, title } = req.query as { author?: string; title?: string };
  const response = await searchPoems(author, title);
  return res.send({ response });
});

app.use('/swagger', swagger.serve, swagger.setup(swaggerDoc));

app.listen(port, () => console.log('express running on port ' + port));

export { app };
