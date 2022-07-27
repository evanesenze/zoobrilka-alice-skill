"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atGame1 = void 0;
const extras_1 = require("./extras");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const string_comparison_1 = require("string-comparison");
const atGame1 = new yandex_dialogs_sdk_1.Scene(extras_1.GAME_1_SCENE);
exports.atGame1 = atGame1;
atGame1.command(...extras_1.exitHandler);
atGame1.command(...extras_1.backHandler);
atGame1.command(...extras_1.helpHandler);
atGame1.any((ctx) => {
    const gameData = (0, extras_1.getGame1Data)(ctx.session);
    if (!gameData)
        return (0, extras_1.exitWithError)(ctx, 'gameData not found');
    const [_, hideRow] = gameData.currentPairedRow;
    const rate = string_comparison_1.levenshtein.similarity(ctx.message, hideRow);
    let userScore = gameData.userScore;
    if (rate > 0.6)
        userScore += 1;
    console.log(gameData.pairedRows);
    if (gameData.pairedRows.length < 1) {
        (0, extras_1.deleteGame1Data)(ctx.session);
        (0, extras_1.removeSceneHistory)(ctx.session);
        ctx.enter(extras_1.GAMES_MENU_SCENE);
        return yandex_dialogs_sdk_1.Reply.text(`Игра закончена. Ты знаешь стих на ${((gameData.userScore / gameData.startPairedRowsCount) * 100).toFixed(1)}%.

Для начала новой игры, назови ее номер:
1.)Игра 1.`);
    }
    const currentPairedRow = gameData.pairedRows.pop();
    const text = `Твой текст совпал с оригиналом на ${(rate * 100).toFixed(1)}%.
Текуший счет: ${userScore}.

Вот первая строка следующего блока:
${currentPairedRow[0]}`;
    (0, extras_1.saveGame1Data)(ctx.session, Object.assign(Object.assign({}, gameData), { currentPairedRow, userScore }));
    return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + 'sil <[5000]> Скажи вторую строку.' });
});
