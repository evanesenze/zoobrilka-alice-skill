import {
  deletePoemRecord,
  getAllPoemRecords,
  getAllUserRecords,
  getPoem,
  getPoemRecord,
  getPoemRecords,
  getTodayPoem,
  getUser,
  getUserRecords,
  saveNewPoemRecord,
  searchPoems,
  setPoemRecordScore,
  updateUser,
} from '../Base';
import express, { NextFunction, Request, Response, json, urlencoded } from 'express';
import { serve, setup } from 'swagger-ui-express';
import { alice } from '../Alice';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fileupload from 'express-fileupload';
// import swaggerDoc from './swagger.json';
import swaggerDoc from './swagger.dev.json';

interface UserRequest extends Request {
  accessToken?: string;
  userId?: string;
}

const app = express();

const auth = Buffer.from('250a4b68f4b9439696580f24d1daa8f7:2e25c4b9ec6e4cd6931018051362a96b').toString('base64');

const signedTokens: string[] = [];
const signedUsers: Record<string, string> = {};

console.log(auth);
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cors({ credentials: true, origin: '*', allowedHeaders: ['Authorization'], methods: ['POST', 'GET', 'DELETE'], maxAge: 5000 }));
app.use(fileupload({ limits: { files: 1 } }));
app.use(cookieParser(auth));

const needAuth = (req: UserRequest, res: Response, next: NextFunction) => {
  const token = req.signedCookies['accessToken'];
  // console.log(req.signedCookies);
  // console.log(req.cookies);
  const origin = req.headers.origin ?? 'http://localhost:3000/';
  console.log(origin);
  res.setHeader('Access-Control-Allow-Origin', origin);
  if (!token) return res.status(401).send({ error: { message: 'Need authorization' } });
  else if (!signedTokens.includes(token)) return res.status(401).send({ error: { message: 'Invalid token' } });
  req.accessToken = token;
  req.userId = signedUsers[token];
  return next();
};

const getToken = async (code: string): IResponse<IOauthTokenResponse> => {
  const body = `grant_type=authorization_code&code=${code}`;
  return axios
    .post(`https://oauth.yandex.ru/token`, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
    })
    .then((res) => ({ response: res.data }))
    .catch((error) => ({ error }));
};

const getUserInfo = async (token: string): IResponse<IOauthUserInfoResponse> =>
  axios
    .get('https://login.yandex.ru/info', { headers: { Authorization: 'OAuth ' + token } })
    .then((res) => ({ response: res.data }))
    .catch((error) => ({ error }));

const updateBaseUser = (yandexUser: IOauthUserInfoResponse): IUser => {
  const baseUser = getUser(yandexUser.id);
  const { birthday, display_name, first_name, login, last_name, real_name, sex, id } = yandexUser;
  const newUser: IUser = {
    ...baseUser,
    birthday,
    displayName: display_name,
    firstName: first_name,
    login,
    lastName: last_name,
    realName: real_name,
    sex,
    id,
  };
  updateUser(newUser);
  return newUser;
};

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
  const { offset } = req.query as { offset?: string };
  const response = await getPoemRecords(poemId, Number(offset) ?? 0);
  return res.send({ response });
});
// Возвращает записи стихов
app.get('/api/records', async (req, res) => {
  const { offset } = req.query as { offset?: string };
  const response = await getAllPoemRecords(Number(offset) ?? 0);
  return res.send({ response });
});

// RECORD
// Загрузка новой записи
app.post('/api/record', needAuth, async (req: UserRequest, res) => {
  const { files } = req;
  const { poemId, ownerName, poemName } = req.body;
  if (!files?.record) return res.status(400).send({ error: { message: 'Parameter "record" is empty' } });
  if (!req.userId) return res.status(401).send({ error: { message: 'Need authorization' } });
  if (!poemId) return res.status(400).send({ error: { message: 'Parameter "poemId" is empty' } });
  if (!ownerName) return res.status(400).send({ error: { message: 'Parameter "ownerName" is empty' } });
  if (!poemName) return res.status(400).send({ error: { message: 'Parameter "poemName" is empty' } });
  const record = files.record as fileupload.UploadedFile;
  const response = await saveNewPoemRecord(req.userId, poemId, ownerName, poemName, record);
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
app.post('/api/record/:id/delete', needAuth, async (req: UserRequest, res) => {
  const { id } = req.params as { id?: string };
  if (!id) return res.status(400).send({ error: { message: 'Parameter "id" is empty' } });
  if (!req.userId) return res.status(401).send({ error: { message: 'Need authorization' } });
  const ok = await deletePoemRecord(req.userId, id);
  return res.sendStatus(ok ? 201 : 403);
});
// Оценить запись
app.post('/api/record/:id/vote', needAuth, async (req: UserRequest, res) => {
  const { id } = req.params as { id?: string };
  const { vote } = req.body as { userId?: string; vote?: string };
  if (!id) return res.status(400).send({ error: { message: 'Parameter "id" is empty' } });
  if (!req.userId) return res.status(401).send({ error: { message: 'Need authorization' } });
  if (!vote) return res.status(400).send({ error: { message: 'Parameter "vote" is empty' } });
  const ok = await setPoemRecordScore(id, req.userId, Number(vote));
  return res.sendStatus(ok ? 201 : 403);
});

// USER
app.get('/api/user/login', async (req, res) => {
  const { code } = req.query as { code?: string };
  if (!code) return res.status(400).send({ error: { message: 'Parameter "code" is empty' } });
  const { response, error } = await getToken(code);
  if (error || !response) return res.status(401).send({ error });
  const { access_token, expires_in } = response;
  signedTokens.push(access_token);
  const origin = req.headers.origin ?? '*';
  console.log(origin);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.cookie('accessToken', access_token, { path: '/', signed: true, maxAge: expires_in, httpOnly: true, secure: true, sameSite: 'none' });
  return res.sendStatus(201);
});

app.get('/api/user/info', needAuth, async (req: UserRequest, res) => {
  if (!req.accessToken) return res.status(401).send({ error: { message: 'Need authorization' } });
  const { error, response } = await getUserInfo(req.accessToken);
  if (error || !response) return res.status(400).send({ error });
  signedUsers[req.accessToken] = response.id;
  const user = updateBaseUser(response);
  return res.send({ response: user });
});

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
  const { poemId, offset } = req.query as { poemId?: string; offset?: string };
  const response = await getAllUserRecords(Number(offset) ?? 0, poemId);
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
