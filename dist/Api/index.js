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
const swagger_ui_express_1 = require("swagger-ui-express");
const Alice_1 = require("../Alice");
const cors_1 = __importDefault(require("cors"));
// import swaggerDevDoc from './swagger.dev.json';
const swagger_json_1 = __importDefault(require("./swagger.json"));
const app = (0, express_1.default)();
exports.app = app;
app.use((0, express_1.json)());
app.use((0, express_1.urlencoded)({ extended: false }));
app.use((0, cors_1.default)());
app.get('/api/poem/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        return res.status(400).send({ error: { message: 'Parameter "id" is empty' } });
    let poem = null;
    if (id === 'today')
        poem = yield (0, Base_1.getTodayPoem)();
    else
        poem = yield (0, Base_1.getPoem)(id);
    if (!poem)
        return res.status(404).send({ error: { message: 'Poem not found' } });
    return res.send({ response: poem });
}));
app.get('/api/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
