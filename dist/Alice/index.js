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
exports.alice = void 0;
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const extras_1 = require("./extras");
const Base_1 = require("../Base");
const game1Scene_1 = require("./game1Scene");
const game2Scene_1 = require("./game2Scene");
const gameMenuScene_1 = require("./gameMenuScene");
const learnScene_1 = require("./learnScene");
const poemScene_1 = require("./poemScene");
const setAuthorScene_1 = require("./setAuthorScene");
const setTitleScene_1 = require("./setTitleScene");
const lodash_1 = require("lodash");
const alice = new yandex_dialogs_sdk_1.Alice();
exports.alice = alice;
const findCommand = /новый|новое|другое|найти|поиск|искать|ищи|найди|ищу|отыскать/;
const leranCommand = /продолжи|учи|зубрить|запоминать/;
const dayPoemCommand = /стих дня|стихотворение дня/;
alice.command('', (ctx) => {
    const c = ctx;
    const learnData = (0, extras_1.getOldLearnData)(c.session);
    return yandex_dialogs_sdk_1.Reply.text(`Добро пожаловать в "Зубрилку".
${(0, lodash_1.sample)(['Здесь ты можешь выучить стихотворение.', 'Я помогу тебе выучить стихотворение.'])}${learnData ? "\nСкажи 'Учить', чтобы продолжить учить." : ''}
Скажи 'Найти', чтобы начать поиск стиха.
Скажи 'Cтих дня', чтобы посмотреть стих дня.
Скажи 'Помощь' в любом месте, чтобы получить помощь.`);
});
alice.command(findCommand, (ctx) => {
    const c = ctx;
    (0, extras_1.addSceneHistory)(c.session, extras_1.SET_AUTHOR_SCENE);
    c.enter(extras_1.SET_AUTHOR_SCENE);
    const message = String((0, lodash_1.sample)(extras_1.sceneMessages[extras_1.SET_AUTHOR_SCENE]));
    return yandex_dialogs_sdk_1.Reply.text(message);
});
alice.command(leranCommand, (ctx) => {
    const c = ctx;
    const learnData = (0, extras_1.getOldLearnData)(c.session);
    if (!learnData) {
        (0, extras_1.addSceneHistory)(c.session, extras_1.SET_AUTHOR_SCENE);
        c.enter(extras_1.SET_AUTHOR_SCENE);
        return yandex_dialogs_sdk_1.Reply.text('Ты ещё не начал учить стихотворение с "Зубрилкой".\nДавай найдем новый стих. Назови автора');
    }
    (0, extras_1.addSceneHistory)(c.session, extras_1.LEARN_SCENE);
    const { poem } = learnData;
    const poemText = (0, extras_1.getPoemText)(learnData);
    const text = `Продолжаем учить стих ${(0, extras_1.getAuthorName)(poem.author)} - ${poem.title}.

${poemText}`;
    c.enter(extras_1.LEARN_SCENE);
    return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + (0, extras_1.getDelaySendText)(poemText) });
});
alice.command(dayPoemCommand, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const c = ctx;
    const poem = yield (0, Base_1.getTodayPoem)();
    if (!poem)
        return yandex_dialogs_sdk_1.Reply.text('К сожалению, сегодня не день стихов');
    (0, extras_1.addSceneHistory)(c.session, extras_1.POEM_SCENE);
    c.enter(extras_1.POEM_SCENE);
    const text = `Стих дня ${(0, extras_1.getAuthorName)(poem.author)} - ${poem.title}.\n\n`;
    (0, extras_1.saveFindData)(c.session, { author: poem.author, items: [], poems: [poem], title: poem.title, selectedPoemId: 0 });
    const newLearnData = (0, extras_1.getNewLearnData)(poem, 'full', -1, -1);
    if (!newLearnData)
        return yandex_dialogs_sdk_1.Reply.text('К сожалению, сегодня не день стихов');
    const poemText = (0, extras_1.getPoemText)(newLearnData);
    return yandex_dialogs_sdk_1.Reply.text({ text: text + poemText, tts: text + 'Скажи "Прочитай", чтобы я его озвучил.\nСкажи "Учить", чтобы начать учить.\nСкажи "Поиск", чтобы найти другой стих.' });
}));
// alice.command('лог', (ctx) => {
//   const c = ctx as IStageContext;
//   enableLogging(c.session);
//   return Reply.text('Логирование влючено\nТвой ид:\n' + c.userId);
// });
alice.command(...extras_1.exitHandler);
alice.command(...extras_1.helpHandler);
alice.any(() => yandex_dialogs_sdk_1.Reply.text(String((0, lodash_1.sample)(extras_1.sceneHints['MENU']))));
alice.on('response', (ctx) => {
    const c = ctx;
    if (!(0, extras_1.loggingIsEnable)(c.session))
        return;
    (0, Base_1.saveLog)(c.userId, (0, extras_1.getAllSessionData)(c.session));
});
alice.registerScene(learnScene_1.atLearn);
alice.registerScene(poemScene_1.atPoemScene);
alice.registerScene(setAuthorScene_1.atSetAuthor);
alice.registerScene(setTitleScene_1.atSetTitle);
alice.registerScene(gameMenuScene_1.atGameMenu);
alice.registerScene(game1Scene_1.atGame1);
alice.registerScene(game2Scene_1.atGame2);
