import { CommandCallback, ISession, IStageContext, Reply, Scene } from 'yandex-dialogs-sdk';
import { IApiEntity, IApiEntityYandexFio } from 'yandex-dialogs-sdk/dist/api/nlu';
import { chunk, sample, truncate } from 'lodash';
import { CommandDeclaration } from 'yandex-dialogs-sdk/dist/command/command';
import { TextReplyDeclaration } from 'yandex-dialogs-sdk/dist/reply/textReplyBuilder';
import { cleanLog } from '../Base';
import readingTime from 'reading-time';

type IHandlerType = [declaration: CommandDeclaration<IStageContext>, callback: CommandCallback<IStageContext>];

interface IApiEntityYandexFioNew extends IApiEntityYandexFio {
  tokens: { start: number; end: number };
}

const ROWS_COUNT = 2;
const WORDS_PER_MINUTE = 40;

const LEARN_SCENE: SceneType = 'LEARN_SCENE';
const SET_AUTHOR_SCENE: SceneType = 'SET_AUTHOR_SCENE';
const SET_TITLE_SCENE: SceneType = 'SET_TITLE_SCENE';
const POEM_SCENE: SceneType = 'POEM_SCENE';

const GAMES_MENU_SCENE: SceneType = 'GAMES_MENU_SCENE';
const GAME_1_SCENE: SceneType = 'GAME_1_SCENE';
const GAME_2_SCENE: SceneType = 'GAME_2_SCENE';

const exitCommand = [
  'выход',
  'выйти',
  'я устал',
  'стоп',
  'конец',
  'пока',
  'до свидания',
  'хватит',
  'закрыть',
  'выключить',
  'мне надоело',
  'закончить',
  'стой',
  'остановись',
  'остановить',
  'завершить работу',
  'точка',
  'уйти',
];
const backCommand = ['назад', 'предыдущее', 'вернуться', 'отмена', 'возврат', 'обратно', 'вернись', 'верни', 'отмени'];
const helpCommand = ['помощь', 'помоги', 'хелп', 'help'];
const sceneNames: Record<SceneType, string> = {
  MENU: 'Меню',
  POEM_SCENE: 'Просмотре стиха',
  LEARN_SCENE: 'Зубрилке',
  SET_AUTHOR_SCENE: 'Выборе автора',
  SET_TITLE_SCENE: 'Выборе название',
  GAMES_MENU_SCENE: 'Выборе игры',
  GAME_1_SCENE: 'Игре "Продолжи строки"',
  GAME_2_SCENE: 'Игре "Заполни пропуски"',
};

const exitHandler: IHandlerType = [
  exitCommand,
  (ctx) => {
    ctx.enter('');
    if (loggingIsEnable(ctx.session)) cleanLog(ctx.userId);
    cleanSceneHistory(ctx.session);
    deleteSelectListData(ctx.session);
    deleteFindData(ctx.session);
    return Reply.text('Хорошо! Будет скучно - обращайся.', { end_session: true });
  },
];

const backHandler: IHandlerType = [
  backCommand,
  (ctx) => {
    const currentScene = getCurrentScene(ctx.session);
    if (currentScene === 'SET_AUTHOR_SCENE') {
      deleteFindData(ctx.session);
    } else if (currentScene === 'SET_TITLE_SCENE') {
      const findData = getFindData(ctx.session);
      if (findData) saveFindData(ctx.session, { author: findData.author, title: '', poems: [], items: [] });
    }
    const scene = removeSceneHistory(ctx.session);
    let message = String(sample(sceneMessages[scene]));
    if (scene === 'SET_TITLE_SCENE') {
      const findData = getFindData(ctx.session);
      if (findData) {
        message += findData.items.reduce((msg, item) => msg + `\n${item}`, '\n');
      }
    } else if (scene === 'POEM_SCENE') {
      {
        const findData = getFindData(ctx.session);
        if (findData && findData.selectedPoemId !== undefined) {
          const poem = findData.poems[findData.selectedPoemId];
          const newLearnData = getNewLearnData(poem, 'full', -1, -1);
          if (!newLearnData) return exitWithError(ctx, 'newLearnData not found');
          message += `${getAuthorName(poem.author)} - ${poem.title}.`;
        }
      }
    }
    ctx.enter(scene);
    return Reply.text(message);
  },
];

