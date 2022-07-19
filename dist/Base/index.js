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
exports.searchPoems = exports.savePoem = exports.poemIsExists = exports.getPoem = void 0;
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
    const poem1 = string_comparison_1.levenshtein.similarity(a.title, title) + string_comparison_1.levenshtein.similarity(a.author, author);
    const poem2 = string_comparison_1.levenshtein.similarity(b.title, title) + string_comparison_1.levenshtein.similarity(b.author, author);
    return poem2 - poem1;
};
const searchPoems = (author, title, tagName) => __awaiter(void 0, void 0, void 0, function* () {
    console.time('searchPoems');
    console.log(author);
    console.log(title);
    const arr = [];
    if (author)
        arr.push(poemsRef
            .orderByChild('author')
            .startAt(author)
            .endAt(author + '\uf8ff')
            .limitToFirst(5)
            .once('value'));
    if (title)
        arr.push(poemsRef
            .orderByChild('queryTitle')
            .startAt(title)
            .endAt(title + '\uf8ff')
            .limitToFirst(5)
            .once('value'));
    if (tagName)
        arr.push(poemsRef
            .orderByChild(`tags/${tagName}/`)
            .equalTo(true)
            // .startAt(title)
            // .endAt(title + '\uf8ff')
            .limitToFirst(5)
            .once('value'));
    let res = (yield Promise.all(arr).then((values) => values.map((value) => { var _a; return Object.values((_a = value.val()) !== null && _a !== void 0 ? _a : {}); })))
        .reduce((acc, value) => [...acc, ...value.filter((value) => acc.filter((x) => x.author === value.author && x.title === value.title).length === 0)], [])
        .slice(0, 5);
    // if (title) res = res.sort((a, b) => levenshtein.similarity(b.title, title) - levenshtein.similarity(a.title, title));
    // if (author) res = res.sort((a, b) => levenshtein.similarity(b.author, author) - levenshtein.similarity(a.author, author));
    res = res.sort((a, b) => comparePoem(a, b, title !== null && title !== void 0 ? title : '', author !== null && author !== void 0 ? author : ''));
    console.timeEnd('searchPoems');
    console.log(res.map((x) => `${x.author} - ${x.title}`));
    return res;
});
exports.searchPoems = searchPoems;
