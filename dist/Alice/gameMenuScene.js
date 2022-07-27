"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atGameMenu = void 0;
const extras_1 = require("./extras");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const lodash_1 = require("lodash");
const games = [''];
const atGameMenu = new yandex_dialogs_sdk_1.Scene(extras_1.GAMES_MENU_SCENE);
exports.atGameMenu = atGameMenu;
atGameMenu.command(...extras_1.exitHandler);
atGameMenu.command(...extras_1.backHandler);
atGameMenu.command(...extras_1.helpHandler);
atGameMenu.command(/начать/, (ctx) => {
    const gamesData = (0, extras_1.getGamesData)(ctx.session);
    if (!gamesData)
        return (0, extras_1.exitWithError)(ctx, 'gamesData not found');
    if (gamesData.selectedGameId === undefined)
        return yandex_dialogs_sdk_1.Reply.text('Сначала выбери игру.');
    const { selectedGameId } = gamesData;
    if (selectedGameId === 1) {
        ctx.enter(extras_1.GAME_1_SCENE);
        (0, extras_1.addSceneHistory)(ctx.session, extras_1.GAME_1_SCENE);
        const game1Data = (0, extras_1.getNewGame1Data)(gamesData);
        if (!game1Data)
            return yandex_dialogs_sdk_1.Reply.text('Данный стих не подходит для этой игры. Выберите другую.');
        (0, extras_1.saveGame1Data)(ctx.session, game1Data);
        const text = `Вот первая строка блока:
    
${game1Data.currentPairedRow[0]}`;
        return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + 'sil <[5000]> Скажи вторую строку.' });
    }
    else {
        (0, extras_1.saveGamesData)(ctx.session, Object.assign(Object.assign({}, gamesData), { selectedGameId: undefined }));
        return yandex_dialogs_sdk_1.Reply.text('Выбранная игра недоступна. Выбери другую');
    }
});
atGameMenu.any((ctx) => {
    var _a;
    const entities = (_a = ctx.nlu) === null || _a === void 0 ? void 0 : _a.entities;
    const gamesData = (0, extras_1.getGamesData)(ctx.session);
    if (!gamesData)
        return (0, extras_1.exitWithError)(ctx, 'gamesData not found');
    if (entities === null || entities === void 0 ? void 0 : entities.length) {
        const numbers = entities.filter((item) => item.type === 'YANDEX.NUMBER' && item.value > 0 && item.value <= games.length);
        if (numbers.length) {
            const number = numbers[0].value;
            console.log(number);
            (0, extras_1.saveGamesData)(ctx.session, Object.assign(Object.assign({}, gamesData), { selectedGameId: number }));
            if (number === 1) {
                const text = String((0, lodash_1.sample)(extras_1.sceneMessages['GAME_1_SCENE']));
                return yandex_dialogs_sdk_1.Reply.text(text);
            }
        }
    }
    const text = String((0, lodash_1.sample)(extras_1.sceneMessages['GAMES_MENU_SCENE']));
    return yandex_dialogs_sdk_1.Reply.text(text);
});
