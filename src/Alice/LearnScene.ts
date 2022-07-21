import { LEARN_SCENE, backHandler, exitHandler, getNewLearnData, getOldLearnData, getPoemText, goLearnNext, helpHandler, saveLearnData } from './extras';
import { Reply, Scene } from 'yandex-dialogs-sdk';
import { levenshtein } from 'string-comparison';

const atLearn = new Scene(LEARN_SCENE);

atLearn.command(/дальше/gi, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  console.log('currentBlock is complited');
  console.log(learnData);
  const { currentBlock, poem } = learnData;
  if (!currentBlock.complited) {
    const poemText = getPoemText(learnData);
    const text = 'Текущий блок еще не выучен.\nПродолжай учить:\n\n' + poemText;
    return Reply.text({ text, tts: 'Сначала выучи текущий блок!\n' + text });
  }
  const nextLearnData = getNewLearnData(poem, 'row', currentBlock.index + 1, 0);
  if (!nextLearnData) {
    ctx.leave();
    return Reply.text('Вернулись в меню');
  }
  saveLearnData(ctx.session, nextLearnData);
  const text = 'Повтори строку:\n\n' + getPoemText(nextLearnData);
  return Reply.text(text);
});

atLearn.command(/повторить стих/gi, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  console.log('repeat poem');
  const newLearnData: ILearnData = { ...learnData, textType: 'full' };
  const text = 'Повтори стих:\n\n' + getPoemText(newLearnData);
  saveLearnData(ctx.session, newLearnData);
  return Reply.text(text);
});

atLearn.command(/повторить блок/gi, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  console.log('repeat poem');
  const newLearnData: ILearnData = { ...learnData, textType: 'block' };
  const text = 'Повтори блок:\n\n' + getPoemText(newLearnData);
  saveLearnData(ctx.session, newLearnData);
  return Reply.text(text);
});

atLearn.command(/продолжить/gi, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  const poemText = getPoemText(learnData);
  if (!learnData.errorCount) return Reply.text('Ты не допустили ни одной ошибки. Продолжай учить:\n\n' + poemText);
  return goLearnNext(ctx, { ...learnData, errorCount: 0 });
});

atLearn.command(...exitHandler);

atLearn.command(...backHandler);

atLearn.command(...helpHandler);

atLearn.any((ctx) => {
  const learnData = getOldLearnData(ctx.session);
  const poemText = getPoemText(learnData);
  const matchDigit = levenshtein.similarity(poemText.toLowerCase(), ctx.message.toLowerCase());
  // console.log(matchDigit);
  // return goLearnNext(ctx, learnData);
  if (matchDigit > 0.5) {
    return goLearnNext(ctx, learnData);
  } else {
    saveLearnData(ctx.session, { ...learnData, errorCount: learnData.errorCount + 1 });
    const matchText = `Твой текст совпал на ${(matchDigit * 100).toFixed(1)}%.`;
    return Reply.text({ text: `${matchText} Повтори еще раз\n\n${poemText}`, tts: `${matchText} Скажи "Продолжить", чтобы учить дальше или повтори текст: \n\n${poemText}` });
  }
});

export { atLearn };
