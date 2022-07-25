"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atLearn = void 0;
const extras_1 = require("./extras");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const atLearn = new yandex_dialogs_sdk_1.Scene(extras_1.LEARN_SCENE);
exports.atLearn = atLearn;
atLearn.command(/повтори.*стих/gi, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    if (!learnData)
        return (0, extras_1.exitWithError)(ctx, 'learnData not found');
    console.log('repeat poem');
    const newLearnData = Object.assign(Object.assign({}, learnData), { textType: 'full' });
    (0, extras_1.saveLearnData)(ctx.session, newLearnData);
    const text = (0, extras_1.getPoemText)(newLearnData);
    return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + 'sil <[10000]> Скажи "Дальше", чтобы перейти к следующей строке' });
});
atLearn.command(/повтори.*(блок|блог)/gi, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    if (!learnData)
        return (0, extras_1.exitWithError)(ctx, 'learnData not found');
    console.log('repeat poem');
    const newLearnData = Object.assign(Object.assign({}, learnData), { textType: 'block' });
    (0, extras_1.saveLearnData)(ctx.session, newLearnData);
    const text = (0, extras_1.getPoemText)(newLearnData);
    return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + 'sil <[10000]> Скажи "Дальше", чтобы перейти к следующей строке' });
});
atLearn.command(/повтори/, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    if (!learnData)
        return (0, extras_1.exitWithError)(ctx, 'learnData not found');
    console.log('repeat');
    const text = (0, extras_1.getPoemText)(learnData);
    return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + 'sil <[10000]> Скажи "Дальше", чтобы перейти к следующей строке' });
});
atLearn.command(...extras_1.exitHandler);
atLearn.command(...extras_1.backHandler);
atLearn.command(...extras_1.helpHandler);
atLearn.any((ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    if (!learnData)
        return (0, extras_1.exitWithError)(ctx, 'learnData not found');
    return (0, extras_1.goLearnNext)(ctx, learnData);
});
