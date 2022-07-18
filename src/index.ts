import { Alice, CommandCallback, IContext, ISession, IStageContext, Markup, Reply, Scene } from 'yandex-dialogs-sdk';
import { CommandDeclaration } from 'yandex-dialogs-sdk/dist/command/command';
import { IApiEntityYandexFioValue } from 'yandex-dialogs-sdk/dist/api/nlu';
import base from './base.json';
import levenshtein from 'js-levenshtein';
import { sample } from 'lodash';

interface IPoem {
  author: string;
  title: string;
  first_line: string;
  text: string;
  tags: string[];
  id: number;
}

type IPoemsData = Record<string, IPoem>;
type IPoemBlocksData = Record<string, string[][]>;
// interface IPoemsData {
//   [id: string]: IPoem;
// }

const port = Number(process.env.PORT) || 3000;
const ROWS_COUNT = 2;
const alice = new Alice();
const Base = base as IPoemsData;
const BaseItems = Object.values(Base);
const BaseBlocks = Object.entries(Base)
  .map(([key, value]) => [key, value.text.split('\n\n').map((item) => item.split('\n'))])
  .reduce((acc, [key, value]) => ({ ...acc, [String(key)]: value }), {}) as IPoemBlocksData;

type IHandlerType = [declaration: CommandDeclaration<IStageContext>, callback: CommandCallback<IStageContext>];

const exitHandler: IHandlerType = [
  ['Выйти', 'Хватит', 'Стоп', 'Я устал'],
  (ctx) => {
    ctx.leave();
    return Reply.text('Хорошо, будет скучно - обращайтесь.', { end_session: true });
  },
];

const backHandler: IHandlerType = [
  ['Назад', 'Вернись'],
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
  if (!currentScene) return Reply.text('К сожалению я не поняла, что Вы хотели сказать, повторите пожалуйста.');
  const hint = String(sample(sceneHints[currentScene]));
  return Reply.text(hint);
};

type SceneType = 'LEARN_SCENE' | 'SELECT_MENU_SCENE' | 'SELECT_BY_NAME_SCENE' | 'SELECT_BY_AUTHOR_SCENE' | 'SELECT_LIST_SCENE';

const LEARN_SCENE: SceneType = 'LEARN_SCENE';
const SELECT_MENU_SCENE: SceneType = 'SELECT_MENU_SCENE';
const SELECT_BY_NAME_SCENE: SceneType = 'SELECT_BY_NAME_SCENE';
const SELECT_BY_AUTHOR_SCENE: SceneType = 'SELECT_BY_AUTHOR_SCENE';
const SELECT_LIST_SCENE: SceneType = 'SELECT_LIST_SCENE';

const sceneMessages: Record<SceneType, string[]> = {
  LEARN_SCENE: ['Начинаем учить'],
  SELECT_MENU_SCENE: ['Я могу найти стих по автору или по названию. Также можете взглянуть на рейтинг'],
  SELECT_BY_AUTHOR_SCENE: ['Назовите автора, а я постараюсь найти его стихи'],
  SELECT_BY_NAME_SCENE: ['Скажите название стиха, а я постараюсь его найти'],
  SELECT_LIST_SCENE: ['Выбери стих из списка\n Для перемещения скажите "Далее/Назад"\nДля перехода к поиску, скажите "Поиск"'],
};

const sceneHints: Record<SceneType, string[]> = {
  LEARN_SCENE: ['Учите, ничем не могу помочь'],
  SELECT_MENU_SCENE: ['Скажите "Искать по названию", чтобы я нашла стих по названию.\n Скажите "Искать по автору", чтобы я нашла стих по автору.'],
  SELECT_BY_AUTHOR_SCENE: ['Назовите автора, чтобы я нашла его стихи'],
  SELECT_BY_NAME_SCENE: ['Скажите название стиха, чтобы я постаралась его найти'],
  SELECT_LIST_SCENE: ['Для перемещения скажите "Далее/Назад"\nДля перехода к поиску, скажите "Поиск"'],
};

// const atMenu = new Scene(MENU_SCENE);
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

const addSceneHistory = (session: ISession, newSceneName: SceneType): void => {
  const arr = (session.get('sceneHistory') || []) as SceneType[];
  arr.push(newSceneName);
  session.set('sceneHistory', arr);
};

