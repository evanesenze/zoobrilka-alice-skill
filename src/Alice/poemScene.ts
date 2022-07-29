import {
  GAMES_MENU_SCENE,
  LEARN_SCENE,
  POEM_SCENE,
  SET_AUTHOR_SCENE,
  addSceneHistory,
  backHandler,
  cleanSceneHistory,
  deleteFindData,
  exitHandler,
  exitWithError,
  getDelaySendText,
  getFindData,
  getNewLearnData,
  getPoemText,
  helpHandler,
  saveGamesData,
  saveLearnData,
  sceneMessages,
} from './extras';
import { Markup, Reply, Scene } from 'yandex-dialogs-sdk';
import { sample } from 'lodash';

const atPoemScene = new Scene(POEM_SCENE);

const startLearnCommand = /начать|старт|начало|начинаем|открыть|приступить|обновить|сделать|пойти|пуск|запуск/;
const voicePoemCommand = /прочитай|прочти|зачитай|читай|читать|произнеси|прочитать|изложи|изложить/;
const leranCommand = /продолжи|учи|зубрить|запоминать/;
const findCommand = /новый|новое|другое|найти|поиск|искать|ищи|найди|ищу|отыскать/;
const gameCommand = /игра/;
const recordCommand = /запомни|запиши|запись|записать|диктофон|аудиозапись|записывать|запишет|запомнить/;

atPoemScene.command(voicePoemCommand, (ctx) => {
  const findData = getFindData(ctx.session);
  if (!findData) return exitWithError(ctx, 'findData not found');
  const { selectedPoemId, poems } = findData;
  if (selectedPoemId === undefined) return exitWithError(ctx, 'selectedPoemId not found');
  const newLearnData = getNewLearnData(poems[selectedPoemId], 'full', -1, -1);
  if (!newLearnData) return exitWithError(ctx, 'newLearnData not found');
  const poemText = getPoemText(newLearnData);
  return Reply.text({ text: poemText, tts: poemText + '.Что хотите делать дальше?' });
});

atPoemScene.command(leranCommand, () => {
  return Reply.text(`Я буду произносить строку и давать время на ее повторение.
По команде "Дальше", мы перейдем к следующей строке.
По командам: "Повтори","Повтори блок" или "Повтори стих", я повторю текст еще раз.
Скажи "Начать", чтобы преступить к заучиванию.`);
});

atPoemScene.command(startLearnCommand, (ctx) => {
  const findData = getFindData(ctx.session);
  if (!findData) return exitWithError(ctx, 'findData not found');
  const { selectedPoemId, poems } = findData;
  if (selectedPoemId === undefined) return exitWithError(ctx, 'selectedPoemId not found');
  const learnData = getNewLearnData(poems[selectedPoemId], 'row');
  if (!learnData) return exitWithError(ctx, 'learnData not found');
  const poemText = getPoemText(learnData);
  const text = 'Повтори новую строку.\n\n' + poemText;
  saveLearnData(ctx.session, learnData);
  addSceneHistory(ctx.session, LEARN_SCENE);
  ctx.enter(LEARN_SCENE);
  return Reply.text({ text, tts: text + getDelaySendText(poemText) });
});

atPoemScene.command(findCommand, (ctx) => {
  deleteFindData(ctx.session);
  const text = String(sample(sceneMessages[SET_AUTHOR_SCENE]));
  cleanSceneHistory(ctx.session);
  addSceneHistory(ctx.session, SET_AUTHOR_SCENE);
  ctx.enter(SET_AUTHOR_SCENE);
  return Reply.text(text);
});

atPoemScene.command(recordCommand, () => {
  const buttons = [Markup.button({ title: 'Перейти на сайт', hide: true, url: 'https://zoobrilka-skill.web.app/' })];
  return Reply.text('К сожалению, я не умею записывать голос. Перейди на сайт: zoobrilka-app.web.app', { buttons });
});

atPoemScene.command(gameCommand, (ctx) => {
  const findData = getFindData(ctx.session);
  if (!findData || findData.selectedPoemId === undefined) return exitWithError(ctx, 'findData not found');
  const selectedPoem = findData.poems[findData.selectedPoemId];
  const rows = selectedPoem.text.replace(/\n\n/g, '\n').split('\n');
  saveGamesData(ctx.session, { selectedPoem, rows });
  addSceneHistory(ctx.session, GAMES_MENU_SCENE);
  ctx.enter(GAMES_MENU_SCENE);
  const text = String(sample(sceneMessages['GAMES_MENU_SCENE']));
  return Reply.text(text);
});

atPoemScene.command(...exitHandler);

atPoemScene.command(...backHandler);

atPoemScene.command(...helpHandler);

atPoemScene.any(helpHandler[1]);

export { atPoemScene };
