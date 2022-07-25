import { LEARN_SCENE, backHandler, exitHandler, getOldLearnData, getPoemText, goLearnNext, helpHandler, saveLearnData } from './extras';
import { Reply, Scene } from 'yandex-dialogs-sdk';

const atLearn = new Scene(LEARN_SCENE);

atLearn.command(/повтори.*стих/gi, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return Reply.text('Вы не можете этого сделать');
  console.log('repeat poem');
  const newLearnData: ILearnData = { ...learnData, textType: 'full' };
  saveLearnData(ctx.session, newLearnData);
  return Reply.text(getPoemText(newLearnData));
});

atLearn.command(/повтори.*(блок|блог)/gi, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return Reply.text('Вы не можете этого сделать');
  console.log('repeat poem');
  const newLearnData: ILearnData = { ...learnData, textType: 'block' };
  saveLearnData(ctx.session, newLearnData);
  return Reply.text(getPoemText(newLearnData));
});

atLearn.command(/повтори/, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return Reply.text('Вы не можете этого сделать');
  console.log('repeat');
  return Reply.text(getPoemText(learnData));
});

atLearn.command(...exitHandler);

atLearn.command(...backHandler);

atLearn.command(...helpHandler);

atLearn.any((ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return Reply.text('Вы не можете этого сделать');
  return goLearnNext(ctx, learnData);
});

export { atLearn };