interface ILearnData {
  poem: IPoem;
  textType: PoemTextType;
  blocksCount: number;
  currentBlock: IBlockInfo;
  currentRow: IRowInfo;
}

type PoemTextType = 'full' | 'block' | 'row';

interface IBlockInfo {
  index: number;
  isLast: boolean;
  rowsCount: number;
  learnedRows: number[];
  complited: boolean;
}

interface IRowInfo {
  index: number;
  isLast: boolean;
}

const getOldLearnData = (session: ISession) => session.get<ILearnData>('learnData');

const getNewLearnData = (poem: IPoem, textType: PoemTextType, currentBlockIndex = 0, currentRowIndex = 0): ILearnData | null => {
  const poemBlocks = BaseBlocks[poem.id];
  if (currentBlockIndex > poemBlocks.length - 1) return null;
  const rows = poemBlocks[currentBlockIndex];
  const blocksCount = poemBlocks.length - 1;
  const rowsCount = Math.ceil(rows.length / ROWS_COUNT);
  return {
    poem,
    textType,
    blocksCount,
    currentBlock: {
      index: currentBlockIndex,
      rowsCount,
      complited: false,
      isLast: poemBlocks.length === currentBlockIndex,
      learnedRows: [0],
    },
    currentRow: {
      index: currentRowIndex,
      isLast: rowsCount === currentRowIndex + 1,
    },
  };
};

const saveLearnData = (session: ISession, data: ILearnData) => session.set('learnData', data); // !

const getPoemText = (selectedPoemBlocks: string[][], currentBlock: IBlockInfo, currentRow: IRowInfo, type: PoemTextType) => {
  const oldBlocksText = selectedPoemBlocks.slice(0, currentBlock.index).reduce((res, item) => res + item.join('\n') + '\n\n', '');
  const oldRowsText = selectedPoemBlocks[currentBlock.index].slice(0, currentRow.index * ROWS_COUNT).join('\n');
  const currentRowText = selectedPoemBlocks[currentBlock.index].slice(currentRow.index * ROWS_COUNT, currentRow.index * ROWS_COUNT + ROWS_COUNT).join('\n');
  switch (type) {
    case 'full':
      if (!oldRowsText) return oldBlocksText + currentRowText;
      return oldBlocksText + oldRowsText + '\n' + currentRowText;
    case 'block':
      if (!oldRowsText) return currentRowText;
      return oldRowsText + '\n' + currentRowText;
    case 'row':
      return currentRowText;
    default:
      return currentRowText;
  }
};

const getCurrentText = (learnData: ILearnData) => {
  const { poem, currentBlock, currentRow, textType } = learnData;
  const selectedPoemBlocks = BaseBlocks[poem.id];
  return getPoemText(selectedPoemBlocks, currentBlock, currentRow, textType);
};

const atLearn = new Scene(LEARN_SCENE);

const compareText = (text1: string, text2: string) => {
  return Math.random() > 0.1;
};

atLearn.any((ctx) => {
  const learnData = getOldLearnData(ctx.session);
  const text = getCurrentText(learnData);
  if (compareText(text, ctx.message)) {
    const { currentBlock, currentRow, poem } = learnData;
    if (currentRow.isLast && currentBlock.learnedRows.includes(currentRow.index)) {
      if (currentBlock.isLast) {
        console.log('currentBlock is last');
        return Reply.text(getCurrentText({ ...learnData, textType: 'full' }));
      }
      console.log('currentRow is last');
      if (currentBlock.rowsCount > 1 && currentBlock.index != 0 && !currentBlock.complited) {
        console.log('currentBlock is not complited');
        currentBlock.complited = true;
        const nextLearnData = { ...learnData, currentBlock, textType: 'full' } as ILearnData;
        saveLearnData(ctx.session, nextLearnData);
        return Reply.text(getCurrentText(nextLearnData));
      } else {
        console.log('currentBlock is complited');
        const nextLearnData = getNewLearnData(poem, 'block', currentBlock.index + 1, 0);
        if (!nextLearnData) {
          ctx.leave();
          return Reply.text('Переход в меню');
        }
        saveLearnData(ctx.session, nextLearnData);
        return Reply.text(getCurrentText(nextLearnData));
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
        return Reply.text(getCurrentText(nextLearnData));
      } else {
        currentBlock.learnedRows.push(currentRow.index);
        console.log('repeat block');
        const nextLearnData = { ...learnData, currentBlock, textType: 'block' } as ILearnData;
        saveLearnData(ctx.session, nextLearnData);
        return Reply.text(getCurrentText(nextLearnData));
      }
    }
  } else {
    return Reply.text(`Вы допустили ошибку. Повторите еще раз\n\n${text}`);
  }
});

