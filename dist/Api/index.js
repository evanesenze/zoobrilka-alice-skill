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
const cors_1 = __importDefault(require("cors"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
// import swaggerDoc from './swagger.json';
const swagger_dev_json_1 = __importDefault(require("./swagger.dev.json"));
const app = (0, express_1.default)();
exports.app = app;
app.use((0, express_1.json)());
app.use((0, express_1.urlencoded)({ extended: false }));
app.use((0, cors_1.default)());
app.use((0, express_fileupload_1.default)({ limits: { files: 1 } }));
// POEM
// Возвращает стих
app.get('/api/poem/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const poem = id === 'today' ? yield (0, Base_1.getTodayPoem)() : yield (0, Base_1.getPoem)(id);
    if (!poem)
        return res.status(404).send({ error: { message: 'Poem not found' } });
    return res.send({ response: poem });
}));
// Возвращает записи стиха
app.get('/api/records/:poemId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { poemId } = req.params;
    const { offset } = req.query;
    const response = yield (0, Base_1.getPoemRecords)(poemId, offset !== null && offset !== void 0 ? offset : 0);
    return res.send({ response });
}));
// Возвращает записи стихов
app.get('/api/records', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { offset } = req.query;
    const response = yield (0, Base_1.getAllPoemRecords)(offset !== null && offset !== void 0 ? offset : 0);
    return res.send({ response });
}));
// RECORD
// Загрузка новой записи
app.post('/api/record', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.get('/api/record/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const poemRecord = yield (0, Base_1.getPoemRecord)(id);
    if (!poemRecord)
        return res.status(404).send({ error: { message: 'Poem record not found' } });
    return res.send({ response: poemRecord });
}));
// Удаляет запись
app.delete('/api/record/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId)
        return res.status(400).send({ error: { message: 'Parameter "userId" is empty' } });
    const ok = yield (0, Base_1.deletePoemRecord)(userId, id);
    return res.sendStatus(ok ? 201 : 403);
}));
// Оценить запись
app.post('/api/record/:id/vote', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
// Возвращает топ записей юзера
app.get('/api/user/:id/records', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { poemId } = req.query;
    if (!id)
        return res.status(400).send({ error: { message: 'Parameter "id" is empty' } });
    const response = yield (0, Base_1.getUserRecords)(id, poemId);
    return res.send({ response });
}));
// Возвращает топ юзеров и их записей
app.get('/api/users/records', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { poemId, offset } = req.query;
    const response = yield (0, Base_1.getAllUserRecords)(offset !== null && offset !== void 0 ? offset : 0, poemId);
    return res.send({ response });
}));
// EXTRA
app.get('/api/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, title, lastName } = req.query;
    const response = yield (0, Base_1.searchPoems)({ firstName: firstName !== null && firstName !== void 0 ? firstName : '', lastName: lastName !== null && lastName !== void 0 ? lastName : '' }, title);
    return res.send({ response });
}));
app.get('/wakeup', (req, res) => res.send('OK'));
app.use('/swagger', swagger_ui_express_1.serve, (0, swagger_ui_express_1.setup)(swagger_dev_json_1.default));
app.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield Alice_1.alice.handleRequest(req.body);
    return res.send(result);
}));
