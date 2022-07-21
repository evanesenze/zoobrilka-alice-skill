import { Alice, CommandCallback, IContext, ISession, IStageContext, Markup, Reply, Scene } from 'yandex-dialogs-sdk';
import { IApiEntity, IApiEntityYandexFio } from 'yandex-dialogs-sdk/dist/api/nlu';
import { comparePoem, searchPoems } from './Base';
import { CommandDeclaration } from 'yandex-dialogs-sdk/dist/command/command';
import { app } from './Api';
import { levenshtein } from 'string-comparison';
import { sample } from 'lodash';

type IHandlerType = [declaration: CommandDeclaration<IStageContext>, callback: CommandCallback<IStageContext>];

interface IApiEntityYandexFioNew extends IApiEntityYandexFio {
  tokens: { start: number; end: number };
}

const ROWS_COUNT = 2;
const alice = new Alice();

const exitHandler: IHandlerType = [
  ['выйти', 'хватит', 'стоп', 'я устал', 'выход'],
  (ctx) => {
    ctx.enter('');
    cleanSceneHistory(ctx.session);
    return Reply.text('Хорошо, будет скучно - обращайтесь.', { end_session: true });
  },
];

const backHandler: IHandlerType = [
  ['назад', 'вернись'],
  (ctx) => {
    console.log(ctx.session);
    const scene = removeSceneHistory(ctx.session);
    if (!scene) {
      ctx.leave();
      return Reply.text('Мы вернулись в меню');
    }
    ctx.enter(scene);
    const message = String(sample(sceneMessages[scene]));

    return Reply.text(message);
  },
];

const wrongHandler: CommandCallback<IStageContext | IContext> = (ctx) => {
  const c = ctx as IStageContext;
  const currentScene = getCurrentScene(c.session);
  if (!currentScene) return Reply.text('К сожалению я не понял, что вы хотели сказать, повторите пожалуйста.');
  const hint = String(sample(sceneHints[currentScene]));
  return Reply.text(hint);
};

const FIND_MENU_SCENE: SceneType = 'FIND_MENU_SCENE';
const SELECT_LIST_SCENE: SceneType = 'SELECT_LIST_SCENE';
const LEARN_SCENE: SceneType = 'LEARN_SCENE';

const sceneMessages: Record<SceneType, string[]> = {
  LEARN_SCENE: ['Начинаем учить'],
  FIND_MENU_SCENE: ['Назовите имя и фамилию автора или название стиха, чтобы начать поиск. Также можете взглянуть на рейтинг'],
  SELECT_LIST_SCENE: ['Выбери стих из списка\n Для перемещения скажите "Далее/Назад"\nДля перехода к поиску, скажите "Поиск"'],
};

const sceneHints: Record<SceneType, string[]> = {
  LEARN_SCENE: ['Учите, ничем не могу помочь'],
  FIND_MENU_SCENE: ['Назовите имя и фамилию автора или название стиха, чтобы начать поиск'],
  SELECT_LIST_SCENE: ['Для выбора стиха, назовите его номер\nДля перехода к поиску, скажите "Поиск"'],
};

const getCurrentScene = (session: ISession): SceneType | undefined => {
  const arr = (session.get('sceneHistory') || []) as SceneType[];
  return arr[arr.length - 1];
};

const removeSceneHistory = (session: ISession): SceneType | undefined => {
  const arr = (session.get('sceneHistory') || []) as SceneType[];
  arr.pop();
  session.set('sceneHistory', arr);
  return arr[arr.length - 1];
};

const cleanSceneHistory = (session: ISession): void => session.set('sceneHistory', []);

const addSceneHistory = (session: ISession, newSceneName: SceneType): void => {
  const arr = (session.get('sceneHistory') || []) as SceneType[];
  arr.push(newSceneName);
  session.set('sceneHistory', [...new Set(arr)]);
};

const deleteLearnData = (session: ISession) => session.delete('learnData');

const getOldLearnData = (session: ISession) => session.get<ILearnData>('learnData');

const getBlocksData = (text: string) => text.split('\n\n').map((item) => item.split('\n'));