atLearn.command(...exitHandler);

atLearn.command(...backHandler);

const atSelectMenu = new Scene(SELECT_MENU_SCENE);

atSelectMenu.command(/назван/i, (ctx) => {
  addSceneHistory(ctx.session, SELECT_BY_NAME_SCENE);
  ctx.enter(SELECT_BY_NAME_SCENE);
  const message = String(sample(sceneMessages['SELECT_BY_NAME_SCENE']));
  return Reply.text(message);
});

atSelectMenu.command(/писател|автор|имя|имени/i, (ctx) => {
  addSceneHistory(ctx.session, SELECT_BY_AUTHOR_SCENE);
  ctx.enter(SELECT_BY_AUTHOR_SCENE);
  const message = String(sample(sceneMessages['SELECT_BY_AUTHOR_SCENE']));
  return Reply.text(message);
});

atSelectMenu.command(/рейтинг/i, () => Reply.text('Рейтинг стихов можете посмотреть на сайте', { buttons: [Markup.button({ url: 'https://www.google.com', title: 'Перейти на сайт' })] }));

atSelectMenu.command(...exitHandler);

atSelectMenu.command(...backHandler);

atSelectMenu.any((ctx) => {
  const entities = ctx.nlu?.entities;
  // if (!entities?.length) return wrongHandler(ctx);
  const names = entities?.filter((item) => item.type === 'YANDEX.FIO').map((item) => item.value as IApiEntityYandexFioValue);
  const q = ctx.message;
  const res = findPoemsByAll(q);
  const items = Object.values(res).sort((a, b) => levenshtein(a.author + a.title, q) - levenshtein(b.author + b.title, q));
  if (items.length) {
    const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${author} - ${title}`));
    saveSelectListData(ctx.session, { items, offset: 0, query: q, key: 'author' });
    ctx.enter(SELECT_LIST_SCENE);
    return Reply.text('Вот что я нашел:\nДля перемещения скажи "Далее/Назад"', { buttons });
  } else if (names?.length) {
    const name = `${names[0].first_name ?? ''} ${names[0].last_name ?? ''}`.trim();
    const res = findPoemsBy('author', name);
    const items = Object.values(res).sort((a, b) => levenshtein(a.author, name) - levenshtein(b.author, name));
    if (!items.length) return Reply.text(`Не нашел автора "${ctx.message}"`);
    const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${author} - ${title}`));
    saveSelectListData(ctx.session, { items, offset: 0, query: name, key: 'author' });
    ctx.enter(SELECT_LIST_SCENE);
    return Reply.text('Вот что я нашел:\nДля перемещения скажи "Далее/Назад"', { buttons });
  }
  // console.log(ctx);
  return wrongHandler(ctx);
});

const atSelectByName = new Scene(SELECT_BY_NAME_SCENE);

// atSelectByName.command(/совет|посоветуй|рекомендация|не знаю/, () => Reply.text(`${sample(BaseItems.map((item) => item.title))} - хороший вариант!`));

