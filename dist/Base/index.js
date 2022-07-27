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
exports.updateUser = exports.reshuffleTodayPoemId = exports.getAllUserRecords = exports.getUser = exports.getUserRecords = exports.setPoemRecordScore = exports.getPoemRecord = exports.getPoemRecords = exports.deletePoemRecord = exports.saveNewPoemRecord = exports.getTodayPoem = exports.getAllPoemRecords = exports.cleanLog = exports.saveLog = exports.logsRef = exports.comparePoem = exports.searchPoems = exports.savePoem = exports.poemIsExists = exports.getPoem = void 0;
// import 'dotenv/config';
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const string_comparison_1 = require("string-comparison");
const serviceAccount_json_1 = __importDefault(require("./serviceAccount.json"));
const uuid_1 = require("uuid");
const app = firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount_json_1.default),
    databaseURL: 'https://zoobrilka-app-default-rtdb.europe-west1.firebasedatabase.app',
    // databaseURL: process.env.DATABASE_URL,
});
const base = app.database();
const storage = app.storage().bucket('gs://zoobrilka-app.appspot.com');
const poemsRef = base.ref('poems');
const usersRef = base.ref('users');
const recordsRef = base.ref('records');
const logsRef = base.ref('logs');
exports.logsRef = logsRef;
let todayPoemId = '0';
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
const getTodayPoem = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(todayPoemId);
    return getPoem(todayPoemId);
});
exports.getTodayPoem = getTodayPoem;
const poemIsExists = (id) => __awaiter(void 0, void 0, void 0, function* () { return (yield getPoemSnapshot(id)).exists(); });
exports.poemIsExists = poemIsExists;
const savePoem = (poem) => __awaiter(void 0, void 0, void 0, function* () {
    poemsRef.child(String(poem.id)).update(poem);
});
exports.savePoem = savePoem;
const getPoemQuality = (poem, currentTitle, currentAuthor) => {
    var _a, _b;
    const { author: { firstName, lastName }, title, } = poem;
    const titleRate = 1;
    const firstNameRate = 2;
    const lastNameRate = 3;
    const quality = titleRate * string_comparison_1.levenshtein.similarity(title, currentTitle !== null && currentTitle !== void 0 ? currentTitle : '') +
        firstNameRate * string_comparison_1.levenshtein.similarity(firstName, (_a = currentAuthor === null || currentAuthor === void 0 ? void 0 : currentAuthor.firstName) !== null && _a !== void 0 ? _a : '') +
        lastNameRate * string_comparison_1.levenshtein.similarity(lastName, (_b = currentAuthor === null || currentAuthor === void 0 ? void 0 : currentAuthor.lastName) !== null && _b !== void 0 ? _b : '');
    return quality;
};
const comparePoem = (a, b, title, author) => getPoemQuality(b, title, author) - getPoemQuality(a, title, author);
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
    res = res.sort((a, b) => comparePoem(a, b, title, author)).slice(0, 5);
    console.timeEnd('searchPoems');
    console.log(res.map((x) => `${x.author} - ${x.title}`));
    return res;
});
exports.searchPoems = searchPoems;
const getPoemRecord = (recordId) => __awaiter(void 0, void 0, void 0, function* () { return (yield recordsRef.child(recordId).once('value')).toJSON(); });
exports.getPoemRecord = getPoemRecord;
const updatePoemRecord = (poemRecord) => __awaiter(void 0, void 0, void 0, function* () { return yield recordsRef.child(poemRecord.id).update(poemRecord); });
const saveNewPoemRecord = (userId, poemId, ownerName, poemName, record) => __awaiter(void 0, void 0, void 0, function* () {
    const recordId = (0, uuid_1.v4)();
    const file = storage.file(`${poemId}/${recordId}.mp3`);
    yield file.save(record.data);
    const url = (yield file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491',
    }))[0];
    const poemRecord = {
        id: recordId,
        ownerName,
        poemName,
        url,
        owner: userId,
        poem: poemId,
        rating: 0,
    };
    updatePoemRecord(poemRecord);
    usersRef.child(`${userId}/records`).transaction((arr) => {
        arr !== null && arr !== void 0 ? arr : (arr = []);
        arr.push(recordId);
        return arr;
    });
    return poemRecord;
});
exports.saveNewPoemRecord = saveNewPoemRecord;
const getUser = (userId) => __awaiter(void 0, void 0, void 0, function* () { return (yield usersRef.child(userId).once('value')).toJSON(); });
exports.getUser = getUser;
const updateUser = (user) => __awaiter(void 0, void 0, void 0, function* () { return yield usersRef.child(user.id).update(user); });
exports.updateUser = updateUser;
const calculateUserRating = (recordIds) => __awaiter(void 0, void 0, void 0, function* () {
    const votes = [];
    for (let i = 0; i < recordIds.length; i++) {
        const poemRecord = yield getPoemRecord(recordIds[i]);
        if (!poemRecord)
            continue;
        votes.push(poemRecord.rating);
    }
    console.log(votes);
    return Number((votes.reduce((sum, value) => sum + value, 0) / votes.length).toFixed(1));
});
const deletePoemRecord = (userId, recordId) => __awaiter(void 0, void 0, void 0, function* () {
    const recordRef = recordsRef.child(recordId);
    const poemRecord = (yield recordRef.once('value')).toJSON();
    if (!poemRecord || poemRecord.owner !== userId)
        return false;
    recordRef.remove();
    const user = yield getUser(userId);
    if (user && user.records) {
        const arr = Object.values(user.records);
        user.records = arr.filter((id) => id !== recordId);
        user.rating = yield calculateUserRating(arr);
        updateUser(user);
    }
    return true;
});
exports.deletePoemRecord = deletePoemRecord;
const setPoemRecordScore = (recordId, userId, vote) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const poemRecord = yield getPoemRecord(recordId);
    if (!poemRecord)
        return false;
    (_a = poemRecord.votes) !== null && _a !== void 0 ? _a : (poemRecord.votes = {});
    poemRecord.votes[userId] = vote;
    const votes = Object.values(poemRecord.votes);
    poemRecord.rating = Number((votes.reduce((sum, value) => sum + value, 0) / votes.length).toFixed(1));
    yield updatePoemRecord(poemRecord);
    const owner = yield getUser(poemRecord.owner);
    if (owner && owner.records && Object.values(owner.records).includes(recordId)) {
        owner.rating = yield calculateUserRating(Object.values(owner.records));
        updateUser(owner);
    }
    return true;
});
exports.setPoemRecordScore = setPoemRecordScore;
const getPoemRecords = (poemId, offset) => __awaiter(void 0, void 0, void 0, function* () {
    const poemRecords = (yield recordsRef.orderByChild('poem').equalTo(poemId).once('value')).toJSON();
    if (!poemRecords)
        return [];
    const arr = Object.values(poemRecords)
        .sort((a, b) => b.rating - a.rating)
        .slice(offset, offset + 10);
    return arr;
});
exports.getPoemRecords = getPoemRecords;
const getAllPoemRecords = (offset) => __awaiter(void 0, void 0, void 0, function* () {
    const poemRecords = (yield recordsRef.once('value')).toJSON();
    if (!poemRecords)
        return [];
    const arr = Object.values(poemRecords)
        .sort((a, b) => b.rating - a.rating)
        .slice(offset, offset + 10);
    return arr;
});
exports.getAllPoemRecords = getAllPoemRecords;
const getSortedRecords = (records, poemId) => __awaiter(void 0, void 0, void 0, function* () {
    const poemRecords = [];
    console.log(records);
    for (let i = 0; i < records.length; i++) {
        const recordId = records[i];
        const record = yield getPoemRecord(recordId);
        if (!record || (poemId && record.poem !== poemId))
            continue;
        poemRecords.push(record);
    }
    return poemRecords.sort((a, b) => b.rating - a.rating);
});
const getUserRecords = (userId, poemId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield getUser(userId);
    if (!user || !user.records)
        return [];
    return getSortedRecords(Object.values(user.records), poemId);
});
exports.getUserRecords = getUserRecords;
const getAllUserRecords = (offset, poemId) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const usersData = (yield usersRef.once('value')).toJSON();
    if (!usersData)
        return [];
    const users = Object.values(usersData)
        .sort((a, b) => { var _a, _b; return ((_a = b.rating) !== null && _a !== void 0 ? _a : 0) - ((_b = a.rating) !== null && _b !== void 0 ? _b : 0); })
        .slice(offset, offset + 10);
    const usersRecords = [];
    for (const user of users) {
        if (!user.records)
            continue;
        usersRecords.push({ userId: user.id, userRating: (_b = user.rating) !== null && _b !== void 0 ? _b : 0, records: yield getSortedRecords(Object.values(user.records), poemId) });
    }
    return usersRecords;
});
exports.getAllUserRecords = getAllUserRecords;
const reshuffleTodayPoemId = () => __awaiter(void 0, void 0, void 0, function* () {
    do {
        todayPoemId = String(Math.ceil(Math.random() * 49000));
        console.log('try ', todayPoemId);
    } while (!(yield poemIsExists(todayPoemId)));
    console.log('todayPoemId >', todayPoemId);
});
exports.reshuffleTodayPoemId = reshuffleTodayPoemId;
