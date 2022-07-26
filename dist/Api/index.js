"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const Base_1 = require("../Base");
const express_1 = __importStar(require("express"));
const swagger_ui_express_1 = require("swagger-ui-express");
const Alice_1 = require("../Alice");
const axios_1 = __importDefault(require("axios"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const swagger_json_1 = __importDefault(require("./swagger.json"));
const app = (0, express_1.default)();
exports.app = app;
const auth = Buffer.from('250a4b68f4b9439696580f24d1daa8f7:2e25c4b9ec6e4cd6931018051362a96b').toString('base64');
const signedTokens = [];
const signedUsers = {};
console.log(auth);
app.use((0, express_1.json)());
app.use((0, express_1.urlencoded)({ extended: false }));
app.use((0, cors_1.default)({ credentials: true }));
app.use((0, express_fileupload_1.default)({ limits: { files: 1 } }));
app.use((0, cookie_parser_1.default)(auth));
const needAuth = (req, res, next) => {
    var _a;
    // const token = req.signedCookies['accessToken'];
    console.log(req.signedCookies);
    console.log(req.cookies);
    const origin = (_a = req.headers.origin) !== null && _a !== void 0 ? _a : '*';
    console.log(origin);
    res.setHeader('Access-Control-Allow-Origin', origin);
    // if (!token) return res.status(401).send({ error: { message: 'Need authorization' } });
    // else if (signedTokens.includes(token)) return res.status(401).send({ error: { message: 'Invalid token' } });
    // req.accessToken = token;
    // req.userId = signedUsers[token];
    return next();
};
const getToken = (code) => __awaiter(void 0, void 0, void 0, function* () {
    const body = `grant_type=authorization_code&code=${code}`;
    return axios_1.default
        .post(`https://oauth.yandex.ru/token`, body, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${auth}`,
        },
    })
        .then((res) => ({ response: res.data }))
        .catch((error) => ({ error }));
});
const getUserInfo = (token) => __awaiter(void 0, void 0, void 0, function* () {
    return axios_1.default
        .get('https://login.yandex.ru/info', { headers: { Authorization: 'OAuth ' + token } })
        .then((res) => ({ response: res.data }))
        .catch((error) => ({ error }));
});
const updateBaseUser = (yandexUser) => {
    const baseUser = (0, Base_1.getUser)(yandexUser.id);
    const { birthday, display_name, first_name, login, last_name, real_name, sex, id } = yandexUser;
    const newUser = Object.assign(Object.assign({}, baseUser), { birthday, displayName: display_name, firstName: first_name, login, lastName: last_name, realName: real_name, sex,
        id });
    (0, Base_1.updateUser)(newUser);
    return newUser;
};
// POEM
// Возвращает стих
app.get('/api/poem/:id', needAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const poem = id === 'today' ? yield (0, Base_1.getTodayPoem)() : yield (0, Base_1.getPoem)(id);
    if (!poem)
        return res.status(404).send({ error: { message: 'Poem not found' } });
    return res.send({ response: poem });
}));
// Возвращает записи стиха
app.get('/api/records/:poemId', needAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { poemId } = req.params;
    const { offset } = req.query;
    const response = yield (0, Base_1.getPoemRecords)(poemId, offset !== null && offset !== void 0 ? offset : 0);
    return res.send({ response });
}));
// Возвращает записи стихов
app.get('/api/records', needAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { offset } = req.query;
    const response = yield (0, Base_1.getAllPoemRecords)(offset !== null && offset !== void 0 ? offset : 0);
    return res.send({ response });
}));
// RECORD
// Загрузка новой записи
app.post('/api/record', needAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { files } = req;
    const { userId, poemId } = req.body;
    if (!(files === null || files === void 0 ? void 0 : files.record))
        return res.status(400).send({ error: { message: 'Parameter "record" is empty' } });
    if (!userId)
        return res.status(400).send({ error: { message: 'Parameter "userId" is empty' } });
    if (!poemId)
        return res.status(400).send({ error: { message: 'Parameter "poemId" is empty' } });
    const record = files.record;
    const response = yield (0, Base_1.saveNewPoemRecord)(userId, poemId, record);
    return res.send({ response });
}));
// Возвращает запись
app.get('/api/record/:id', needAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const poemRecord = yield (0, Base_1.getPoemRecord)(id);
    if (!poemRecord)
        return res.status(404).send({ error: { message: 'Poem record not found' } });
    return res.send({ response: poemRecord });
}));
// Удаляет запись
app.delete('/api/record/:id', needAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId)
        return res.status(400).send({ error: { message: 'Parameter "userId" is empty' } });
    const ok = yield (0, Base_1.deletePoemRecord)(userId, id);
    return res.sendStatus(ok ? 201 : 403);
}));
// Оценить запись
app.post('/api/record/:id/vote', needAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId, vote } = req.body;
    if (!id)
        return res.status(400).send({ error: { message: 'Parameter "id" is empty' } });
    if (!userId)
        return res.status(400).send({ error: { message: 'Parameter "userId" is empty' } });
    if (!vote)
        return res.status(400).send({ error: { message: 'Parameter "vote" is empty' } });
    const ok = yield (0, Base_1.setPoemRecordScore)(id, userId, Number(vote));
    return res.sendStatus(ok ? 201 : 403);
}));
// USER
app.get('/api/user/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.query;
    if (!code)
        return res.status(400).send({ error: { message: 'Parameter "code" is empty' } });
    const { response, error } = yield getToken(code);
    if (error || !response)
        return res.status(401).send({ error });
    const { access_token, expires_in } = response;
    signedTokens.push(access_token);
    res.cookie('accessToken', access_token, { path: '/', signed: true, maxAge: expires_in, httpOnly: true, secure: true, sameSite: 'none' });
    return res.sendStatus(201);
}));
app.get('/api/user/info', needAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.accessToken)
        return res.status(401).send({ error: { message: 'Need authorization' } });
    const { error, response } = yield getUserInfo(req.accessToken);
    if (error || !response)
        return res.status(400).send({ error });
    signedUsers[req.accessToken] = response.id;
    const user = updateBaseUser(response);
    return res.send({ response: user });
}));
// Возвращает топ записей юзера
app.get('/api/user/:id/records', needAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { poemId } = req.query;
    if (!id)
        return res.status(400).send({ error: { message: 'Parameter "id" is empty' } });
    const response = yield (0, Base_1.getUserRecords)(id, poemId);
    return res.send({ response });
}));
// Возвращает топ юзеров и их записей
app.get('/api/users/records', needAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { poemId, offset } = req.query;
    const response = yield (0, Base_1.getAllUserRecords)(offset !== null && offset !== void 0 ? offset : 0, poemId);
    return res.send({ response });
}));
// EXTRA
app.get('/api/search', needAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, title, lastName } = req.query;
    const response = yield (0, Base_1.searchPoems)({ firstName: firstName !== null && firstName !== void 0 ? firstName : '', lastName: lastName !== null && lastName !== void 0 ? lastName : '' }, title);
    return res.send({ response });
}));
app.get('/wakeup', (req, res) => res.send('OK'));
app.use('/swagger', swagger_ui_express_1.serve, (0, swagger_ui_express_1.setup)(swagger_json_1.default));
app.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield Alice_1.alice.handleRequest(req.body);
    return res.send(result);
}));