const getNewLearnData = (poem: IPoem, textType: PoemTextType, currentBlockIndex = 0, currentRowIndex = 0): ILearnData | null => {
  const blocksData = getBlocksData(poem.text);
  const blocksCount = blocksData.length;
  if (currentBlockIndex > blocksCount - 1) return null;
  const rows = blocksData[currentBlockIndex];
  const rowsCount = Math.ceil(rows.length / ROWS_COUNT);
  const learnedRows = [0];
  return {
    poem,
    blocksData,
    poemСomplited: false,
    textType,
    errorCount: 0,
    canLearnNext: false,
    blocksCount,
    currentBlock: {
      index: currentBlockIndex,
      rowsCount,
      complited: learnedRows.length === rowsCount,
      isLast: currentBlockIndex === blocksCount - 1,
      learnedRows,
    },
    currentRow: {
      index: currentRowIndex,
      isLast: rowsCount === currentRowIndex + 1,
    },
  };
};

const saveLearnData = (session: ISession, data: ILearnData) => session.set('learnData', data); // !

const getPoemText = (learnData: ILearnData) => {
  const { currentBlock, currentRow, textType, blocksData } = learnData;
  const oldBlocksText = blocksData.slice(0, currentBlock.index).reduce((res, item) => res + item.join('\n') + '\n\n', '');
  const oldRowsText = blocksData[currentBlock.index].slice(0, currentRow.index * ROWS_COUNT).join('\n');
  const currentRowText = blocksData[currentBlock.index].slice(currentRow.index * ROWS_COUNT, currentRow.index * ROWS_COUNT + ROWS_COUNT).join('\n');
  switch (textType) {
    case 'full':
      if (!oldRowsText) return (oldBlocksText + currentRowText).substring(0, 900);
      return (oldBlocksText + oldRowsText + '\n' + currentRowText).substring(0, 900);
    case 'block':
      if (!oldRowsText) return currentRowText.substring(0, 900);
      return (oldRowsText + '\n' + currentRowText).substring(0, 900);
    case 'row':
      return currentRowText.substring(0, 900);
    default:
      return currentRowText.substring(0, 900);
  }
};

const deleteSelectListData = (session: ISession) => session.delete('selectListData');

const getSelectListData = (session: ISession): ISelectListData => session.get<ISelectListData>('selectListData');

const saveSelectListData = (session: ISession, newData: ISelectListData) => session.set('selectListData', newData); // !

const goLearnNext = (ctx: IStageContext, learnData: ILearnData) => {
  const { currentBlock, currentRow, poem, poemСomplited } = learnData;
  if (currentRow.isLast && currentBlock.learnedRows.includes(currentRow.index)) {
    if (currentBlock.isLast) {
      console.log('currentBlock is last');
      if (!poemСomplited) {
        const text = 'Повторите стих целиком:\n' + getPoemText({ ...learnData, textType: 'full' });
        saveLearnData(ctx.session, { ...learnData, poemСomplited: true });
        return Reply.text(text);
      } else {
        ctx.leave();
        deleteLearnData(ctx.session);
        return Reply.text('Поздравляю! Вы выучили новый стих');
      }
    }
    console.log('currentRow is last');
    currentBlock.complited = true;
    if (currentBlock.rowsCount > 1 && currentBlock.index != 0 && !currentBlock.complited && currentBlock.rowsCount > 2) {
      console.log('currentBlock is not complited');
      const nextLearnData = { ...learnData, currentBlock, textType: 'full' } as ILearnData;
      saveLearnData(ctx.session, nextLearnData);
      const text = 'Молодец! Блок закончен, теперь повтори его полностью:\n\n' + getPoemText(nextLearnData);
      return Reply.text(text);
    } else {
      const tts = `Скажите "Дальше", чтобы продолжить.
Скажить "Повторить стих", чтобы повторить весь стих.
Скажите "Повторить блок", чтобы повторить последний блок.`;
      return Reply.text({ text: 'Двигаемся дальше, потворяем блок или весь стих?', tts });
    }
  } else {
    console.log('next row');
    if (currentBlock.learnedRows.includes(currentRow.index)) {
      console.log('new row');
      const nextLearnData = getNewLearnData(poem, 'row', currentBlock.index, currentRow.index + 1);
      if (!nextLearnData) {
        ctx.leave();
        return Reply.text('Переход в меню');
      }
      saveLearnData(ctx.session, nextLearnData);
      const text = 'Повторите строку:\n\n' + getPoemText(nextLearnData);
      return Reply.text(text);
    } else {
      currentBlock.learnedRows.push(currentRow.index);
      console.log('repeat block');
      const nextLearnData = { ...learnData, currentBlock, textType: 'block' } as ILearnData;
      saveLearnData(ctx.session, nextLearnData);
      const text = 'Повторите уже выученые строки:\n\n' + getPoemText(nextLearnData);
      return Reply.text(text);
    }
  }
};

