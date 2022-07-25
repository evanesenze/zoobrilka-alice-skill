import { LEARN_SCENE, backHandler, exitHandler, exitWithError, getOldLearnData, getPoemText, goLearnNext, helpHandler, saveLearnData } from './extras';
import { Reply, Scene } from 'yandex-dialogs-sdk';

const atLearn = new Scene(LEARN_SCENE);

atLearn.command(/повтори.*стих/gi, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return exitWithError(ctx, 'learnData not found');
  console.log('repeat poem');
  const newLearnData: ILearnData = { ...learnData, textType: 'full' };
  saveLearnData(ctx.session, newLearnData);
  const text = getPoemText(newLearnData);
  return Reply.text({ text, tts: text + 'sil <[10000]> Скажи "Дальше", чтобы перейти к следующей строке' });
});

atLearn.command(/повтори.*(блок|блог)/gi, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return exitWithError(ctx, 'learnData not found');
  console.log('repeat poem');
  const newLearnData: ILearnData = { ...learnData, textType: 'block' };
  saveLearnData(ctx.session, newLearnData);
  const text = getPoemText(newLearnData);
  return Reply.text({ text, tts: text + 'sil <[10000]> Скажи "Дальше", чтобы перейти к следующей строке' });
});

atLearn.command(/повтори/, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return exitWithError(ctx, 'learnData not found');
  console.log('repeat');
  const text = getPoemText(learnData);
  return Reply.text({ text, tts: text + 'sil <[10000]> Скажи "Дальше", чтобы перейти к следующей строке' });
});

atLearn.command(...exitHandler);

atLearn.command(...backHandler);

atLearn.command(...helpHandler);

atLearn.any((ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return exitWithError(ctx, 'learnData not found');
  return goLearnNext(ctx, learnData);
});

export { atLearn };
