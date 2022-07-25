import { Alice, CommandCallback, IContext, IStageContext, Markup, Reply } from 'yandex-dialogs-sdk';
import {
  LEARN_SCENE,
  POEM_SCENE,
  SET_AUTHOR_SCENE,
  addSceneHistory,
  enableLogging,
  exitHandler,
  getAllSessionData,
  getAuthorName,
  getCurrentScene,
  getNewLearnData,
  getOldLearnData,
  getPoemText,
  helpHandler,
  loggingIsEnable,
  saveFindData,
  sceneHints,
  sceneMessages,
} from './extras';
import { getTodayPoem, saveLog } from '../Base';
import { CommandDeclaration } from 'yandex-dialogs-sdk/dist/command/command';
import { atLearn } from './learnScene';
import { atPoemScene } from './poemScene';
import { atSetAuthor } from './setAuthorScene';
import { atSetTitle } from './setTitleScene';
import { sample } from 'lodash';

const alice = new Alice();

alice.command('', (ctx) => {
  const c = ctx as IStageContext;
  const learnData = getOldLearnData(c.session);
  return Reply.text(`Добро пожаловать в "Зубрилку".
${sample(['Здесь ты можешь выучить стихотворение.', 'Я помогу тебе выучить стихотворение.'])}${learnData ? "\nСкажи 'Учить', чтобы продолжить учить." : ''}
Скажи 'Найти', чтобы начать поиск стиха.
Скажи 'Помощь' в любом месте, чтобы получить помощь.`);
});

alice.command(/новый|новое|другое|найти|поиск|искать/gi, (ctx) => {
  const c = ctx as IStageContext;
  addSceneHistory(c.session, SET_AUTHOR_SCENE);
  c.enter(SET_AUTHOR_SCENE);
  const message = String(sample(sceneMessages[SET_AUTHOR_SCENE]));
  return Reply.text(message);
});

alice.command(/учить|продолжи/gi, (ctx) => {
  const c = ctx as IStageContext;
  const learnData = getOldLearnData(c.session);
  if (!learnData) {
    addSceneHistory(c.session, SET_AUTHOR_SCENE);
    c.enter(SET_AUTHOR_SCENE);
    return Reply.text('Ты ещё не начал учить стихотворение с "Зубрилкой".\nДавай найдем новый стих. Назови автора');
  }
  addSceneHistory(c.session, LEARN_SCENE);
  const { poem } = learnData;
  const poemText = getPoemText(learnData);
  const text = `Продолжаем учить стих ${getAuthorName(poem.author)} - ${poem.title}.
Скажи 'Дальше', чтобы перейти к следующей строке.

${poemText}`;
  c.enter(LEARN_SCENE);
  return Reply.text(text);
});

alice.command(/запомни|запиши|запись|записать|запомнить/gi, () =>
  Reply.text('К сожалению, я не умею записывать ваш голос. Перейди на сайт', { buttons: [Markup.button({ title: 'Перейти на сайт', hide: true, url: 'https://www.google.com' })] })
);

alice.command(/расскажи|умеешь|не/gi, async (ctx) => helpHandler[1](ctx as IStageContext));

alice.command(/стих дня/gi, async (ctx) => {
  const c = ctx as IStageContext;
  const poem = await getTodayPoem();
  if (!poem) return Reply.text('К сожалению, сегодня не день стихов');
  addSceneHistory(c.session, POEM_SCENE);
  c.enter(POEM_SCENE);
  const text = `Стих дня ${getAuthorName(poem.author)} - ${poem.title}.\n\n`;
  saveFindData(c.session, { author: poem.author, items: [], poems: [poem], title: poem.title, selectedPoemId: 0 });
  const newLearnData = getNewLearnData(poem, 'full', -1, -1);
  if (!newLearnData) return Reply.text('К сожалению, сегодня не день стихов');
  const poemText = getPoemText(newLearnData);
  return Reply.text({ text: text + poemText, tts: text + 'Скажи "Прочитай", чтобы я его озвучил.\nСкажи "Учить", чтобы начать учить.\nСкажи "Поиск", чтобы найти другой стих.' });
});

alice.command('лог', (ctx) => {
  const c = ctx as IStageContext;
  enableLogging(c.session);
  return Reply.text('Логирование влючено\nТвой ид:\n' + c.userId);
});

alice.command(...(exitHandler as [declaration: CommandDeclaration<IContext>, callback: CommandCallback<IContext>]));

alice.command(...(helpHandler as [declaration: CommandDeclaration<IContext>, callback: CommandCallback<IContext>]));

alice.any((ctx) => {
  const c = ctx as IStageContext;
  const currentScene = getCurrentScene(c.session);
  const hint = String(sample(sceneHints[currentScene]));
  return Reply.text(hint);
});

alice.on('response', (ctx) => {
  const c = ctx as IStageContext;
  if (!loggingIsEnable(c.session)) return;
  saveLog(c.userId, getAllSessionData(c.session));
});

alice.registerScene(atLearn);
alice.registerScene(atPoemScene);
alice.registerScene(atSetAuthor);
alice.registerScene(atSetTitle);

export { alice };
