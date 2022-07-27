"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atLearn = void 0;
const extras_1 = require("./extras");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const atLearn = new yandex_dialogs_sdk_1.Scene(extras_1.LEARN_SCENE);
exports.atLearn = atLearn;
const repeatCommand = /повтор|еще|дублировать|продублируй|не.*понял|повторить/;
const repeatBlockCommand = /повтор.*(блок|блог)|еще.*(блок|блог)|дублировать.*(блок|блог)|продублируй.*(блок|блог)|не.*понял.*(блок|блог)/;
const repeatPoemCommand = /повтор.*стих|еще.*стих|дублировать.*стих|продублируй.*стих|не.*понял.*стих|повторить.*стих/;
atLearn.command(repeatPoemCommand, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    if (!learnData)
        return (0, extras_1.exitWithError)(ctx, 'learnData not found');
    console.log('repeat poem');
    const newLearnData = Object.assign(Object.assign({}, learnData), { textType: 'full' });
    (0, extras_1.saveLearnData)(ctx.session, newLearnData);
    const text = (0, extras_1.getPoemText)(newLearnData);
    return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + (0, extras_1.getDelaySendText)(text) });
});
atLearn.command(repeatBlockCommand, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    if (!learnData)
        return (0, extras_1.exitWithError)(ctx, 'learnData not found');
    console.log('repeat poem');
    const newLearnData = Object.assign(Object.assign({}, learnData), { textType: 'block' });
    (0, extras_1.saveLearnData)(ctx.session, newLearnData);
    const text = (0, extras_1.getPoemText)(newLearnData);
    return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + (0, extras_1.getDelaySendText)(text) });
});
atLearn.command(repeatCommand, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    if (!learnData)
        return (0, extras_1.exitWithError)(ctx, 'learnData not found');
    console.log('repeat');
    const text = (0, extras_1.getPoemText)(learnData);
    return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + (0, extras_1.getDelaySendText)(text) });
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
