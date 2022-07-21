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
exports.atFindMenu = void 0;
const extras_1 = require("./extras");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const Base_1 = require("../Base");
const atFindMenu = new yandex_dialogs_sdk_1.Scene(extras_1.FIND_MENU_SCENE);
exports.atFindMenu = atFindMenu;
atFindMenu.command(/рейтинг/gi, () => yandex_dialogs_sdk_1.Reply.text('Рейтинг стихов можешь посмотреть на сайте', { buttons: [yandex_dialogs_sdk_1.Markup.button({ url: 'https://www.google.com', title: 'Перейти на сайт' })] }));
atFindMenu.command(...extras_1.exitHandler);
//
atFindMenu.command(...extras_1.backHandler);
atFindMenu.any((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const entities = (_a = ctx.nlu) === null || _a === void 0 ? void 0 : _a.entities;
    const { title, author } = (0, extras_1.extractTitleAndAuthor)(ctx.message, entities);
    const authorName = (0, extras_1.getAuthorName)(author);
    const text = `Параметры поиска:
Автор: ${authorName !== null && authorName !== void 0 ? authorName : 'Не задан'}
Название: ${title}`;
    const items = yield (0, Base_1.searchPoems)(author, title);
    let tts = 'Ничего не смог найти. Попробуй сказать по-другому';
    const buttons = items.map(({ title, author }, i) => yandex_dialogs_sdk_1.Markup.button(`${i + 1}). ${(0, extras_1.getAuthorName)(author)} | ${title}`.substring(0, 128)));
    if (buttons.length) {
        tts = 'Вот что я нашел. Для выбора, скажи номер или название. Или скажи "Поиск", чтобы вернуться к поиску.';
        (0, extras_1.saveSelectListData)(ctx.session, { items });
        ctx.enter(extras_1.SELECT_LIST_SCENE);
    }
    return yandex_dialogs_sdk_1.Reply.text({ text, tts }, { buttons });
}));
