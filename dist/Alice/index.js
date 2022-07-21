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
const FindMenuScene_1 = require("./FindMenuScene");
const LearnScene_1 = require("./LearnScene");
const SelectListScene_1 = require("./SelectListScene");
const lodash_1 = require("lodash");
const alice = new yandex_dialogs_sdk_1.Alice();
exports.alice = alice;
alice.command('', () => {
    return yandex_dialogs_sdk_1.Reply.text(`Добро пожаловать в "Зубрилку".
${(0, lodash_1.sample)(['Здесь ты можешь выучить стихотворение.', 'Я помогу тебе выучить стихотворение.'])}
Ты уже знаком с тем, что я умею?`);
});
alice.command(/да|знаком/gi, () => yandex_dialogs_sdk_1.Reply.text(`Итак, что будем учить сегодня?
Скажи "Продолжить", и мы продолжим учить стих.
Скажи "Новое", и мы найдем новый стих.`));
alice.command(/новый|новое|другое|найти|поиск|искать/gi, (ctx) => {
    const c = ctx;
    (0, extras_1.addSceneHistory)(c.session, extras_1.FIND_MENU_SCENE);
    c.enter(extras_1.FIND_MENU_SCENE);
    const message = String((0, lodash_1.sample)(extras_1.sceneMessages['FIND_MENU_SCENE']));
    return yandex_dialogs_sdk_1.Reply.text(message);
});
alice.command(/учить|продолжи/gi, (ctx) => {
    const c = ctx;
    const learnData = (0, extras_1.getOldLearnData)(c.session);
    if (!learnData) {
        (0, extras_1.addSceneHistory)(c.session, extras_1.FIND_MENU_SCENE);
        c.enter(extras_1.FIND_MENU_SCENE);
        return yandex_dialogs_sdk_1.Reply.text('Ты ещё не начал учить стихотворение с "Зубрилкой".\nНазови имя/фамилию автора или название стиха, чтобы начать поиск');
    }
    (0, extras_1.addSceneHistory)(c.session, extras_1.LEARN_SCENE);
    c.enter(extras_1.LEARN_SCENE);
    const { poem } = learnData;
    const poemText = (0, extras_1.getPoemText)(learnData);
    const text = `Продолжаем учить стих ${(0, extras_1.getAuthorName)(poem.author)} - ${poem.title}
Повтори:
${poemText}`;
    return yandex_dialogs_sdk_1.Reply.text(text);
});
alice.command(/запомни|запиши|запись|записать|запомнить/gi, () => yandex_dialogs_sdk_1.Reply.text('К сожалению, я не умею записывать ваш голос. Перейди на сайт', { buttons: [yandex_dialogs_sdk_1.Markup.button({ title: 'Перейти на сайт', hide: true, url: 'https://www.google.com' })] }));
alice.command(/расскажи|умеешь|не/gi, (ctx) => __awaiter(void 0, void 0, void 0, function* () { return extras_1.helpHandler[1](ctx); }));
alice.command(/стих дня/gi, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const c = ctx;
    const poem = yield (0, Base_1.getTodayPoem)();
    if (!poem)
        return yandex_dialogs_sdk_1.Reply.text('К сожалению, сегодня не день стихов');
    return (0, extras_1.confirmSelectPoem)(c, poem, { items: [] }, true);
}));
alice.command('лог', (ctx) => {
    const c = ctx;
    (0, extras_1.enableLogging)(c.session);
    return yandex_dialogs_sdk_1.Reply.text('Логирование влючено\nТвой ид:\n' + c.userId);
});
alice.command(...extras_1.exitHandler);
alice.command(...extras_1.helpHandler);
alice.any((ctx) => {
    const c = ctx;
    const currentScene = (0, extras_1.getCurrentScene)(c.session);
    if (!currentScene)
        return yandex_dialogs_sdk_1.Reply.text('К сожалению я не понял, что вы хотели сказать, повторите пожалуйста.');
    const hint = String((0, lodash_1.sample)(extras_1.sceneHints[currentScene]));
    return yandex_dialogs_sdk_1.Reply.text(hint);
});
alice.on('response', (ctx) => {
    const c = ctx;
    if (!(0, extras_1.loggingIsEnable)(c.session))
        return;
    (0, Base_1.saveLog)(c.userId, (0, extras_1.getAllSessionData)(c.session));
});
// registerLearnScene(alice, LEARN_SCENE);
alice.registerScene(LearnScene_1.atLearn);
alice.registerScene(FindMenuScene_1.atFindMenu);
alice.registerScene(SelectListScene_1.atSelectList);