atSelectByName.any((ctx) => {
  const q = ctx.message;
  const res = findPoemsBy('title', q);
  const items = Object.values(res).sort((a, b) => levenshtein(a.title, q) - levenshtein(b.title, q));
  if (!items.length) return Reply.text(`Не нашел автора "${ctx.message}"`);
  const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${author} - ${title}`));
  saveSelectListData(ctx.session, { items, offset: 0, query: q, key: 'title' });
  ctx.enter(SELECT_LIST_SCENE);
  return Reply.text('Вот что я нашел:\nДля перемещения скажи "Далее/Назад"', { buttons });
});

atSelectByName.command(...backHandler);

atSelectByName.command(...exitHandler);

const atSelectByAuthor = new Scene(SELECT_BY_AUTHOR_SCENE);

// atSelectByAuthor.command(/совет|посоветуй|рекомендация|не знаю/, () => Reply.text(`${sample(BaseItems.map((item) => item.author))} - хороший вариант!`));

atSelectByAuthor.any((ctx) => {
  console.log(ctx);
  const entities = ctx.nlu?.entities;
  const names = entities?.filter((item) => item.type === 'YANDEX.FIO').map((item) => item.value as IApiEntityYandexFioValue);
  if (!names?.length) return Reply.text(`Не нашел автора "${ctx.message}"`);
  const name = `${names[0].first_name ?? ''} ${names[0].last_name ?? ''}`.trim();
  const res = findPoemsBy('author', name);
  const items = Object.values(res).sort((a, b) => levenshtein(a.author, name) - levenshtein(b.author, name));
  if (!items.length) return Reply.text(`Не нашел автора "${ctx.message}"`);
  const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${author} - ${title}`));
  saveSelectListData(ctx.session, { items, offset: 0, query: name, key: 'author' });
  ctx.enter(SELECT_LIST_SCENE);
  return Reply.text('Вот что я нашел:\nДля перемещения скажи "Далее/Назад"', { buttons });
});

atSelectByAuthor.command(...backHandler);

atSelectByAuthor.command(...exitHandler);

const deleteSelectData = (session: ISession) => session.delete('selectListData');

const getSelectListData = (session: ISession): ISelectListData => session.get<ISelectListData>('selectListData');

const saveSelectListData = (session: ISession, newData: ISelectListData) => session.set('selectListData', newData); // !

interface ISelectListData {
  key: FindProperty;
  query: string;
  offset: number;
  items: IPoem[];
}

const atSelectList = new Scene(SELECT_LIST_SCENE);

atSelectList.command('Далее', (ctx) => {
  const selectListData = getSelectListData(ctx.session);
  console.log(selectListData);
  if (!selectListData) return Reply.text('error');
  const { offset, key, query } = selectListData;
  const newOffset = offset + 5;
  const res = findPoemsBy(key, query, newOffset);
  console.log(res);
  const newItems = Object.values(res).sort((a, b) => levenshtein(a[key], query) - levenshtein(b[key], query));
  const buttons = newItems.map(({ title, author }, i) => Markup.button(`${newOffset + i + 1}). ${author} - ${title}`));
  const text = String(sample(sceneMessages['SELECT_LIST_SCENE']));
  saveSelectListData(ctx.session, { ...selectListData, items: newItems, offset: newOffset });
  return Reply.text(text, { buttons });
});

atSelectList.command('Назад', (ctx) => {
  const selectListData = getSelectListData(ctx.session);
  console.log(selectListData);
  if (!selectListData) return Reply.text('error');
  const { items, offset, key, query } = selectListData;
  if (offset === 0) {
    const buttons = items.map(({ title, author }, i) => Markup.button(`${offset + i + 1}). ${author} - ${title}`));
    return Reply.text('Вы не можете сделать шаг назад - это первый лист', { buttons });
  }
  const newOffset = offset - 5;
  const res = findPoemsBy(key, query, newOffset);
  console.log(res);
  const newItems = Object.values(res).sort((a, b) => levenshtein(a[key], query) - levenshtein(b[key], query));
  const buttons = newItems.map(({ title, author }, i) => Markup.button(`${newOffset + i + 1}). ${author} - ${title}`));
  const text = String(sample(sceneMessages['SELECT_LIST_SCENE']));
  saveSelectListData(ctx.session, { ...selectListData, items: newItems, offset: newOffset });
  return Reply.text(text, { buttons });
});

atSelectList.command('Поиск', (ctx) => {
  deleteSelectData(ctx.session);
  const text = String(sample(sceneMessages['SELECT_MENU_SCENE']));
  ctx.enter(SELECT_MENU_SCENE);
  return Reply.text(text);
});

