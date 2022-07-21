"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atSelectList = void 0;
const extras_1 = require("./extras");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const Base_1 = require("../Base");
const lodash_1 = require("lodash");
const atSelectList = new yandex_dialogs_sdk_1.Scene(extras_1.SELECT_LIST_SCENE);
exports.atSelectList = atSelectList;
atSelectList.command(/поиск/gi, (ctx) => {
    (0, extras_1.deleteSelectListData)(ctx.session);
    const text = String((0, lodash_1.sample)(extras_1.sceneMessages['FIND_MENU_SCENE']));
    ctx.enter(extras_1.FIND_MENU_SCENE); // !!
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atSelectList.command(/да|учим/gi, (ctx) => {
    const selectListData = (0, extras_1.getSelectListData)(ctx.session);
    const { items, selectedPoem } = selectListData;
    if (!selectedPoem) {
        const buttons = items.map(({ title, author }, i) => yandex_dialogs_sdk_1.Markup.button(`${i + 1}). ${(0, extras_1.getAuthorName)(author)} | ${title}`.substring(0, 128)));
        return yandex_dialogs_sdk_1.Reply.text({ text: 'Выбери стих из списка', tts: 'Сначала выбери стих' }, { buttons });
    }
    const learnData = (0, extras_1.getNewLearnData)(selectedPoem, 'row');
    if (!learnData) {
        ctx.leave();
        return yandex_dialogs_sdk_1.Reply.text('Ошибка.Переход в меню'); // !!
    }
    const text = (0, extras_1.getPoemText)(learnData);
    (0, extras_1.saveLearnData)(ctx.session, learnData);
    (0, extras_1.addSceneHistory)(ctx.session, extras_1.LEARN_SCENE);
    (0, extras_1.deleteSelectListData)(ctx.session);
    ctx.enter(extras_1.LEARN_SCENE);
    return yandex_dialogs_sdk_1.Reply.text('Повтори строку:\n\n' + text);
});
atSelectList.command(/нет|другой/gi, (ctx) => {
    const selectListData = (0, extras_1.getSelectListData)(ctx.session);
    const { items } = selectListData;
    const buttons = items.map(({ title, author }, i) => yandex_dialogs_sdk_1.Markup.button(`${i + 1}). ${(0, extras_1.getAuthorName)(author)} | ${title}`.substring(0, 128)));
    (0, extras_1.saveSelectListData)(ctx.session, { items });
    return yandex_dialogs_sdk_1.Reply.text('Выбери стих из списка', { buttons });
});
atSelectList.command(...extras_1.exitHandler);
atSelectList.command(...extras_1.backHandler);
atSelectList.any((ctx) => {
    var _a, _b;
    const entities = (_a = ctx.nlu) === null || _a === void 0 ? void 0 : _a.entities;
    const selectListData = (0, extras_1.getSelectListData)(ctx.session);
    if (entities === null || entities === void 0 ? void 0 : entities.length) {
        const numbers = entities.filter((item) => item.type === 'YANDEX.NUMBER');
        if (numbers.length) {
            console.log(selectListData);
            if (!selectListData)
                return yandex_dialogs_sdk_1.Reply.text('error');
            const { items } = selectListData;
            const itemNumbers = items.map((_, i) => i + 1);
            console.log(itemNumbers);
            const currentNumber = (_b = numbers.find((item) => itemNumbers.includes(Number(item.value)))) === null || _b === void 0 ? void 0 : _b.value;
            console.log(currentNumber);
            const selectedPoem = items.find((_, i) => i + 1 === currentNumber);
            if (selectedPoem)
                return (0, extras_1.confirmSelectPoem)(ctx, selectedPoem, selectListData);
        }
    }
    const { title, author } = (0, extras_1.extractTitleAndAuthor)(ctx.message, entities);
    const bestMatch = [...selectListData.items].sort((a, b) => (0, Base_1.comparePoem)(a, b, title, author))[0];
    if (bestMatch)
        return (0, extras_1.confirmSelectPoem)(ctx, bestMatch, selectListData);
    const tts = String((0, lodash_1.sample)(extras_1.sceneHints['SELECT_LIST_SCENE']));
    const buttons = selectListData.items.map(({ title, author }, i) => yandex_dialogs_sdk_1.Markup.button(`${i + 1}). ${(0, extras_1.getAuthorName)(author)} | ${title}`.substring(0, 128)));
    return yandex_dialogs_sdk_1.Reply.text({ text: 'Выберите стих из списка:', tts }, { buttons });
});
