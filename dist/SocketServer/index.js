"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIoServer = void 0;
const socket_io_1 = require("socket.io");
const Base_1 = require("../Base");
const onConnection = (socket) => {
    console.log('Client connected...');
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
const createIoServer = (server) => {
    const ioServer = new socket_io_1.Server(server, { cors: {} });
    ioServer.on('connection', onConnection);
    return ioServer;
};
exports.createIoServer = createIoServer;
