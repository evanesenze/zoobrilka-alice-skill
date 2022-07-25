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
atPoemScene.command(/прочитай|читай|прочитать/, (ctx) => {
    const findData = (0, extras_1.getFindData)(ctx.session);
    if (!findData)
        return (0, extras_1.exitWithError)(ctx, 'findData not found');
    const { selectedPoemId, poems } = findData;
    if (!selectedPoemId)
        return (0, extras_1.exitWithError)(ctx, 'selectedPoemId not found');
    const newLearnData = (0, extras_1.getNewLearnData)(poems[selectedPoemId], 'full', -1, -1);
    if (!newLearnData)
        return (0, extras_1.exitWithError)(ctx, 'newLearnData not found');
    const poemText = (0, extras_1.getPoemText)(newLearnData);
    return yandex_dialogs_sdk_1.Reply.text({ text: poemText, tts: poemText + '.Что хотите делать дальше?' });
});
atPoemScene.command(/учить/, () => {
    return yandex_dialogs_sdk_1.Reply.text(`Я буду произносить строку и давать время на ее повторение.
По команде "Дальше", мы перейдем к следующей строке.
По командам: "Повтори","Повтори блок" или "Повтори стих", я повторю текст еще раз.
Скажи "Начать", чтобы преступить к заучиванию.`);
});
atPoemScene.command(/начать/, (ctx) => {
    const findData = (0, extras_1.getFindData)(ctx.session);
    if (!findData)
        return (0, extras_1.exitWithError)(ctx, 'findData not found');
    const { selectedPoemId, poems } = findData;
    if (selectedPoemId === undefined)
        return (0, extras_1.exitWithError)(ctx, 'selectedPoemId not found');
    const learnData = (0, extras_1.getNewLearnData)(poems[selectedPoemId], 'row');
    if (!learnData)
        return (0, extras_1.exitWithError)(ctx, 'learnData not found');
    const text = 'Повтори новую строку.\n' + (0, extras_1.getPoemText)(learnData);
    (0, extras_1.saveLearnData)(ctx.session, learnData);
    (0, extras_1.addSceneHistory)(ctx.session, extras_1.LEARN_SCENE);
    ctx.enter(extras_1.LEARN_SCENE);
    return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + 'sil <[10000]> Скажи "Дальше", чтобы перейти к следующей строке' });
});
atPoemScene.command(/поиск/, (ctx) => {
    (0, extras_1.deleteFindData)(ctx.session);
    const text = String((0, lodash_1.sample)(extras_1.sceneMessages[extras_1.SET_AUTHOR_SCENE]));
    (0, extras_1.cleanSceneHistory)(ctx.session);
    (0, extras_1.addSceneHistory)(ctx.session, extras_1.SET_AUTHOR_SCENE);
    ctx.enter(extras_1.SET_AUTHOR_SCENE);
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atPoemScene.any(extras_1.helpHandler[1]);