atSelectList.any((ctx) => {
  const entities = ctx.nlu?.entities;
  if (entities?.length) {
    const numbers = entities.filter((item) => item.type === 'YANDEX.NUMBER');
    if (numbers.length) {
      const selectListData = getSelectListData(ctx.session);
      console.log(selectListData);
      if (!selectListData) return Reply.text('error');
      const { items, offset } = selectListData;
      const itemNumbers = items.map((_, i) => i + offset + 1);
      console.log(itemNumbers);
      const currentNumber = numbers.find((item) => itemNumbers.includes(Number(item.value)))?.value;
      console.log(currentNumber);
      const selectedPoem = items.find((_, i) => i + offset + 1 === currentNumber);
      if (selectedPoem) {
        ctx.enter(LEARN_SCENE);
        const learnData = getNewLearnData(selectedPoem, 'row');
        if (!learnData) {
          ctx.leave();
          return Reply.text('Переход в меню');
        }
        const text = getCurrentText(learnData);
        saveLearnData(ctx.session, learnData);
        return Reply.text(`Ты выбрал ${selectedPoem.author} - ${selectedPoem.title}\n\n${text}`.substring(0, 128));
      }
    }
  }
  return Reply.text(ctx.message);
});

alice.command('', () => {
  return Reply.text(`Добро пожаловать в “Навык изучениия стихов”.
${sample(['Здесь вы можете выучить стихотворение.', 'Я помогу вам выучить стихотворение.'])}
Вы уже знакомы с тем, что я умею?`);
});

alice.command(/да|знаком/i, () =>
  Reply.text(`Итак, что будем учить сегодня?
Скажите “давай продолжим учить”, чтобы продолжить учить стихотворение.
Скажите “давай выучим новое стихотворение”, чтобы начать учить новое стихотворение.`)
);

alice.command(/новый|новое|другое|найти|поиск/i, (ctx) => {
  const c = ctx as IStageContext;
  addSceneHistory(c.session, SELECT_MENU_SCENE);
  c.enter(SELECT_MENU_SCENE);
  const message = String(sample(sceneMessages['SELECT_MENU_SCENE']));
  return Reply.text(message);
});

alice.command(/учить|продолжи/i, (ctx) => {
  const c = ctx as IStageContext;
  addSceneHistory(c.session, LEARN_SCENE);
  c.enter(LEARN_SCENE);
  const message = String(sample(sceneMessages['LEARN_SCENE']));
  return Reply.text(message);
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

alice.registerScene(atLearn);
alice.registerScene(atSelectMenu);
alice.registerScene(atSelectByName);
alice.registerScene(atSelectByAuthor);
alice.registerScene(atSelectList);

alice.listen(port);
console.log(1);

const findByTag = (queryOriginal: string): IPoemsData => {
  const query = queryOriginal.toLowerCase();
  return Object.entries(Base)
    .filter(([, value]) => value.tags.includes(query))
    .reduce((acc, [key, item]) => ({ ...acc, [key]: item }), {} as IPoemsData);
};

interface IAuthorInfo {
  name: string;
  poemsCount: number;
}

// const findAuthor = (query: string): IAuthorInfo | null => {
//   const regExp = new RegExp(query.toLowerCase(), 'gi');
//   const authorName = BaseItems.find(({ author }) => author.match(regExp))?.author;
//   if (!authorName) return null;
//   const poemsCount = BaseItems.filter(({ author }) => author.match(regExp)).length;
//   return { name: authorName, poemsCount };
// };

type FindProperty = 'title' | 'first_line' | 'author';

const findPoemsByAll = (query: string, offset = 0): IPoemsData => {
  // const query = queryOriginal;
  const regExp = new RegExp(query.toLowerCase(), 'gi');
  const limit = 5;
  return BaseItems.filter(({ author, title }) => (author + title).match(regExp))
    .slice(offset, offset + limit)
    .reduce((acc, item) => ({ ...acc, [String(item.id)]: item }), {} as IPoemsData);
};

const findPoemsBy = (key: FindProperty, query: string, offset = 0): IPoemsData => {
  // const query = queryOriginal;
  const regExp = new RegExp(query.toLowerCase(), 'gi');
  const limit = 5;
  return BaseItems.filter((value) => value[key].match(regExp))
    .slice(offset, offset + limit)
    .reduce((acc, item) => ({ ...acc, [String(item.id)]: item }), {} as IPoemsData);
};
