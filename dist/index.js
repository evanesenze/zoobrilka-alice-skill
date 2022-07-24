"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const Api_1 = require("./Api");
const SocketServer_1 = require("./SocketServer");
const http_1 = __importDefault(require("http"));
const port = Number(process.env.PORT) || 3001;
const server = http_1.default.createServer(Api_1.app);
exports.server = server;
(0, SocketServer_1.createIoServer)(server);
server.listen(port, () => {
    console.log('server running on port ' + port);
    // reshuffleTodayPoemId();
});
