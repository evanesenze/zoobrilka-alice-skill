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

atPoemScene.command(/прочитай/gi, (ctx) => {
  const findData = getFindData(ctx.session);
  if (!findData) return Reply.text('Сейчас вы не можете это сделать');
  const { selectedPoem } = findData;
  if (!selectedPoem) return Reply.text('Сейчас вы не можете это сделать');
  const newLearnData = getNewLearnData(selectedPoem, 'full', -1, -1);
  if (!newLearnData) return Reply.text('Сейчас вы не можете это сделать');
  const poemText = getPoemText(newLearnData) + '.Что хотите делать дальше?';
  return Reply.text('', { tts: poemText });
});

atPoemScene.command(/учить/gi, (ctx) => {
  const findData = getFindData(ctx.session);
  if (!findData) return Reply.text('Сейчас вы не можете это сделать');
  const { selectedPoem } = findData;
  if (!selectedPoem) return Reply.text('Сейчас вы не можете это сделать');
  const learnData = getNewLearnData(selectedPoem, 'row');
  if (!learnData) return Reply.text('Сейчас вы не можете это сделать');
  const text = getPoemText(learnData);
  saveLearnData(ctx.session, learnData);
  addSceneHistory(ctx.session, LEARN_SCENE);
  ctx.enter(LEARN_SCENE);
  return Reply.text('Повтори строку.\nСкажи "Дальше", чтобы продолжить учить\n\n' + text, { end_session: true });
});

atPoemScene.command(/поиск/gi, (ctx) => {
  deleteFindData(ctx.session);
  const text = String(sample(sceneMessages[SET_AUTHOR_SCENE]));
  cleanSceneHistory(ctx.session);
  addSceneHistory(ctx.session, SET_AUTHOR_SCENE);
  ctx.enter(SET_AUTHOR_SCENE); // !!
  return Reply.text(text);
});

atPoemScene.any(helpHandler[1]);

export { atPoemScene };
