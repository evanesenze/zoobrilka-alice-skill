import { LEARN_SCENE, backHandler, exitHandler, getNewLearnData, getOldLearnData, getPoemText, goLearnNext, helpHandler, saveLearnData } from './extras';
import { Reply, Scene } from 'yandex-dialogs-sdk';
import { levenshtein } from 'string-comparison';

const atLearn = new Scene(LEARN_SCENE);

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
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return Reply.text('Вы не можете этого сделать');
  console.log('repeat poem');
  const newLearnData: ILearnData = { ...learnData, textType: 'full' };
  const text = 'Повтори стих.\nСкажи "Дальше", чтобы продолжить учить\n\n' + getPoemText(newLearnData);
  saveLearnData(ctx.session, newLearnData);
  return Reply.text(text, { end_session: true });
});

atLearn.command(/повторить блок/gi, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return Reply.text('Вы не можете этого сделать');
  console.log('repeat poem');
  const newLearnData: ILearnData = { ...learnData, textType: 'block' };
  const text = 'Повтори блок.\nСкажи "Дальше", чтобы продолжить учить\n\n' + getPoemText(newLearnData);
  saveLearnData(ctx.session, newLearnData);
  return Reply.text(text, { end_session: true });
});

atLearn.command(/повторить/, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return Reply.text('Вы не можете этого сделать');
  console.log('repeat');
  const text = 'Повтори.Скажи "Дальше", чтобы продолжить учить\n\n' + getPoemText(learnData);
  return Reply.text(text, { end_session: true });
});

// atLearn.command(/продолжить/gi, (ctx) => {
//   const learnData = getOldLearnData(ctx.session);
//   if (!learnData) return Reply.text('Вы не можете этого сделать');
//   const poemText = getPoemText(learnData);
//   if (!learnData.errorCount) return Reply.text('Ты не допустили ни одной ошибки. Продолжай учить:\n\n' + poemText);
//   return goLearnNext(ctx, { ...learnData, errorCount: 0 });
// });

atLearn.command(...exitHandler);

atLearn.command(...backHandler);

atLearn.command(...helpHandler);

atLearn.any((ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) {
    ctx.leave();
    return Reply.text('Вернулись в меню');
  }
  return goLearnNext(ctx, learnData);
});

// atLearn.any((ctx) => {
//   const learnData = getOldLearnData(ctx.session);
//   if (!learnData) return Reply.text('Вы не можете этого сделать');
//   const poemText = getPoemText(learnData);
//   const matchDigit = levenshtein.similarity(poemText.toLowerCase(), ctx.message.toLowerCase());
//   if (learnData.textType !== 'row') return Reply.text('Скажи "Дальше", чтобы продолжить учить');
//   if (matchDigit > 0.5) {
//     return goLearnNext(ctx, learnData);
//   } else {
//     saveLearnData(ctx.session, { ...learnData, errorCount: learnData.errorCount + 1 });
//     const matchText = `Твой текст совпал на ${(matchDigit * 100).toFixed(1)}%.`;
//     return Reply.text({ text: `${matchText} Повтори еще раз\n\n${poemText}`, tts: `${matchText} Скажи "Продолжить", чтобы учить дальше или повтори текст: \n\n${poemText}` });
//   }
// });

export { atLearn };
