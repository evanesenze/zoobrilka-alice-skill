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
const express_1 = __importStar(require("express"));
const Base_1 = require("../Base");
const socket_io_1 = __importDefault(require("socket.io"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
// import https from 'https';
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("./swagger.json"));
const port = Number(process.env.PORT) || 3001;
const app = (0, express_1.default)();
exports.app = app;
app.use((0, express_1.json)());
app.use((0, express_1.urlencoded)({ extended: false }));
app.use((0, cors_1.default)());
app.get('/api/poem/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        return res.status(400).send({ error: { message: 'Parameter "id" is empty' } });
    const poem = yield (0, Base_1.getPoem)(id);
    if (!poem)
        return res.status(404).send({ error: { message: 'Poem not found' } });
    return res.send({ response: poem });
}));
app.get('/api/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, title, lastName } = req.query;
    const response = yield (0, Base_1.searchPoems)({ firstName: firstName !== null && firstName !== void 0 ? firstName : '', lastName: lastName !== null && lastName !== void 0 ? lastName : '' }, title);
    return res.send({ response });
}));
app.use('/swagger', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
const onConnection = (socket) => {
    console.log('Client connected...');
    // let baseRef: database.Reference | undefined = undefined;
    socket.on('users:get', () => __awaiter(void 0, void 0, void 0, function* () {
        const users = (yield Base_1.logsRef.once('value')).toJSON();
        if (users)
            return socket.emit('users', Object.keys(users));
        return socket.emit('users', []);
    }));
    socket.on('user:set', (userId) => {
        if (socket.data.baseRef)
            socket.data.baseRef.off();
        console.log(userId);
        const base = Base_1.logsRef.child(userId).limitToLast(2);
        base.on('child_added', (data) => {
            console.log('base edit');
            socket.emit('logs:update', data.val());
        });
        socket.data.baseRef = base;
    });
    socket.on('disconnect', () => {
        if (socket.data.baseRef)
            socket.data.baseRef.off();
        console.log('Client disconnect...');
    });
};
const server = http_1.default.createServer(app);
// const httpsServer = https.createServer(app);
const ioServer = new socket_io_1.default.Server(server, { cors: { origin: '*' } });
ioServer.on('connection', onConnection);
server.listen(port, () => console.log('server running on port ' + port));
