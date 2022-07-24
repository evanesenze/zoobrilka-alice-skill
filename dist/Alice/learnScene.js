"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atLearn = void 0;
const extras_1 = require("./extras");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const atLearn = new yandex_dialogs_sdk_1.Scene(extras_1.LEARN_SCENE);
exports.atLearn = atLearn;
// atLearn.command(/дальше/gi, (ctx) => {
// if (!learnData) return Reply.text('Вы не можете этого сделать');
// const { currentBlock, poem, textType } = learnData;
// if (textType === 'row') {
//   const poemText = getPoemText(learnData);
//   const text = 'Текущая строка еще не выучена.\nПродолжай учить:\n\n' + poemText;
//   return Reply.text({ text, tts: 'Сначала выучи текущий блок!\n' + text });
// }
// const nextLearnData = getNewLearnData(poem, 'row', currentBlock.index + 1, 0);
// if (!nextLearnData) {
//   ctx.leave();
//   return Reply.text('Вернулись в меню');
// }
// saveLearnData(ctx.session, nextLearnData);
// const text = 'Повтори новую строку:\n\n' + getPoemText(nextLearnData);
// return Reply.text(text);
// });
atLearn.command(/повторить стих/gi, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    if (!learnData)
        return yandex_dialogs_sdk_1.Reply.text('Вы не можете этого сделать');
    console.log('repeat poem');
    const newLearnData = Object.assign(Object.assign({}, learnData), { textType: 'full' });
    const text = 'Повтори стих.\nСкажи "Дальше", чтобы продолжить учить\n\n' + (0, extras_1.getPoemText)(newLearnData);
    (0, extras_1.saveLearnData)(ctx.session, newLearnData);
    return yandex_dialogs_sdk_1.Reply.text(text, { end_session: true });
});
atLearn.command(/повторить блок/gi, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    if (!learnData)
        return yandex_dialogs_sdk_1.Reply.text('Вы не можете этого сделать');
    console.log('repeat poem');
    const newLearnData = Object.assign(Object.assign({}, learnData), { textType: 'block' });
    const text = 'Повтори блок.\nСкажи "Дальше", чтобы продолжить учить\n\n' + (0, extras_1.getPoemText)(newLearnData);
    (0, extras_1.saveLearnData)(ctx.session, newLearnData);
    return yandex_dialogs_sdk_1.Reply.text(text, { end_session: true });
});
atLearn.command(/повторить/, (ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    if (!learnData)
        return yandex_dialogs_sdk_1.Reply.text('Вы не можете этого сделать');
    console.log('repeat');
    const text = 'Повтори.Скажи "Дальше", чтобы продолжить учить\n\n' + (0, extras_1.getPoemText)(learnData);
    return yandex_dialogs_sdk_1.Reply.text(text, { end_session: true });
});
// atLearn.command(/продолжить/gi, (ctx) => {
//   const learnData = getOldLearnData(ctx.session);
//   if (!learnData) return Reply.text('Вы не можете этого сделать');
//   const poemText = getPoemText(learnData);
//   if (!learnData.errorCount) return Reply.text('Ты не допустили ни одной ошибки. Продолжай учить:\n\n' + poemText);
//   return goLearnNext(ctx, { ...learnData, errorCount: 0 });
// });
atLearn.command(...extras_1.exitHandler);
atLearn.command(...extras_1.backHandler);
atLearn.command(...extras_1.helpHandler);
atLearn.any((ctx) => {
    const learnData = (0, extras_1.getOldLearnData)(ctx.session);
    if (!learnData) {
        ctx.leave();
        return yandex_dialogs_sdk_1.Reply.text('Вернулись в меню');
    }
    return (0, extras_1.goLearnNext)(ctx, learnData);
});