const helpHandler: IHandlerType = [
  helpCommand,
  (ctx) => {
    const scene = getCurrentScene(ctx.session);
    const sceneName = sceneNames[scene];
    const message = String(sample(sceneHints[scene]));
    return Reply.text(`Ты находишься в ${sceneName}.
${message}`);
  },
];

const sceneMessages: Record<SceneType, string[]> = {
  MENU: ['Вернулись в меню.\n Скажите "Найти", чтобы начать новый поиск.', 'Вернулись в меню.\n Скажите "Стих дня", чтобы посмотреть стих дня.'],
  LEARN_SCENE: ['Cкажи "Дальше", чтобы начать учить новую строку.'],
  SET_AUTHOR_SCENE: ['Назови имя/фамилию автора или скажи "Пропустить", чтобы перейти к поиску по названию.'],
  SET_TITLE_SCENE: ['Скажи название стиха или назови номер одного из найденых.'],
  POEM_SCENE: ['Текущий стих: '],
  GAMES_MENU_SCENE: ['Режим создан для проверки знаний стиха.\nДля начала, назови номер игры из списка\n1.)Игра "Продолжи строки".\n2.)Игра "Заполни пропуски".'],
  GAME_1_SCENE: [
    'В этой игре стих делится на блоки по две строки. Я говорю первую строку, даю тебе время вспомнить вторую и слушаю ответ.\nЕсли он совпадает с оригиналом на 60% - ты получаешь балл.\n\nСкажи "Начать", для запуска игры.',
  ],
  GAME_2_SCENE: [
    'В этой игре стих делится на блоки по две строки. Я говорю текст блока, но закрываю в нем некоторые слова; даю тебе время подумать и слушаю полный текст блока\nЕсли он совпадает с оригиналом на 80% - ты получаешь балл.\n\nСкажи "Начать", для запуска игры.',
  ],
};

