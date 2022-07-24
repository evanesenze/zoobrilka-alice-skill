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
exports.atSetAuthor = void 0;
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const extras_1 = require("./extras");
const atSetAuthor = new yandex_dialogs_sdk_1.Scene(extras_1.SET_AUTHOR_SCENE);
exports.atSetAuthor = atSetAuthor;
atSetAuthor.command(...extras_1.exitHandler);
atSetAuthor.command(...extras_1.backHandler);
atSetAuthor.command(...extras_1.helpHandler);
atSetAuthor.command(/дальше/gi, (ctx) => {
    (0, extras_1.addSceneHistory)(ctx.session, extras_1.SET_TITLE_SCENE);
    ctx.enter(extras_1.SET_TITLE_SCENE);
    return yandex_dialogs_sdk_1.Reply.text('Автор задан. Теперь скажи название.');
});
atSetAuthor.command(/пропустить/gi, (ctx) => {
    (0, extras_1.addSceneHistory)(ctx.session, extras_1.SET_TITLE_SCENE);
    (0, extras_1.saveFindData)(ctx.session, { author: { firstName: '', lastName: '' }, title: '', poems: [], items: [] });
    ctx.enter(extras_1.SET_TITLE_SCENE);
    return yandex_dialogs_sdk_1.Reply.text('Скажи название.');
});
atSetAuthor.any((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const entities = (_a = ctx.nlu) === null || _a === void 0 ? void 0 : _a.entities;
    const author = (0, extras_1.extractAuthor)(entities);
    const authorName = (0, extras_1.getAuthorName)(author);
    console.log(authorName);
    const text = `Автор: ${authorName || 'Не задан'}.
Скажи 'Дальше' или 'Пропустить', чтобы продолжить.`;
    const tts = text + 'Если я правильно тебя понял, скажи "Дальше", если нет - попробуй сказать по-другому.';
    (0, extras_1.saveFindData)(ctx.session, { title: '', author, poems: [], items: [] });
    return yandex_dialogs_sdk_1.Reply.text({ text, tts });
}));
