"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atPoemScene = void 0;
const extras_1 = require("./extras");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const lodash_1 = require("lodash");
const atPoemScene = new yandex_dialogs_sdk_1.Scene(extras_1.POEM_SCENE);
exports.atPoemScene = atPoemScene;
atPoemScene.command(...extras_1.exitHandler);
atPoemScene.command(...extras_1.backHandler);
atPoemScene.command(...extras_1.helpHandler);
atPoemScene.command(/прочитай/gi, (ctx) => {
    const findData = (0, extras_1.getFindData)(ctx.session);
    if (!findData)
        return yandex_dialogs_sdk_1.Reply.text('Сейчас вы не можете это сделать');
    const { selectedPoem } = findData;
    if (!selectedPoem)
        return yandex_dialogs_sdk_1.Reply.text('Сейчас вы не можете это сделать');
    const newLearnData = (0, extras_1.getNewLearnData)(selectedPoem, 'full', -1, -1);
    if (!newLearnData)
        return yandex_dialogs_sdk_1.Reply.text('Сейчас вы не можете это сделать');
    const poemText = (0, extras_1.getPoemText)(newLearnData) + '.Что хотите делать дальше?';
    return yandex_dialogs_sdk_1.Reply.text({ text: '', tts: poemText });
});
atPoemScene.command(/учить/gi, (ctx) => {
    const findData = (0, extras_1.getFindData)(ctx.session);
    if (!findData)
        return yandex_dialogs_sdk_1.Reply.text('Сейчас вы не можете это сделать');
    const { selectedPoem } = findData;
    if (!selectedPoem)
        return yandex_dialogs_sdk_1.Reply.text('Сейчас вы не можете это сделать');
    const learnData = (0, extras_1.getNewLearnData)(selectedPoem, 'row');
    if (!learnData)
        return yandex_dialogs_sdk_1.Reply.text('Сейчас вы не можете это сделать');
    const text = (0, extras_1.getPoemText)(learnData);
    (0, extras_1.saveLearnData)(ctx.session, learnData);
    (0, extras_1.addSceneHistory)(ctx.session, extras_1.LEARN_SCENE);
    ctx.enter(extras_1.LEARN_SCENE);
    return yandex_dialogs_sdk_1.Reply.text('Повтори строку.\nСкажи "Дальше", чтобы перейти к следующей строке\n\n' + text, { end_session: true });
});
atPoemScene.command(/поиск/gi, (ctx) => {
    (0, extras_1.deleteFindData)(ctx.session);
    const text = String((0, lodash_1.sample)(extras_1.sceneMessages[extras_1.SET_AUTHOR_SCENE]));
    (0, extras_1.cleanSceneHistory)(ctx.session);
    (0, extras_1.addSceneHistory)(ctx.session, extras_1.SET_AUTHOR_SCENE);
    ctx.enter(extras_1.SET_AUTHOR_SCENE);
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atPoemScene.any(extras_1.helpHandler[1]);
