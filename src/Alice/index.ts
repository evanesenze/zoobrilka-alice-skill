import { Alice, CommandCallback, IContext, IStageContext, Markup, Reply } from 'yandex-dialogs-sdk';
import {
  FIND_MENU_SCENE,
  LEARN_SCENE,
  addSceneHistory,
  confirmSelectPoem,
  enableLogging,
  exitHandler,
  getAllSessionData,
  getAuthorName,
  getCurrentScene,
  getOldLearnData,
  getPoemText,
  helpHandler,
  loggingIsEnable,
  sceneHints,
  sceneMessages,
} from './extras';
import { getTodayPoem, saveLog } from '../Base';
import { CommandDeclaration } from 'yandex-dialogs-sdk/dist/command/command';
import { atFindMenu } from './FindMenuScene';
import { atLearn } from './LearnScene';
import { atSelectList } from './SelectListScene';
import { sample } from 'lodash';

const alice = new Alice();

alice.command('', () => {
  return Reply.text(`Добро пожаловать в "Зубрилку".
${sample(['Здесь ты можешь выучить стихотворение.', 'Я помогу тебе выучить стихотворение.'])}
Ты уже знаком с тем, что я умею?`);
});

alice.command(/да|знаком/gi, () =>
  Reply.text(`Итак, что будем учить сегодня?
Скажи "Продолжить", и мы продолжим учить стих.
Скажи "Новое", и мы найдем новый стих.`)
);

alice.command(/новый|новое|другое|найти|поиск|искать/gi, (ctx) => {
  const c = ctx as IStageContext;
  addSceneHistory(c.session, FIND_MENU_SCENE);
  c.enter(FIND_MENU_SCENE);
  const message = String(sample(sceneMessages['FIND_MENU_SCENE']));
  return Reply.text(message);
});

alice.command(/учить|продолжи/gi, (ctx) => {
  const c = ctx as IStageContext;
  const learnData = getOldLearnData(c.session);
  if (!learnData) {
    addSceneHistory(c.session, FIND_MENU_SCENE);
    c.enter(FIND_MENU_SCENE);
    return Reply.text('Ты ещё не начал учить стихотворение с "Зубрилкой". Назови имя/фамилию автора или название стиха, чтобы начать поиск');
  }
  addSceneHistory(c.session, LEARN_SCENE);
  c.enter(LEARN_SCENE);
  const { poem } = learnData;
  const poemText = getPoemText(learnData);
  const text = `Продолжаем учить стих ${getAuthorName(poem.author)} - ${poem.title}
Повтори:
${poemText}`;
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
  return confirmSelectPoem(c, poem, { items: [] }, true);
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
  if (!currentScene) return Reply.text('К сожалению я не понял, что вы хотели сказать, повторите пожалуйста.');
  const hint = String(sample(sceneHints[currentScene]));
  return Reply.text(hint);
});

alice.on('response', (ctx) => {
  const c = ctx as IStageContext;
  if (!loggingIsEnable(c.session)) return;
  saveLog(c.userId, getAllSessionData(c.session));
});

// registerLearnScene(alice, LEARN_SCENE);
alice.registerScene(atLearn);
alice.registerScene(atFindMenu);
alice.registerScene(atSelectList);

export { alice };