const extractTitleAndAuthor = (message: string, entities?: IApiEntity[]): { title: string; author?: IAuthor } => {
  let author: IAuthor | undefined;
  let title = message;
  const names = entities?.filter((item) => item.type === 'YANDEX.FIO').map((item) => item as IApiEntityYandexFioNew);
  if (names?.length) {
    const namesCount = names.length - 1;
    const name = names[namesCount];
    if (names?.length) {
      const firstName = `${name.value.first_name?.[0].toUpperCase() ?? ''}${name.value.first_name?.slice(1).toLocaleLowerCase() ?? ''}`;
      const lastName = `${name.value.last_name?.[0].toUpperCase() ?? ''}${name.value.last_name?.slice(1).toLocaleLowerCase() ?? ''}`;
      author = { firstName, lastName };
      const words = title.split(' ');
      words.splice(name.tokens.start, name.tokens.end - name.tokens.start);
      title = words.join(' ');
    }
  }
  return { author, title };
};

const confirmSelectPoem = (ctx: IStageContext, selectedPoem: IPoem, selectListData: ISelectListData) => {
  const blocksData = getBlocksData(selectedPoem.text);
  const lastBlockIndex = blocksData.length - 1;
  const lastBlockRows = blocksData[lastBlockIndex];
  const lastBlockRowIndex = lastBlockRows.length - 1;
  const newLearnData = getNewLearnData(selectedPoem, 'full', lastBlockIndex, lastBlockRowIndex);
  if (!newLearnData) {
    ctx.leave();
    return Reply.text('Вышли назад');
  }
  const text = getPoemText(newLearnData);
  saveSelectListData(ctx.session, { ...selectListData, selectedPoem });
  return Reply.text(`Ты выбрал ${getAuthorName(selectedPoem.author)} - ${selectedPoem.title}\n\n${text}\nУчим его?`);
};

const getAuthorName = (author?: IAuthor): string => `${author?.firstName ?? ''} ${author?.lastName ?? ''}`.trim();

const atLearn = new Scene(LEARN_SCENE);

atLearn.command(/дальше/, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  console.log('currentBlock is complited');
  console.log(learnData);
  const { currentBlock, poem } = learnData;
  if (!currentBlock.complited) {
    const poemText = getPoemText(learnData);
    const text = 'Текущий блок еще не выучен.\nПродолжайте учить:\n\n' + poemText;
    return Reply.text({ text, tts: 'Сначала выучите текущий блок!\n' + text });
  }
  const nextLearnData = getNewLearnData(poem, 'row', currentBlock.index + 1, 0);
  if (!nextLearnData) {
    ctx.leave();
    return Reply.text('Переход в меню');
  }
  saveLearnData(ctx.session, nextLearnData);
  const text = 'Повторите строку:\n\n' + getPoemText(nextLearnData);
  return Reply.text(text);
});

atLearn.command('повторить стих', (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  console.log('repeat poem');
  const text = 'Повторите стих:\n\n' + getPoemText({ ...learnData, textType: 'full' });
  return Reply.text(text);
});

atLearn.command('повторить блок', (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  console.log('repeat poem');
  const text = 'Повторите блок:\n\n' + getPoemText({ ...learnData, textType: 'block' });
  return Reply.text(text);
});

atLearn.command(/продолжить/, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  const poemText = getPoemText(learnData);
  if (!learnData.errorCount) return Reply.text('Вы не допустили ни одной ошибки. Продолжайте учить:\n\n' + poemText);
  return goLearnNext(ctx, { ...learnData, errorCount: 0 });
});

