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
exports.atSetTitle = void 0;
const extras_1 = require("./extras");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const Base_1 = require("../Base");
const atSetTitle = new yandex_dialogs_sdk_1.Scene(extras_1.SET_TITLE_SCENE);
exports.atSetTitle = atSetTitle;
atSetTitle.command(...extras_1.exitHandler);
atSetTitle.command(...extras_1.backHandler);
atSetTitle.command(...extras_1.helpHandler);
atSetTitle.any((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const entities = (_a = ctx.nlu) === null || _a === void 0 ? void 0 : _a.entities;
    const findData = (0, extras_1.getFindData)(ctx.session);
    if (!findData)
        return yandex_dialogs_sdk_1.Reply.text('Сейчас вы не можете это сделать');
    if ((entities === null || entities === void 0 ? void 0 : entities.length) && findData.items.length) {
        const numbers = entities.filter((item) => item.type === 'YANDEX.NUMBER');
        if (numbers.length) {
            if (!findData)
                return yandex_dialogs_sdk_1.Reply.text('error');
            const { poems } = findData;
            const itemNumbers = poems.map((_, i) => i + 1);
            const currentNumber = (_b = numbers.find((item) => itemNumbers.includes(Number(item.value)))) === null || _b === void 0 ? void 0 : _b.value;
            const selectedPoemId = poems.findIndex((_, i) => i + 1 === currentNumber);
            if (selectedPoemId !== -1) {
                const poem = poems[selectedPoemId];
                const newLearnData = (0, extras_1.getNewLearnData)(poem, 'full', -1, -1);
                if (!newLearnData) {
                    ctx.leave();
                    return yandex_dialogs_sdk_1.Reply.text('Вышли назад');
                }
                (0, extras_1.saveFindData)(ctx.session, Object.assign(Object.assign({}, findData), { selectedPoemId }));
                const poemText = (0, extras_1.getPoemText)(newLearnData);
                const text = `Ты выбрал ${(0, extras_1.getAuthorName)(poem.author)} - ${poem.title}.\n\n`;
                (0, extras_1.addSceneHistory)(ctx.session, extras_1.POEM_SCENE);
                ctx.enter(extras_1.POEM_SCENE);
                return yandex_dialogs_sdk_1.Reply.text({ text: text + poemText, tts: text + 'Скажи "Прочитай", чтобы я его озвучил.\nСкажи "Учить", чтобы начать учить.\nСкажи "Поиск", чтобы начать поиск заново.' });
            }
        }
    }
    const poems = yield (0, Base_1.searchPoems)((_c = findData === null || findData === void 0 ? void 0 : findData.author) !== null && _c !== void 0 ? _c : undefined, ctx.message);
    let text = `Автор: ${(findData === null || findData === void 0 ? void 0 : findData.author) ? (0, extras_1.getAuthorName)(findData.author) : 'Не задан'}.
Название: ${ctx.message}.`;
    if (poems.length) {
        const items = poems.map(({ title, author }, i) => `${i + 1}). ${(0, extras_1.getAuthorName)(author, true)} - ${title}.`.substring(0, 128));
        const itemsText = items.reduce((res, item) => (res += `\n${item}`), '\nВот что я нашел:');
        text += itemsText + '\nДля выбора назови номер стиха.';
        (0, extras_1.saveFindData)(ctx.session, Object.assign(Object.assign({}, findData), { title: ctx.message, poems, items }));
        return yandex_dialogs_sdk_1.Reply.text(text);
    }
    else {
        text += '\nНичего не смог найти. Скажи название по-другому';
        return yandex_dialogs_sdk_1.Reply.text({ text });
    }
}));
