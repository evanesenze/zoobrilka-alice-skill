"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atPoemScene = void 0;
const extras_1 = require("./extras");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const lodash_1 = require("lodash");
const atPoemScene = new yandex_dialogs_sdk_1.Scene(extras_1.POEM_SCENE);
exports.atPoemScene = atPoemScene;
const startLearnCommand = /начать|старт|начало|начинаем|открыть|приступить|обновить|сделать|пойти|пуск|запуск/;
const voicePoemCommand = /прочитай|прочти|зачитай|читай|читать|произнеси|прочитать|изложи|изложить/;
const leranCommand = /продолжи|учи|зубрить|запоминать/;
const findCommand = /новый|новое|другое|найти|поиск|искать|ищи|найди|ищу|отыскать/;
const gameCommand = /игра/;
const recordCommand = /запомни|запиши|запись|записать|диктофон|аудиозапись|записывать|запишет|запомнить/;
atPoemScene.command(voicePoemCommand, (ctx) => {
    const findData = (0, extras_1.getFindData)(ctx.session);
    if (!findData)
        return (0, extras_1.exitWithError)(ctx, 'findData not found');
    const { selectedPoemId, poems } = findData;
    if (selectedPoemId === undefined)
        return (0, extras_1.exitWithError)(ctx, 'selectedPoemId not found');
    const newLearnData = (0, extras_1.getNewLearnData)(poems[selectedPoemId], 'full', -1, -1);
    if (!newLearnData)
        return (0, extras_1.exitWithError)(ctx, 'newLearnData not found');
    const poemText = (0, extras_1.getPoemText)(newLearnData);
    return yandex_dialogs_sdk_1.Reply.text({ text: poemText, tts: poemText + '.Что хотите делать дальше?' });
});
atPoemScene.command(leranCommand, () => {
    return yandex_dialogs_sdk_1.Reply.text(`Я буду произносить строку и давать время на ее повторение.
По команде "Дальше", мы перейдем к следующей строке.
По командам: "Повтори","Повтори блок" или "Повтори стих", я повторю текст еще раз.
Скажи "Начать", чтобы преступить к заучиванию.`);
});
atPoemScene.command(startLearnCommand, (ctx) => {
    const findData = (0, extras_1.getFindData)(ctx.session);
    if (!findData)
        return (0, extras_1.exitWithError)(ctx, 'findData not found');
    const { selectedPoemId, poems } = findData;
    if (selectedPoemId === undefined)
        return (0, extras_1.exitWithError)(ctx, 'selectedPoemId not found');
    const learnData = (0, extras_1.getNewLearnData)(poems[selectedPoemId], 'row');
    if (!learnData)
        return (0, extras_1.exitWithError)(ctx, 'learnData not found');
    const poemText = (0, extras_1.getPoemText)(learnData);
    const text = 'Повтори новую строку.\n\n' + poemText;
    (0, extras_1.saveLearnData)(ctx.session, learnData);
    (0, extras_1.addSceneHistory)(ctx.session, extras_1.LEARN_SCENE);
    ctx.enter(extras_1.LEARN_SCENE);
    return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + (0, extras_1.getDelaySendText)(poemText) });
});
atPoemScene.command(findCommand, (ctx) => {
    (0, extras_1.deleteFindData)(ctx.session);
    const text = String((0, lodash_1.sample)(extras_1.sceneMessages[extras_1.SET_AUTHOR_SCENE]));
    (0, extras_1.cleanSceneHistory)(ctx.session);
    (0, extras_1.addSceneHistory)(ctx.session, extras_1.SET_AUTHOR_SCENE);
    ctx.enter(extras_1.SET_AUTHOR_SCENE);
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atPoemScene.command(recordCommand, (ctx) => {
    const findData = (0, extras_1.getFindData)(ctx.session);
    if (!findData)
        return (0, extras_1.exitWithError)(ctx, 'findData not found');
    const { selectedPoemId, poems } = findData;
    if (selectedPoemId === undefined)
        return (0, extras_1.exitWithError)(ctx, 'selectedPoemId not found');
    const buttons = [yandex_dialogs_sdk_1.Markup.button({ title: 'Перейти на сайт', hide: true, url: `https://zoobrilka-skill.web.app/poem/${poems[selectedPoemId].id}` })];
    return yandex_dialogs_sdk_1.Reply.text('К сожалению, я не умею записывать голос. Перейди на сайт: https://zoobrilka-skill.web.app', { buttons });
});
atPoemScene.command(gameCommand, (ctx) => {
    const findData = (0, extras_1.getFindData)(ctx.session);
    if (!findData || findData.selectedPoemId === undefined)
        return (0, extras_1.exitWithError)(ctx, 'findData not found');
    const selectedPoem = findData.poems[findData.selectedPoemId];
    const rows = selectedPoem.text.replace(/\n\n/g, '\n').split('\n');
    (0, extras_1.saveGamesData)(ctx.session, { selectedPoem, rows });
    (0, extras_1.addSceneHistory)(ctx.session, extras_1.GAMES_MENU_SCENE);
    ctx.enter(extras_1.GAMES_MENU_SCENE);
    const text = String((0, lodash_1.sample)(extras_1.sceneMessages['GAMES_MENU_SCENE']));
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atPoemScene.command(...extras_1.exitHandler);
atPoemScene.command(...extras_1.backHandler);
atPoemScene.command(...extras_1.helpHandler);
atPoemScene.any(extras_1.helpHandler[1]);
