import { LEARN_SCENE, backHandler, exitHandler, exitWithError, getDelaySendText, getOldLearnData, getPoemText, goLearnNext, helpHandler, saveLearnData } from './extras';
import { Reply, Scene } from 'yandex-dialogs-sdk';

const atLearn = new Scene(LEARN_SCENE);

const repeatCommand = /повтор|еще|дублировать|продублируй|не.*понял|повторить/;
const repeatBlockCommand = /повтор.*(блок|блог)|еще.*(блок|блог)|дублировать.*(блок|блог)|продублируй.*(блок|блог)|не.*понял.*(блок|блог)/;
const repeatPoemCommand = /повтор.*стих|еще.*стих|дублировать.*стих|продублируй.*стих|не.*понял.*стих|повторить.*стих/;

atLearn.command(repeatPoemCommand, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return exitWithError(ctx, 'learnData not found');
  console.log('repeat poem');
  const newLearnData: ILearnData = { ...learnData, textType: 'full' };
  saveLearnData(ctx.session, newLearnData);
  const text = getPoemText(newLearnData);
  return Reply.text({ text, tts: text + getDelaySendText(text) });
});

atLearn.command(repeatBlockCommand, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return exitWithError(ctx, 'learnData not found');
  console.log('repeat poem');
  const newLearnData: ILearnData = { ...learnData, textType: 'block' };
  saveLearnData(ctx.session, newLearnData);
  const text = getPoemText(newLearnData);
  return Reply.text({ text, tts: text + getDelaySendText(text) });
});

atLearn.command(repeatCommand, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  if (!learnData) return exitWithError(ctx, 'learnData not found');
  console.log('repeat');
  const text = getPoemText(learnData);
  return Reply.text({ text, tts: text + getDelaySendText(text) });
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