const sceneHints: Record<SceneType, TextReplyDeclaration[]> = {
  MENU: ["Ты можешь сказать мне одну из команд: 'Учить', 'Найти' или 'Стих дня'\nСкажи 'Я устал', для завершения чата."],
  LEARN_SCENE: [
    "Я буду произносить строку и давать время на ее повторение.\nСкажи 'Дальше', чтобы начать учить новую строку.\nТакже можешь сказать: 'Повтори', 'Повтори стих', 'Повтори блок' или 'Назад'\nСкажи 'Я устал', для завершения чата.",
  ],
  SET_AUTHOR_SCENE: ["Назови имя/фамилию автора или скажи 'Пропустить', чтобы перейти к поиску по названию.\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
  SET_TITLE_SCENE: ["Скажи название стиха или назови номер одного из найденых.\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
  POEM_SCENE: ["Ты можешь сказать мне одну из команд: 'Прочитай', 'Учить', 'Поиск', 'Играть' или 'Назад'\nСкажи 'Я устал', для завершения чата."],
  GAMES_MENU_SCENE: ["Для начала, назови номер игры из списка\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
  GAME_1_SCENE: ["Прослушай первую строку блока и назови вторую, чтобы двигаться дальше.\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
  GAME_2_SCENE: ["Прослушай текст блока с закртыми словами и назови полный текст, чтобы двигаться дальше.\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
};

const enableLogging = (session: ISession) => session.set('logging', true);

const loggingIsEnable = (session: ISession) => session.has('logging');

const getCurrentScene = (session: ISession): SceneType => {
  const arr = (session.get('sceneHistory') || []) as SceneType[];
  return arr[arr.length - 1] ?? 'MENU';
};

const removeSceneHistory = (session: ISession): SceneType => {
  const arr = (session.get('sceneHistory') || []) as SceneType[];
  arr.pop();
  session.set('sceneHistory', arr);
  return arr[arr.length - 1] ?? 'MENU';
};

const cleanSceneHistory = (session: ISession): void => session.set('sceneHistory', []);

const addSceneHistory = (session: ISession, newSceneName: SceneType): void => {
  const arr = (session.get('sceneHistory') || []) as SceneType[];
  arr.push(newSceneName);
  session.set('sceneHistory', [...new Set(arr)]);
};

const getPoemText = (learnData: ILearnData) => {
  const { currentBlock, currentRow, textType, blocksData } = learnData;
  const oldBlocksText = blocksData.slice(0, currentBlock.index).reduce((res, item) => res + item.join('\n') + '\n\n', '');
  const oldRowsText = blocksData[currentBlock.index].slice(0, currentRow.index * ROWS_COUNT).join('\n');
  const currentRowText = blocksData[currentBlock.index].slice(currentRow.index * ROWS_COUNT, currentRow.index * ROWS_COUNT + ROWS_COUNT).join('\n');
  switch (textType) {
    case 'full':
      if (!oldRowsText) return truncate(oldBlocksText + currentRowText, { length: 900 });
      return truncate(oldBlocksText + oldRowsText + '\n' + currentRowText, { length: 900 });
    case 'block':
      if (!oldRowsText) return truncate(currentRowText, { length: 900 });
      return truncate(oldRowsText + '\n' + currentRowText, { length: 900 });
    case 'row':
      return truncate(currentRowText, { length: 900 });
    default:
      return truncate(currentRowText, { length: 900 });
  }
};

const extractAuthor = (entities?: IApiEntity[]): IAuthor | null => {
  const names = entities?.filter((item) => item.type === 'YANDEX.FIO').map((item) => item as IApiEntityYandexFioNew);
  if (!names?.length) return null;
  const namesCount = names.length - 1;
  const name = names[namesCount];
  const firstName = `${name.value.first_name?.[0].toUpperCase() ?? ''}${name.value.first_name?.slice(1).toLocaleLowerCase() ?? ''}`;
  const lastName = `${name.value.last_name?.[0].toUpperCase() ?? ''}${name.value.last_name?.slice(1).toLocaleLowerCase() ?? ''}`;
  return { firstName, lastName };
};

const getAuthorName = (author: IAuthor, short?: boolean): string => `${(short && author.firstName ? `${author.firstName[0]}.` : author.firstName) ?? ''} ${author.lastName ?? ''}`.trim();

const getAllSessionData = (session?: ISession) => {
  if (!session)
    return {
      error: 'Session not found',
    };
  const functions: Record<string, (session: ISession) => unknown> = {
    currentScene: getCurrentScene,
    gamesData: getGamesData,
    game2Data: getGame2Data,
    game1Data: getGame1Data,
    errorsList: getErrorsList,
    sceneHistory: (session) => session.get('sceneHistory'),
    findData: getFindData,
    learnData: getOldLearnData,
  };
  const res: Record<string, any> = Object.entries(functions).reduce((acc, [name, func]) => ({ ...acc, [name]: func(session) ?? null }), {});
  return res;
};

const deleteLearnData = (session: ISession) => session.delete('learnData');

const getOldLearnData = (session: ISession) => session.get<ILearnData | undefined>('learnData');

const getBlocksData = (text: string) => text.split('\n\n').map((item) => item.split('\n'));

const getNewLearnData = (poem: IPoem, textType: PoemTextType, currentBlockIndex = 0, currentRowIndex = 0): ILearnData | null => {
  const blocksData = getBlocksData(poem.text);
  const blocksCount = blocksData.length;
  if (currentBlockIndex > blocksCount - 1) return null;
  if (currentBlockIndex < 0) currentBlockIndex = blocksData.length - 1;
  const rows = blocksData[currentBlockIndex];
  if (currentRowIndex < 0) currentRowIndex = rows.length - 1;
  const rowsCount = Math.ceil(rows.length / ROWS_COUNT);
  const learnedRows = [0];
  return {
    poem,
    blocksData,
    poemСomplited: false,
    textType,
    errorCount: 0,
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

const getDelaySendText = (text: string, isEnd?: boolean): string => {
  const delay = getTextReadingMs(text);
  console.log(delay);
  const end = isEnd ? 'завершению' : 'следующей строке';
  return `sil <[${delay}]> Скажи "Дальше", чтобы перейти к ${end}`;
};

const goLearnNext = (ctx: IStageContext, learnData: ILearnData) => {
  const { currentBlock, currentRow, poem, poemСomplited } = learnData;
  if (currentRow.isLast && currentBlock.learnedRows.includes(currentRow.index)) {
    if (currentBlock.isLast) {
      console.log('currentBlock is last');
      if (!poemСomplited) {
        const poemText = getPoemText({ ...learnData, textType: 'full' });
        const text = 'Повтори стих целиком.\n\n' + poemText;
        saveLearnData(ctx.session, { ...learnData, poemСomplited: true });
        return Reply.text({ text, tts: text + getDelaySendText(poemText, true) });
      } else {
        deleteLearnData(ctx.session);
        // deleteFindData(ctx.session);
        const scene = removeSceneHistory(ctx.session);
        const text = 'Поздравляю! Ты выучил новый стих.';
        ctx.enter(scene);
        return Reply.text({ text, tts: text + 'Скажи "Игра" или "Записать", чтобы проверить себя или записать чтение. Скажи "Поиск", чтобы найти новый стих' });
      }
    }
    console.log('currentRow is last');
    if (currentBlock.rowsCount > 1 && currentBlock.index != 0 && !currentBlock.complited && currentBlock.rowsCount > 2) {
      currentBlock.complited = true;
      console.log('currentBlock is not complited');
      const nextLearnData = { ...learnData, currentBlock, textType: 'full' } as ILearnData;
      saveLearnData(ctx.session, nextLearnData);
      const poemText = getPoemText(nextLearnData);
      const text = 'Молодец! Блок закончен, теперь повтори его полностью.\n\n' + poemText;
      return Reply.text({ text, tts: text + getDelaySendText(poemText) });
    } else {
      const nextLearnData = getNewLearnData(poem, 'row', currentBlock.index + 1, 0);
      if (!nextLearnData) return exitWithError(ctx, 'nextLearnData not found');
      saveLearnData(ctx.session, nextLearnData);
      const poemText = getPoemText(nextLearnData);
      const text = 'Повтори новую строку.\n\n' + poemText;
      return Reply.text({ text, tts: text + getDelaySendText(poemText) });
    }
  } else {
    console.log('next row');
    if (currentBlock.learnedRows.includes(currentRow.index)) {
      console.log('new row');
      const nextLearnData = getNewLearnData(poem, 'row', currentBlock.index, currentRow.index + 1);
      if (!nextLearnData) return exitWithError(ctx, 'nextLearnData not found');
      saveLearnData(ctx.session, nextLearnData);
      const poemText = getPoemText(nextLearnData);
      const text = 'Повтори новую строку.\n\n' + poemText;
      return Reply.text({ text, tts: text + getDelaySendText(poemText) });
    } else {
      currentBlock.learnedRows.push(currentRow.index);
      console.log('repeat block');
      const nextLearnData = { ...learnData, currentBlock, textType: 'block' } as ILearnData;
      saveLearnData(ctx.session, nextLearnData);
      const poemText = getPoemText(nextLearnData);
      const text = 'Повтори уже выученые строки.\n\n' + poemText;
      return Reply.text({ text, tts: text + getDelaySendText(poemText) });
    }
  }
};

const getFindData = (session: ISession) => session.get<IFindData | undefined>('findData');

const saveFindData = (session: ISession, data: IFindData) => session.set('findData', data);

const deleteFindData = (session: ISession) => session.delete('findData');

const deleteSelectListData = (session: ISession) => session.delete('selectListData');

const getErrorsList = (session: ISession): unknown[] => session.get<unknown[]>('errorsList') || [];

const saveErrorsList = (session: ISession, errorsList: unknown[]) => session.set('errorsList', errorsList);

const updateErrorsList = (session: ISession, error: unknown) => {
  const errors = getErrorsList(session);
  errors.push(error);
  saveErrorsList(session, errors);
};

const exitWithError = (ctx: IStageContext, error: unknown) => {
  updateErrorsList(ctx.session, error);
  const messages: string[] = [
    'Сейчас вы не можете это сделать',
    'Не разобрал. Повтори еще раз',
    'Попробуй еще раз',
    'Ой, я тебя не понял. Скажи что-нибудь другое',
    'Извините, непонятно',
    'Я не понимаю тебя',
    'Не понимаю, что ты имеешь в виду! Если тебе надоело, просто скажи "Закончить"',
    'Если хочешь продолжить, скажи - "Продолжаем"',
    'Я пока не понимаю, что мне делать. Скажи "Помощь", чтобы я рассказал про команды, на которые я умею отвечать',
  ];
  const message = String(sample(messages));
  return Reply.text(message);
};

const getTextReadingMs = (text: string) => {
  const { time } = readingTime(text, { wordsPerMinute: WORDS_PER_MINUTE });
  return time;
};

const getGamesData = (session: ISession) => session.get<IGamesData | undefined>('gamesData');

const saveGamesData = (session: ISession, data: IGamesData) => session.set('gamesData', data);

const getNewGame1Data = (gamesData: IGamesData): IGame1Data | null => {
  const pairedRows = chunk(gamesData.rows, 2)
    .filter((item) => item.length === 2)
    .reverse();
  // .sort(() => 0.5 - Math.random());
  if (!pairedRows.length) return null;
  const startPairedRowsCount = pairedRows.length;
  const currentPairedRow = pairedRows.pop()!;
  return { pairedRows, userScore: 0, currentPairedRow, startPairedRowsCount };
};

const getNewGame2Data = (gamesData: IGamesData): IGame2Data | null => {
  const items = chunk(gamesData.rows, 2)
    .filter((item) => item.length === 2)
    .reduce((acc, item) => {
      const originalText = item.join('\n');
      const words = [...(originalText.match(/([А-я]+)/gi) ?? [])];
      console.log(words);
      if (words.length < 3) return acc;
      const replacingWordsCount = Math.floor(words.length * 0.4);
      const replacingWords = [...words].sort(() => Math.random() - 0.5).slice(0, replacingWordsCount);
      const replacedText = replacingWords.reduce((res, word) => res.replace(new RegExp(`(?<=^| )${word}(?=$| )`), '_'.repeat(word.length)), originalText);
      acc.push({ originalText, replacedText, words });
      return acc;
    }, [] as IGame2DataItem[])
    .reverse();
  // .sort(() => 0.5 - Math.random());
  if (!items.length) return null;
  const startItemsCount = items.length;
  const currentItem = items.pop()!;
  return { items, userScore: 0, currentItem, startItemsCount };
};

const getGame1Data = (session: ISession) => session.get<IGame1Data>('game1Data');

const saveGame1Data = (session: ISession, data: IGame1Data) => session.set('game1Data', data);

const deleteGame1Data = (session: ISession) => session.delete('game1Data');

const getGame2Data = (session: ISession) => session.get<IGame2Data>('game2Data');

const saveGame2Data = (session: ISession, data: IGame2Data) => session.set('game2Data', data);

const deleteGame2Data = (session: ISession) => session.delete('game2Data');

export {
  POEM_SCENE,
  SET_AUTHOR_SCENE,
  SET_TITLE_SCENE,
  GAMES_MENU_SCENE,
  GAME_1_SCENE,
  GAME_2_SCENE,
  LEARN_SCENE,
  exitHandler,
  backHandler,
  sceneHints,
  sceneMessages,
  helpHandler,
  extractAuthor,
  exitWithError,
  getAuthorName,
  addSceneHistory,
  getPoemText,
  enableLogging,
  getAllSessionData,
  getCurrentScene,
  loggingIsEnable,
  getOldLearnData,
  getNewLearnData,
  saveLearnData,
  goLearnNext,
  deleteSelectListData,
  removeSceneHistory,
  getFindData,
  saveFindData,
  deleteFindData,
  cleanSceneHistory,
  getDelaySendText,
  saveGamesData,
  getGamesData,
  getGame1Data,
  saveGame1Data,
  deleteGame1Data,
  getNewGame1Data,
  getGame2Data,
  saveGame2Data,
  deleteGame2Data,
  getNewGame2Data,
};
