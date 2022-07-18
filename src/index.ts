import { Alice, CommandCallback, IContext, ISession, IStageContext, Markup, Reply, Scene } from 'yandex-dialogs-sdk';
import { IApiEntityYandexFio, IApiEntityYandexFioValue } from 'yandex-dialogs-sdk/dist/api/nlu';
import { CommandDeclaration } from 'yandex-dialogs-sdk/dist/command/command';
import { sample } from 'lodash';
import { searchPoems } from './Base';
// import { searchPoems } from './Base';
type IHandlerType = [declaration: CommandDeclaration<IStageContext>, callback: CommandCallback<IStageContext>];

interface IApiEntityYandexFioNew extends IApiEntityYandexFio {
  tokens: { start: number; end: number };
}

const port = Number(process.env.PORT) || 3000;
const ROWS_COUNT = 2;
const alice = new Alice();

const exitHandler: IHandlerType = [
  ['выйти', 'хватит', 'стоп', 'я устал'],
  (ctx) => {
    ctx.leave();
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
  if (!currentScene) return Reply.text('К сожалению я не поняла, что Вы хотели сказать, повторите пожалуйста.');
  const hint = String(sample(sceneHints[currentScene]));
  return Reply.text(hint);
};

const FIND_MENU_SCENE: SceneType = 'FIND_MENU_SCENE';
const SELECT_LIST_SCENE: SceneType = 'SELECT_LIST_SCENE';
const LEARN_SCENE: SceneType = 'LEARN_SCENE';

const sceneMessages: Record<SceneType, string[]> = {
  LEARN_SCENE: ['Начинаем учить'],
  FIND_MENU_SCENE: ['Я могу найти стих по автору или по названию. Также можете взглянуть на рейтинг'],
  SELECT_LIST_SCENE: ['Выбери стих из списка\n Для перемещения скажите "Далее/Назад"\nДля перехода к поиску, скажите "Поиск"'],
};

const sceneHints: Record<SceneType, string[]> = {
  LEARN_SCENE: ['Учите, ничем не могу помочь'],
  FIND_MENU_SCENE: ['Скажите "Искать по названию", чтобы я нашла стих по названию.\n Скажите "Искать по автору", чтобы я нашла стих по автору.'],
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

const addSceneHistory = (session: ISession, newSceneName: SceneType): void => {
  const arr = (session.get('sceneHistory') || []) as SceneType[];
  arr.push(newSceneName);
  session.set('sceneHistory', arr);
};

const getOldLearnData = (session: ISession) => session.get<ILearnData>('learnData');

const getBlocksData = (text: string) => text.split('\n\n').map((item) => item.split('\n'));

const getNewLearnData = (poem: IPoem, textType: PoemTextType, currentBlockIndex = 0, currentRowIndex = 0): ILearnData | null => {
  const blocksData = getBlocksData(poem.text);
  if (currentBlockIndex > blocksData.length - 1) return null;
  const rows = blocksData[currentBlockIndex];
  const blocksCount = blocksData.length - 1;
  const rowsCount = Math.ceil(rows.length / ROWS_COUNT);
  return {
    poem,
    blocksData,
    textType,
    errorCount: 0,
    canLearnNext: false,
    blocksCount,
    currentBlock: {
      index: currentBlockIndex,
      rowsCount,
      complited: false,
      isLast: blocksData.length === currentBlockIndex,
      learnedRows: [0],
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

const compareText = (text1: string, text2: string) => {
  // return Math.random() > 0.1;
  return true;
};

const deleteSelectData = (session: ISession) => session.delete('selectListData');

const getSelectListData = (session: ISession): ISelectListData => session.get<ISelectListData>('selectListData');

const saveSelectListData = (session: ISession, newData: ISelectListData) => session.set('selectListData', newData); // !

const atLearn = new Scene(LEARN_SCENE);

atLearn.command(/дальше/, (ctx) => {
  const learnData = getOldLearnData(ctx.session);
  console.log('currentBlock is complited');
  const { currentBlock, poem } = learnData;
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

atLearn.any((ctx) => {
  const learnData = getOldLearnData(ctx.session);
  const poemText = getPoemText(learnData);
  if (compareText(poemText, ctx.message)) {
    const { currentBlock, currentRow, poem } = learnData;
    if (currentRow.isLast && currentBlock.learnedRows.includes(currentRow.index)) {
      if (currentBlock.isLast) {
        console.log('currentBlock is last');
        return Reply.text(getPoemText({ ...learnData, textType: 'full' }));
      }
      console.log('currentRow is last');
      if (currentBlock.rowsCount > 1 && currentBlock.index != 0 && !currentBlock.complited && currentBlock.rowsCount > 2) {
        console.log('currentBlock is not complited');
        currentBlock.complited = true;
        const nextLearnData = { ...learnData, currentBlock, textType: 'full' } as ILearnData;
        saveLearnData(ctx.session, nextLearnData);
        const text = 'Молодец! Блок закончен, теперь повтори его полностью:\n\n' + getPoemText(nextLearnData);
        return Reply.text(text);
      } else {
        return Reply.text('Двигаемся дальше, потворяем блок или весь стих?');
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
  } else {
    saveLearnData(ctx.session, { ...learnData, errorCount: learnData.errorCount + 1 });
    return Reply.text(`Вы допустили ошибку. Повторите еще раз\n\n${poemText}`);
  }
});
atLearn.command(...exitHandler);
atLearn.command(...backHandler);

// atFindMenu.command(/назван/i, (ctx) => {
//   addSceneHistory(ctx.session, SELECT_BY_NAME_SCENE);
//   ctx.enter(SELECT_BY_NAME_SCENE);
//   const message = String(sample(sceneMessages['SELECT_BY_NAME_SCENE']));
//   return Reply.text(message);
// });

// atFindMenu.command(/писател|автор|имя|имени/i, (ctx) => {
//   addSceneHistory(ctx.session, SELECT_BY_AUTHOR_SCENE);
//   ctx.enter(SELECT_BY_AUTHOR_SCENE);
//   const message = String(sample(sceneMessages['SELECT_BY_AUTHOR_SCENE']));
//   return Reply.text(message);
// });
const atFindMenu = new Scene(FIND_MENU_SCENE);
atFindMenu.command(/рейтинг/i, () => Reply.text('Рейтинг стихов можете посмотреть на сайте', { buttons: [Markup.button({ url: 'https://www.google.com', title: 'Перейти на сайт' })] }));
atFindMenu.command(...exitHandler);
atFindMenu.command(...backHandler);
atFindMenu.any(async (ctx) => {
  const entities = ctx.nlu?.entities;
  console.log(entities);
  let author = 'Не задан';
  let title = `${ctx.message[0].toUpperCase()}${ctx.message.slice(1).toLocaleLowerCase()}`;
  const names = entities
    ?.filter((item) => item.type === 'YANDEX.FIO')
    .map((item) => item as IApiEntityYandexFioNew)
    .filter((item) => !!item.value.first_name);
  if (names?.length) {
    const namesCount = names.length - 1;
    const name = names[namesCount];
    if (names?.length) {
      const first_name = `${name.value.first_name![0].toUpperCase()}${name.value.first_name!.slice(1).toLocaleLowerCase()}`;
      const last_name = `${name.value.last_name?.[0].toUpperCase() ?? ''}${name.value.last_name?.slice(1).toLocaleLowerCase() ?? ''}`;
      author = `${first_name} ${last_name}`.trim();
      const words = title.split(' ');
      words.splice(name.tokens.start, name.tokens.end - name.tokens.start);
      title = words.join(' ');
      if (title.length) {
        title = `${title[0].toUpperCase()}${title.slice(1).toLowerCase()}`;
      }
    }
  }
  const text = `Параметры поиска: 
Автор: ${author}
Название: ${title}`;
  const items = await searchPoems(author, title);
  let tts = 'Ничего не смог найти';
  const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${author} | ${title}`.substring(0, 128)));
  if (buttons.length) {
    tts = 'Вот что я нашел. Для выбора, назовите номер. Для выхода, скажите "Поиск"';
    saveSelectListData(ctx.session, { items });
    ctx.enter(SELECT_LIST_SCENE);
  }
  return Reply.text({ text, tts }, { buttons });
  //   const res = findPoemsByAll(q);
  //   const items = Object.values(res).sort((a, b) => levenshtein(a.author + a.title, q) - levenshtein(b.author + b.title, q));
  //   if (items.length) {
  //     const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${author} - ${title}`));
  //     saveSelectListData(ctx.session, { items, offset: 0, query: q, key: 'author' });
  //     ctx.enter(SELECT_LIST_SCENE);
  //     return Reply.text('Вот что я нашел:\nДля перемещения скажи "Далее/Назад"', { buttons });
  //   } else if (names?.length) {
  //     const name = `${names[0].first_name ?? ''} ${names[0].last_name ?? ''}`.trim();
  //     const res = findPoemsBy('author', name);
  //     const items = Object.values(res).sort((a, b) => levenshtein(a.author, name) - levenshtein(b.author, name));
  //     if (!items.length) return Reply.text(`Не нашел автора "${ctx.message}"`);
  //     const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${author} - ${title}`));
  //     saveSelectListData(ctx.session, { items, offset: 0, query: name, key: 'author' });
  //     ctx.enter(SELECT_LIST_SCENE);
  //     return Reply.text('Вот что я нашел:\nДля перемещения скажи "Далее/Назад"', { buttons });
  //   }
  // console.log(ctx);
  //   return wrongHandler(ctx);
});

// const atSelectByName = new Scene(SELECT_BY_NAME_SCENE);

// atSelectByName.command(/совет|посоветуй|рекомендация|не знаю/, () => Reply.text(`${sample(BaseItems.map((item) => item.title))} - хороший вариант!`));

// atSelectByName.any((ctx) => {
//   const q = ctx.message;
//   return Reply.text('1');
//   const res = findPoemsBy('title', q);
//   const items = Object.values(res).sort((a, b) => levenshtein(a.title, q) - levenshtein(b.title, q));
//   if (!items.length) return Reply.text(`Не нашел автора "${ctx.message}"`);
//   const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${author} - ${title}`));
//   saveSelectListData(ctx.session, { items, offset: 0, query: q, key: 'title' });
//   ctx.enter(SELECT_LIST_SCENE);
//   return Reply.text('Вот что я нашел:\nДля перемещения скажи "Далее/Назад"', { buttons });
// });

// atSelectByName.command(...backHandler);

// atSelectByName.command(...exitHandler);

// const atSelectByAuthor = new Scene(SELECT_BY_AUTHOR_SCENE);

// atSelectByAuthor.command(/совет|посоветуй|рекомендация|не знаю/, () => Reply.text(`${sample(BaseItems.map((item) => item.author))} - хороший вариант!`));

// atSelectByAuthor.any((ctx) => {
//   console.log(ctx);
//   const entities = ctx.nlu?.entities;
//   const names = entities?.filter((item) => item.type === 'YANDEX.FIO').map((item) => item.value as IApiEntityYandexFioValue);
//   if (!names?.length) return Reply.text(`Не нашел автора "${ctx.message}"`);
//   const name = `${names[0].first_name ?? ''} ${names[0].last_name ?? ''}`.trim();
//   return Reply.text('1');
//   const res = findPoemsBy('author', name);
//   const items = Object.values(res).sort((a, b) => levenshtein(a.author, name) - levenshtein(b.author, name));
//   if (!items.length) return Reply.text(`Не нашел автора "${ctx.message}"`);
//   const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${author} - ${title}`));
//   saveSelectListData(ctx.session, { items, offset: 0, query: name, key: 'author' });
//   ctx.enter(SELECT_LIST_SCENE);
//   return Reply.text('Вот что я нашел:\nДля перемещения скажи "Далее/Назад"', { buttons });
// });

// atSelectByAuthor.command(...backHandler);

// atSelectByAuthor.command(...exitHandler);

const atSelectList = new Scene(SELECT_LIST_SCENE);
// atSelectList.command('Далее', (ctx) => {
// const selectListData = getSelectListData(ctx.session);
// console.log(selectListData);
// if (!selectListData) return Reply.text('error');
// const { offset, key, query } = selectListData;
// const newOffset = offset + 5;
// return Reply.text('1');
//   const res = findPoemsBy(key, query, newOffset);
//   console.log(res);
//   const newItems = Object.values(res).sort((a, b) => levenshtein(a[key], query) - levenshtein(b[key], query));
//   const buttons = newItems.map(({ title, author }, i) => Markup.button(`${newOffset + i + 1}). ${author} - ${title}`));
//   const text = String(sample(sceneMessages['SELECT_LIST_SCENE']));
//   saveSelectListData(ctx.session, { ...selectListData, items: newItems, offset: newOffset });
//   return Reply.text(text, { buttons });
// });
// atSelectList.command('Назад', (ctx) => {
//   const selectListData = getSelectListData(ctx.session);
//   console.log(selectListData);
//   if (!selectListData) return Reply.text('error');
//   const { items, offset, key, query } = selectListData;
//   if (offset === 0) {
//     const buttons = items.map(({ title, author }, i) => Markup.button(`${offset + i + 1}). ${author} - ${title}`));
//     return Reply.text('Вы не можете сделать шаг назад - это первый лист', { buttons });
//   }
//   const newOffset = offset - 5;
//   return Reply.text('1');
//   const res = findPoemsBy(key, query, newOffset);
//   console.log(res);
//   const newItems = Object.values(res).sort((a, b) => levenshtein(a[key], query) - levenshtein(b[key], query));
//   const buttons = newItems.map(({ title, author }, i) => Markup.button(`${newOffset + i + 1}). ${author} - ${title}`));
//   const text = String(sample(sceneMessages['SELECT_LIST_SCENE']));
//   saveSelectListData(ctx.session, { ...selectListData, items: newItems, offset: newOffset });
//   return Reply.text(text, { buttons });
// });
atSelectList.command('Поиск', (ctx) => {
  deleteSelectData(ctx.session);
  const text = String(sample(sceneMessages['FIND_MENU_SCENE']));
  ctx.enter(FIND_MENU_SCENE);
  return Reply.text(text);
});

atSelectList.command(/да|учим/, (ctx) => {
  const selectListData = getSelectListData(ctx.session);
  const { items, selectedPoem } = selectListData;
  if (!selectedPoem) {
    const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${author} | ${title}`.substring(0, 128)));
    return Reply.text({ text: 'Выберите стих из списка', tts: 'Сначала выберите стих' }, { buttons });
  }
  const learnData = getNewLearnData(selectedPoem, 'row');
  if (!learnData) {
    ctx.leave();
    return Reply.text('Ошибка.Переход в меню');
  }
  const text = getPoemText(learnData);
  saveLearnData(ctx.session, learnData);
  ctx.enter(LEARN_SCENE);
  return Reply.text('Повторите строку:\n\n' + text);
});

atSelectList.command(/нет|другой/, (ctx) => {
  const selectListData = getSelectListData(ctx.session);
  const { items } = selectListData;
  const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${author} | ${title}`.substring(0, 128)));
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
      if (selectedPoem) {
        const blocksData = getBlocksData(selectedPoem.text);
        const lastBlockIndex = blocksData.length - 1;
        const lastBlockRows = blocksData[lastBlockIndex];
        const lastBlockRowIndex = lastBlockRows.length - 1;
        const text = getPoemText(getNewLearnData(selectedPoem, 'full', lastBlockIndex, lastBlockRowIndex)!);
        saveSelectListData(ctx.session, { ...selectListData, selectedPoem });
        return Reply.text(`Ты выбрал ${selectedPoem.author} - ${selectedPoem.title}\n\n${text}\nУчим его?`);
      }
    }
  }
  const tts = String(sample(sceneHints['SELECT_LIST_SCENE']));
  const buttons = selectListData.items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${author} | ${title}`.substring(0, 128)));
  return Reply.text({ text: 'Выберите стих из списка:', tts }, { buttons });
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
alice.command(/новый|новое|другое|найти|поиск|искать/i, (ctx) => {
  const c = ctx as IStageContext;
  addSceneHistory(c.session, FIND_MENU_SCENE);
  c.enter(FIND_MENU_SCENE);
  const message = String(sample(sceneMessages['FIND_MENU_SCENE']));
  return Reply.text(message);
});
alice.command(/учить|продолжи/i, (ctx) => {
  //   const c = ctx as IStageContext;
  //   addSceneHistory(c.session, LEARN_SCENE);
  //   c.enter(LEARN_SCENE);
  //   const message = String(sample(sceneMessages['LEARN_SCENE']));
  return Reply.text('Я это еще не юмею');
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
alice.registerScene(atFindMenu);
alice.registerScene(atSelectList);
alice.listen(port);

console.log(1);

// const findByTag = (queryOriginal: string): IPoemsData => {
//   const query = queryOriginal.toLowerCase();
//   return Object.entries(Base)
//     .filter(([, value]) => value.tags.includes(query))
//     .reduce((acc, [key, item]) => ({ ...acc, [key]: item }), {} as IPoemsData);
// };

// const findAuthor = (query: string): IAuthorInfo | null => {
//   const regExp = new RegExp(query.toLowerCase(), 'gi');
//   const authorName = BaseItems.find(({ author }) => author.match(regExp))?.author;
//   if (!authorName) return null;
//   const poemsCount = BaseItems.filter(({ author }) => author.match(regExp)).length;
//   return { name: authorName, poemsCount };
// };

// const findPoemsByAll = (query: string, offset = 0): IPoemsData => {
//   // const query = queryOriginal;
//   const regExp = new RegExp(query.toLowerCase(), 'gi');
//   const limit = 5;
//   return BaseItems.filter(({ author, title }) => (author + title).match(regExp))
//     .slice(offset, offset + limit)
//     .reduce((acc, item) => ({ ...acc, [String(item.id)]: item }), {} as IPoemsData);
// };

// const findPoemsBy = (key: FindProperty, query: string, offset = 0): IPoemsData => {
//   // const query = queryOriginal;
//   const regExp = new RegExp(query.toLowerCase(), 'gi');
//   const limit = 5;
//   return BaseItems.filter((value) => value[key].match(regExp))
//     .slice(offset, offset + limit)
//     .reduce((acc, item) => ({ ...acc, [String(item.id)]: item }), {} as IPoemsData);
// };