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
const nextCommand = /дальше|далее|потом|следующее|вперед|перейти.*к.*следующему|следующий|дальнейший/;
const skipCommand = /пропусти|пропуск|опустить/;
atSetAuthor.command(nextCommand, (ctx) => {
    const findData = (0, extras_1.getFindData)(ctx.session);
    if (!(findData === null || findData === void 0 ? void 0 : findData.author))
        return yandex_dialogs_sdk_1.Reply.text('Автор не задан.\nСкажите "Пропустить", если не хотите указывать автора.');
    (0, extras_1.addSceneHistory)(ctx.session, extras_1.SET_TITLE_SCENE);
    ctx.enter(extras_1.SET_TITLE_SCENE);
    return yandex_dialogs_sdk_1.Reply.text(`Автор ${(0, extras_1.getAuthorName)(findData.author)} задан.\nТеперь скажи название.`);
});
atSetAuthor.command(skipCommand, (ctx) => {
    (0, extras_1.addSceneHistory)(ctx.session, extras_1.SET_TITLE_SCENE);
    (0, extras_1.saveFindData)(ctx.session, { author: null, title: '', poems: [], items: [] });
    ctx.enter(extras_1.SET_TITLE_SCENE);
    return yandex_dialogs_sdk_1.Reply.text('Скажи название.');
});
atSetAuthor.command(...extras_1.exitHandler);
atSetAuthor.command(...extras_1.backHandler);
atSetAuthor.command(...extras_1.helpHandler);
atSetAuthor.any((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const entities = (_a = ctx.nlu) === null || _a === void 0 ? void 0 : _a.entities;
    const author = (0, extras_1.extractAuthor)(entities);
    const text = `Автор: ${author ? (0, extras_1.getAuthorName)(author) : 'Не задан'}.`;
    const tts = text + 'Если я правильно тебя понял, скажи "Дальше", если нет - попробуй сказать по-другому.';
    (0, extras_1.saveFindData)(ctx.session, { title: '', author, poems: [], items: [] });
    return yandex_dialogs_sdk_1.Reply.text({ text: text + "\nСкажи 'Дальше' или 'Пропустить', чтобы продолжить.", tts });
}));
