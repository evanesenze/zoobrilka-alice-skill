"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atLearn = void 0;
const extras_1 = require("./extras");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const string_comparison_1 = require("string-comparison");
const atLearn = new yandex_dialogs_sdk_1.Scene(extras_1.LEARN_SCENE);
exports.atLearn = atLearn;
atLearn.command(/дальше/gi, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    console.log('currentBlock is complited');
    console.log(learnData);
    const { currentBlock, poem } = learnData;
    if (!currentBlock.complited) {
        const poemText = (0, extras_1.getPoemText)(learnData);
        const text = 'Текущий блок еще не выучен.\nПродолжай учить:\n\n' + poemText;
        return yandex_dialogs_sdk_1.Reply.text({ text, tts: 'Сначала выучи текущий блок!\n' + text });
    }
    const nextLearnData = (0, extras_1.getNewLearnData)(poem, 'row', currentBlock.index + 1, 0);
    if (!nextLearnData) {
        ctx.leave();
        return yandex_dialogs_sdk_1.Reply.text('Вернулись в меню');
    }
    (0, extras_1.saveLearnData)(ctx.session, nextLearnData);
    const text = 'Повтори строку:\n\n' + (0, extras_1.getPoemText)(nextLearnData);
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atLearn.command(/повторить стих/gi, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    console.log('repeat poem');
    const text = 'Повтори стих:\n\n' + (0, extras_1.getPoemText)(Object.assign(Object.assign({}, learnData), { textType: 'full' }));
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atLearn.command(/повторить блок/gi, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    console.log('repeat poem');
    const text = 'Повтори блок:\n\n' + (0, extras_1.getPoemText)(Object.assign(Object.assign({}, learnData), { textType: 'block' }));
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atLearn.command(/продолжить/gi, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    const poemText = (0, extras_1.getPoemText)(learnData);
    if (!learnData.errorCount)
        return yandex_dialogs_sdk_1.Reply.text('Ты не допустили ни одной ошибки. Продолжай учить:\n\n' + poemText);
    return (0, extras_1.goLearnNext)(ctx, Object.assign(Object.assign({}, learnData), { errorCount: 0 }));
});
atLearn.any((ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    const poemText = (0, extras_1.getPoemText)(learnData);
    const matchDigit = string_comparison_1.levenshtein.similarity(poemText.toLowerCase(), ctx.message.toLowerCase());
    // console.log(matchDigit);
    // return goLearnNext(ctx, learnData);
    if (matchDigit > 0.5) {
        return (0, extras_1.goLearnNext)(ctx, learnData);
    }
    else {
        (0, extras_1.saveLearnData)(ctx.session, Object.assign(Object.assign({}, learnData), { errorCount: learnData.errorCount + 1 }));
        const matchText = `Твой текст совпал на ${(matchDigit * 100).toFixed(1)}%.`;
        return yandex_dialogs_sdk_1.Reply.text({ text: `${matchText} Повтори еще раз\n\n${poemText}`, tts: `${matchText} Скажи "Продолжить", чтобы учить дальше или повтори текст: \n\n${poemText}` });
    }
});
atLearn.command(...extras_1.exitHandler);
atLearn.command(...extras_1.backHandler);
