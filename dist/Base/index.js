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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanLog = exports.saveLog = exports.logsRef = exports.comparePoem = exports.searchPoems = exports.savePoem = exports.poemIsExists = exports.getPoem = void 0;
// import 'dotenv/config';
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const string_comparison_1 = require("string-comparison");
const serviceAccount_json_1 = __importDefault(require("./serviceAccount.json"));
const app = firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount_json_1.default),
    databaseURL: 'https://zoobrilka-app-default-rtdb.europe-west1.firebasedatabase.app',
    // databaseURL: process.env.DATABASE_URL,
});
const base = app.database();
const poemsRef = base.ref('poems');
const logsRef = base.ref('logs');
exports.logsRef = logsRef;
const saveLog = (id, log) => __awaiter(void 0, void 0, void 0, function* () { return logsRef.child(id).push(log); });
exports.saveLog = saveLog;
const cleanLog = (id) => __awaiter(void 0, void 0, void 0, function* () { return logsRef.child(id).remove(); });
exports.cleanLog = cleanLog;
const getPoemSnapshot = (id) => __awaiter(void 0, void 0, void 0, function* () { return yield poemsRef.child(id).once('value'); });
const getPoem = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield getPoemSnapshot(id);
    const data = res.toJSON();
    if (data)
        return data;
    return null;
});
exports.getPoem = getPoem;
const poemIsExists = (id) => __awaiter(void 0, void 0, void 0, function* () { return (yield getPoemSnapshot(id)).exists(); });
exports.poemIsExists = poemIsExists;
const savePoem = (poem) => __awaiter(void 0, void 0, void 0, function* () {
    poemsRef.child(String(poem.id)).update(poem);
});
exports.savePoem = savePoem;
const comparePoem = (a, b, title, author) => {
    var _a, _b, _c, _d;
    const poem1 = string_comparison_1.levenshtein.similarity(a.title, title) + string_comparison_1.levenshtein.similarity(a.author.firstName, (_a = author === null || author === void 0 ? void 0 : author.firstName) !== null && _a !== void 0 ? _a : '') + string_comparison_1.levenshtein.similarity(a.author.lastName, (_b = author === null || author === void 0 ? void 0 : author.lastName) !== null && _b !== void 0 ? _b : '');
    const poem2 = string_comparison_1.levenshtein.similarity(b.title, title) + string_comparison_1.levenshtein.similarity(b.author.firstName, (_c = author === null || author === void 0 ? void 0 : author.firstName) !== null && _c !== void 0 ? _c : '') + string_comparison_1.levenshtein.similarity(a.author.lastName, (_d = author === null || author === void 0 ? void 0 : author.lastName) !== null && _d !== void 0 ? _d : '');
    return poem2 - poem1;
};
exports.comparePoem = comparePoem;
const searchPoems = (author, title) => __awaiter(void 0, void 0, void 0, function* () {
    console.time('searchPoems');
    console.log(author);
    console.log(title);
    const arr = [];
    if (author === null || author === void 0 ? void 0 : author.firstName)
        arr.push(poemsRef
            .orderByChild('author/firstName')
            .startAt(author.firstName)
            .endAt(author.firstName + '\uf8ff')
            .limitToFirst(5)
            .once('value'));
    if (author === null || author === void 0 ? void 0 : author.lastName)
        arr.push(poemsRef
            .orderByChild('author/lastName')
            .startAt(author.lastName)
            .endAt(author.lastName + '\uf8ff')
            .limitToFirst(5)
            .once('value'));
    if (title)
        arr.push(poemsRef
            .orderByChild('queryTitle')
            .startAt(title)
            .endAt(title + '\uf8ff')
            .limitToFirst(5)
            .once('value'));
    let res = (yield Promise.all(arr).then((values) => values.map((value) => { var _a; return Object.values((_a = value.val()) !== null && _a !== void 0 ? _a : {}); }))).reduce((acc, value) => [
        ...acc,
        ...value.filter((value) => acc.filter((x) => x.author.firstName === value.author.firstName && x.author.lastName === value.author.lastName && x.title === value.title).length === 0),
    ], []);
    res = res.sort((a, b) => comparePoem(a, b, title !== null && title !== void 0 ? title : '', author)).slice(0, 5);
    console.timeEnd('searchPoems');
    console.log(res.map((x) => `${x.author} - ${x.title}`));
    return res;
});
exports.searchPoems = searchPoems;