atLearn.any((ctx) => {
  const learnData = getOldLearnData(ctx.session);
  const poemText = getPoemText(learnData);
  const matchDigit = levenshtein.similarity(poemText.toLowerCase(), ctx.message.toLowerCase());
  console.log(matchDigit);
  // return goLearnNext(ctx, learnData);
  if (matchDigit > 0.5) {
    return goLearnNext(ctx, learnData);
  } else {
    saveLearnData(ctx.session, { ...learnData, errorCount: learnData.errorCount + 1 });
    const matchText = `Твой текст совпал на ${(matchDigit * 100).toFixed(1)}%.`;
    return Reply.text({ text: `${matchText} Повторите еще раз\n\n${poemText}`, tts: `${matchText} Скажи "Продолжить", чтобы учить дальше или повтори текст: \n\n${poemText}` });
  }
});

atLearn.command(...exitHandler);
atLearn.command(...backHandler);

const atFindMenu = new Scene(FIND_MENU_SCENE);
atFindMenu.command(/рейтинг/i, () => Reply.text('Рейтинг стихов можете посмотреть на сайте', { buttons: [Markup.button({ url: 'https://www.google.com', title: 'Перейти на сайт' })] }));
atFindMenu.command(...exitHandler);
atFindMenu.command(...backHandler);
atFindMenu.any(async (ctx) => {
  const entities = ctx.nlu?.entities;
  console.log(entities);
  const { title, author } = extractTitleAndAuthor(ctx.message, entities);
  const authorName = getAuthorName(author);
  const text = `Параметры поиска:
Автор: ${authorName ?? 'Не задан'}
Название: ${title}`;
  const items = await searchPoems(author, title);
  let tts = 'Ничего не смог найти';
  const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${getAuthorName(author)} | ${title}`.substring(0, 128)));
  if (buttons.length) {
    tts = 'Вот что я нашел. Для выбора, назовите номер. Для выхода, скажите "Поиск"';
    saveSelectListData(ctx.session, { items });
    ctx.enter(SELECT_LIST_SCENE);
  }
  return Reply.text({ text, tts }, { buttons });
});

const atSelectList = new Scene(SELECT_LIST_SCENE);

atSelectList.command('Поиск', (ctx) => {
  deleteSelectListData(ctx.session);
  const text = String(sample(sceneMessages['FIND_MENU_SCENE']));
  ctx.enter(FIND_MENU_SCENE);
  return Reply.text(text);
});

atSelectList.command(/да|учим/, (ctx) => {
  const selectListData = getSelectListData(ctx.session);
  const { items, selectedPoem } = selectListData;
  if (!selectedPoem) {
    const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${getAuthorName(author)} | ${title}`.substring(0, 128)));
    return Reply.text({ text: 'Выберите стих из списка', tts: 'Сначала выберите стих' }, { buttons });
  }
  const learnData = getNewLearnData(selectedPoem, 'row');
  if (!learnData) {
    ctx.leave();
    return Reply.text('Ошибка.Переход в меню');
  }
  const text = getPoemText(learnData);
  saveLearnData(ctx.session, learnData);
  addSceneHistory(ctx.session, LEARN_SCENE);
  deleteSelectListData(ctx.session);
  ctx.enter(LEARN_SCENE);
  return Reply.text('Повторите строку:\n\n' + text);
});

atSelectList.command(/нет|другой/, (ctx) => {
  const selectListData = getSelectListData(ctx.session);
  const { items } = selectListData;
  const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${getAuthorName(author)} | ${title}`.substring(0, 128)));
  saveSelectListData(ctx.session, { items });
  return Reply.text('Выберите стих из списка', { buttons });
});

atSelectList.command(...exitHandler);
atSelectList.command(...backHandler);

atSelectList.any((ctx) => {
  const entities = ctx.nlu?.entities;
  const selectListData = getSelectListData(ctx.session);
  if (entities?.length) {
    const numbers = entities.filter((item) => item.type === 'YANDEX.NUMBER');
    if (numbers.length) {
      console.log(selectListData);
      if (!selectListData) return Reply.text('error');
      const { items } = selectListData;
      const itemNumbers = items.map((_, i) => i + 1);
      console.log(itemNumbers);
      const currentNumber = numbers.find((item) => itemNumbers.includes(Number(item.value)))?.value;
      console.log(currentNumber);
      const selectedPoem = items.find((_, i) => i + 1 === currentNumber);
      if (selectedPoem) return confirmSelectPoem(ctx, selectedPoem, selectListData);
    }
  }
  const { title, author } = extractTitleAndAuthor(ctx.message, entities);
  const bestMatch = [...selectListData.items].sort((a, b) => comparePoem(a, b, title, author))[0];
  if (bestMatch) return confirmSelectPoem(ctx, bestMatch, selectListData);
  const tts = String(sample(sceneHints['SELECT_LIST_SCENE']));
  const buttons = selectListData.items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${getAuthorName(author)} | ${title}`.substring(0, 128)));
  return Reply.text({ text: 'Выберите стих из списка:', tts }, { buttons });
});

