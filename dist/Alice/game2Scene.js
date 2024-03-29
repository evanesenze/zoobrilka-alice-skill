"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atGame2 = void 0;
const extras_1 = require("./extras");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const string_comparison_1 = require("string-comparison");
const atGame2 = new yandex_dialogs_sdk_1.Scene(extras_1.GAME_2_SCENE);
exports.atGame2 = atGame2;
atGame2.command(...extras_1.exitHandler);
atGame2.command(...extras_1.backHandler);
atGame2.command(...extras_1.helpHandler);
atGame2.any((ctx) => {
    const gameData = (0, extras_1.getGame2Data)(ctx.session);
    if (!gameData)
        return (0, extras_1.exitWithError)(ctx, 'gameData not found');
    console.log(ctx.message);
    console.log(gameData.currentItem.words.join(' '));
    const rate = string_comparison_1.levenshtein.similarity(ctx.message, gameData.currentItem.words.join(' '));
    let userScore = gameData.userScore;
    if (rate > 0.8)
        userScore += 1;
    console.log(gameData.items);
    if (gameData.items.length === 0) {
        (0, extras_1.deleteGame2Data)(ctx.session);
        (0, extras_1.removeSceneHistory)(ctx.session);
        ctx.enter(extras_1.GAMES_MENU_SCENE);
        return yandex_dialogs_sdk_1.Reply.text(`Твой текст совпал с оригиналом на ${Math.round(rate * 100)}%.
Игра закончена. Ты знаешь стих на ${Math.round((gameData.userScore / gameData.startItemsCount) * 100)}%.

Для начала новой игры, назови ее номер:
1.)Игра "Продолжи строки".
2.)Игра "Заполни пропуски".`);
    }
    const currentItem = gameData.items.pop();
    const text = `Твой текст совпал с оригиналом на ${Math.round(rate * 100)}%.
Текущий счет: ${userScore}.

Вот строка следующего блока с закрытыми словами:`;
    (0, extras_1.saveGame2Data)(ctx.session, Object.assign(Object.assign({}, gameData), { currentItem, userScore }));
    return yandex_dialogs_sdk_1.Reply.text({ text: text + '\n' + currentItem.replacedText, tts: text + currentItem.replacedText.replace(/(_+)/g, 'Пропущенное слово.') + 'sil <[5000]> Скажи полный текст.' });
});
