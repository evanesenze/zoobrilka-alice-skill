import {
  LEARN_SCENE,
  POEM_SCENE,
  SET_AUTHOR_SCENE,
  addSceneHistory,
  backHandler,
  cleanSceneHistory,
  deleteFindData,
  exitHandler,
  getFindData,
  getNewLearnData,
  getPoemText,
  helpHandler,
  saveLearnData,
  sceneMessages,
} from './extras';
import { Reply, Scene } from 'yandex-dialogs-sdk';
import { sample } from 'lodash';

const atPoemScene = new Scene(POEM_SCENE);

atPoemScene.command(...exitHandler);

atPoemScene.command(...backHandler);

atPoemScene.command(...helpHandler);

atPoemScene.command(/прочитай|читай|прочитать/gi, (ctx) => {
  const findData = getFindData(ctx.session);
  if (!findData) return Reply.text('Сейчас вы не можете это сделать');
  const { selectedPoemId, poems } = findData;
  if (!selectedPoemId) return Reply.text('Сейчас вы не можете это сделать');
  const newLearnData = getNewLearnData(poems[selectedPoemId], 'full', -1, -1);
  if (!newLearnData) return Reply.text('Сейчас вы не можете это сделать');
  const poemText = getPoemText(newLearnData);
  return Reply.text({ text: poemText, tts: poemText + '.Что хотите делать дальше?' });
});

atPoemScene.command(/учить/gi, (ctx) => {
  return Reply.text(`Я буду произносить строку и давать время на ее повторение.
По команде "Дальше", мы перейдем к следующей строке.
По командам: "Повтори","Повтори блок" или "Повтори стих", я повторю текст еще раз.
Скажи "Начать", чтобы преступить к заучиванию.`);
});

atPoemScene.command(/начать/gi, (ctx) => {
  const findData = getFindData(ctx.session);
  if (!findData) return Reply.text('Сейчас вы не можете это сделать');
  const { selectedPoemId, poems } = findData;
  if (!selectedPoemId) return Reply.text('Сейчас вы не можете это сделать');
  const learnData = getNewLearnData(poems[selectedPoemId], 'row');
  if (!learnData) return Reply.text('Сейчас вы не можете это сделать');
  const text = 'Повтори новую строку.\n' + getPoemText(learnData);
  saveLearnData(ctx.session, learnData);
  addSceneHistory(ctx.session, LEARN_SCENE);
  ctx.enter(LEARN_SCENE);
  return Reply.text({ text, tts: text + 'sil <[10000]> Скажи "Дальше", чтобы перейти к следующей строке' });
});

atPoemScene.command(/поиск/gi, (ctx) => {
  deleteFindData(ctx.session);
  const text = String(sample(sceneMessages[SET_AUTHOR_SCENE]));
  cleanSceneHistory(ctx.session);
  addSceneHistory(ctx.session, SET_AUTHOR_SCENE);
  ctx.enter(SET_AUTHOR_SCENE);
  return Reply.text(text);
});

atPoemScene.any(helpHandler[1]);

export { atPoemScene };
