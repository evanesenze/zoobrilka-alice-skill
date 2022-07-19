import express, { json, urlencoded } from 'express';
import { getPoem } from '../Base';
const port = 3001;
const app = express();

app.use(json());
app.use(urlencoded({ extended: false }));

app.post('/api/getPoem', async (req, res) => {
  const { poemId } = req.body as { poemId?: string };
  if (!poemId) return res.status(400).send({ error: { message: 'Field "poemId" is empty' } });
  const poem = await getPoem(poemId);
  if (!poem) return res.status(400).send({ error: { message: 'Poem not found' } });
  return res.send({ response: poem });
});

app.listen(port, () => console.log('express running on port ' + port));