alice.command('', () => {
  return Reply.text(`Добро пожаловать в “Навык изучениия стихов”.
${sample(['Здесь вы можете выучить стихотворение.', 'Я помогу вам выучить стихотворение.'])}
Вы уже знакомы с тем, что я умею?`);
});
alice.command(/да|знаком/i, () =>
  Reply.text(`Итак, что будем учить сегодня?
Скажите “Продолжить учить”, чтобы продолжить учить стихотворение.
Скажите “Выучить новое стихотворение”, чтобы начать учить новое стихотворение.`)
);
alice.command(/новый|новое|другое|найти|поиск|искать/i, (ctx) => {
  const c = ctx as IStageContext;
  addSceneHistory(c.session, FIND_MENU_SCENE);
  c.enter(FIND_MENU_SCENE);
  const message = String(sample(sceneMessages['FIND_MENU_SCENE']));
  return Reply.text(message);
});
alice.command(/учить|продолжи/i, (ctx) => {
  const c = ctx as IStageContext;
  const learnData = getOldLearnData(c.session);
  if (!learnData) {
    addSceneHistory(c.session, FIND_MENU_SCENE);
    c.enter(FIND_MENU_SCENE);
    return Reply.text('У вас нет начатых стихов. Назовите имя и фамилию или название стиха, чтобы начать поиск');
  }
  addSceneHistory(c.session, LEARN_SCENE);
  c.enter(LEARN_SCENE);
  const { poem } = learnData;
  const poemText = getPoemText(learnData);
  const text = `Продолжаем учить стих ${getAuthorName(poem.author)} - ${poem.title}
Повторите:
${poemText}`;
  return Reply.text(text);
});
alice.command(/запомни|запиши|запись|записать|запомнить/i, () =>
  Reply.text('К сожалению, я не умею записывать ваш голос. Перейдите на сайт', { buttons: [Markup.button({ title: 'Перейти на сайт', hide: true, url: 'https://www.google.com' })] })
);
alice.command(/расскажи|умеешь|не/i, () =>
  Reply.text(`Что ж, пора рассказать Вам обо мне.
  Я могу помочь найти стихотворение, достаточно сказать “Найти”.
  Я могу помочь выучить стихотворение, достаточно сказать “Учить”.
  Так же по команде “Запомни” я запишу Ваше чтение.`)
);
alice.command(...(exitHandler as [declaration: CommandDeclaration<IContext>, callback: CommandCallback<IContext>]));
alice.any(wrongHandler);

const getAllSessionData = (session?: ISession) => {
  if (!session) return;
  const functions: Record<string, (session: ISession) => unknown> = {
    currentScene: getCurrentScene,
    sceneHistory: (session) => session.get('sceneHistory') || [],
    selectListData: getSelectListData,
    learnData: getOldLearnData,
  };
  const res: Record<string, any> = Object.entries(functions).reduce((acc, [name, func]) => ({ ...acc, [name]: func(session) }), {});
  console.log(JSON.stringify(res, null, 2));
};

alice.on('response', (ctx) => {
  // const c = ctx as IStageContext;
  // console.log(2);
  // getAllSessionData(c.session);
  // console.log(JSON.stringify(ctx.data, null, 2));
});

alice.registerScene(atLearn);
alice.registerScene(atFindMenu);
alice.registerScene(atSelectList);

app.post('/', async (req, res) => {
  // console.log(req.body);
  const result = await alice.handleRequest(req.body);
  // console.log(result);
  return res.send(result);
});

console.log(1);
