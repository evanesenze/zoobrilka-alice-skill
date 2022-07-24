import { CommandCallback, ISession, IStageContext, Reply, Scene } from 'yandex-dialogs-sdk';
import { IApiEntity, IApiEntityYandexFio } from 'yandex-dialogs-sdk/dist/api/nlu';
import { CommandDeclaration } from 'yandex-dialogs-sdk/dist/command/command';
import { TextReplyDeclaration } from 'yandex-dialogs-sdk/dist/reply/textReplyBuilder';
import { cleanLog } from '../Base';
import { sample } from 'lodash';

type IHandlerType = [declaration: CommandDeclaration<IStageContext>, callback: CommandCallback<IStageContext>];

interface IApiEntityYandexFioNew extends IApiEntityYandexFio {
  tokens: { start: number; end: number };
}

const ROWS_COUNT = 2;

// const FIND_MENU_SCENE: SceneType = 'FIND_MENU_SCENE';
// const SELECT_LIST_SCENE: SceneType = 'SELECT_LIST_SCENE';
const LEARN_SCENE: SceneType = 'LEARN_SCENE';
const SET_AUTHOR_SCENE: SceneType = 'SET_AUTHOR_SCENE';
const SET_TITLE_SCENE: SceneType = 'SET_TITLE_SCENE';
const POEM_SCENE: SceneType = 'POEM_SCENE';

const sceneNames: Record<SceneType, string> = {
  MENU: 'Меню',
  POEM_SCENE: 'Просмтотре стиха',
  LEARN_SCENE: 'Зубрилке',
  SET_AUTHOR_SCENE: 'Выборе автора',
  SET_TITLE_SCENE: 'Выборе название',
};

const exitHandler: IHandlerType = [
  ['выйти', 'хватит', 'стоп', 'я устал', 'выход'],
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
  ['назад', 'вернись'],
  (ctx) => {
    const currentScene = getCurrentScene(ctx.session);
    if (currentScene === 'SET_AUTHOR_SCENE') {
      deleteFindData(ctx.session);
    } else if (currentScene === 'SET_TITLE_SCENE') {
      const findData = getFindData(ctx.session);
      if (findData) saveFindData(ctx.session, { author: findData.author, title: '', poems: [], items: [] });
    }
    const scene = removeSceneHistory(ctx.session);
    const message = String(sample(sceneMessages[scene]));
    ctx.enter(scene);
    return Reply.text(message);
  },
];

const helpHandler: IHandlerType = [
  ['помоги', 'помощь'],
  (ctx) => {
    const scene = getCurrentScene(ctx.session);
    const sceneName = sceneNames[scene];
    const message = String(sample(sceneHints[scene]));
    return Reply.text(`Ты находишься в ${sceneName}.
${message}`);
  },
];

const sceneMessages: Record<SceneType, string[]> = {
  MENU: ['Меню текст'],
  LEARN_SCENE: ['Cкажи "Дальше", чтобы начать учить новую строку.'],
  SET_AUTHOR_SCENE: ['Назови имя/фамилию автора или скажи "Пропустить", чтобы перейти к поиску по названию.'],
  SET_TITLE_SCENE: ['Скажи назание стиха или назови номер одного из найденых.'],
  POEM_SCENE: ['Текущий стих.'],
};

const sceneHints: Record<SceneType, TextReplyDeclaration[]> = {
  MENU: ["Ты можешь сказать мне одну из команд: 'Учить' 'Найти', 'Стих дня'\nСкажи 'Я устал', для завершения чата."],
  LEARN_SCENE: ["Скажи 'Дальше', чтобы начать учить новую строку.\nТакже можешь сказать: 'Повтори', 'Повтори стих', 'Повтори блок' или 'Назад'\nСкажи 'Я устал', для завершения чата."],
  SET_AUTHOR_SCENE: ["Назови имя/фамилию автора или скажи 'Пропустить', чтобы перейти к поиску по названию.\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
  SET_TITLE_SCENE: ["Скажи назание стиха или назови номер одного из найденых.\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
  POEM_SCENE: ["Ты можешь сказать мне одну из команд: 'Прочитай', 'Учить', 'Поиск','Назад'\nСкажи 'Я устал', для завершения чата."],
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

const extractAuthor = (entities?: IApiEntity[]): IAuthor => {
  const names = entities?.filter((item) => item.type === 'YANDEX.FIO').map((item) => item as IApiEntityYandexFioNew);
  if (!names?.length) return { lastName: '', firstName: '' } as IAuthor;
  const namesCount = names.length - 1;
  const name = names[namesCount];
  const firstName = `${name.value.first_name?.[0].toUpperCase() ?? ''}${name.value.first_name?.slice(1).toLocaleLowerCase() ?? ''}`;
  const lastName = `${name.value.last_name?.[0].toUpperCase() ?? ''}${name.value.last_name?.slice(1).toLocaleLowerCase() ?? ''}`;
  return { firstName, lastName };
};

const getAuthorName = (author?: IAuthor, short?: boolean): string => `${(short && author?.firstName ? `${author?.firstName[0]}.` : author?.firstName) ?? ''} ${author?.lastName ?? ''}`.trim();

const getAllSessionData = (session?: ISession) => {
  if (!session)
    return {
      error: 'Session not found',
    };
  const functions: Record<string, (session: ISession) => unknown> = {
    currentScene: getCurrentScene,
    sceneHistory: (session) => session.get('sceneHistory'),
    findData: getFindData,
    // selectListData: getSelectListData,
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

const goLearnNext = (ctx: IStageContext, learnData: ILearnData) => {
  const { currentBlock, currentRow, poem, poemСomplited } = learnData;
  if (currentRow.isLast && currentBlock.learnedRows.includes(currentRow.index)) {
    if (currentBlock.isLast) {
      console.log('currentBlock is last');
      if (!poemСomplited) {
        const text = 'Повтори стих целиком.\n\n' + getPoemText({ ...learnData, textType: 'full' });
        saveLearnData(ctx.session, { ...learnData, poemСomplited: true });
        return Reply.text(text, { end_session: true });
      } else {
        ctx.leave();
        deleteLearnData(ctx.session);
        return Reply.text('Поздравляю! Ты выучил новый стих');
      }
    }
    console.log('currentRow is last');
    currentBlock.complited = true;
    if (currentBlock.rowsCount > 1 && currentBlock.index != 0 && !currentBlock.complited && currentBlock.rowsCount > 2) {
      console.log('currentBlock is not complited');
      const nextLearnData = { ...learnData, currentBlock, textType: 'full' } as ILearnData;
      saveLearnData(ctx.session, nextLearnData);
      const text = 'Молодец! Блок закончен, теперь повтори его полностью.\n\n' + getPoemText(nextLearnData);
      return Reply.text(text, { end_session: true });
    } else {
      const nextLearnData = getNewLearnData(poem, 'row', currentBlock.index + 1, 0);
      if (!nextLearnData) {
        ctx.enter('');
        return Reply.text('вернулись в меню');
      }
      saveLearnData(ctx.session, nextLearnData);
      const text = 'Повтори новую строку.\n\n' + getPoemText(nextLearnData);
      return Reply.text(text, { end_session: true });
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
      const text = 'Повтори новую строку.\n\n' + getPoemText(nextLearnData);
      return Reply.text(text, { end_session: true });
    } else {
      currentBlock.learnedRows.push(currentRow.index);
      console.log('repeat block');
      const nextLearnData = { ...learnData, currentBlock, textType: 'block' } as ILearnData;
      saveLearnData(ctx.session, nextLearnData);
      const text = 'Повтори уже выученые строки.\n\n' + getPoemText(nextLearnData);
      return Reply.text(text, { end_session: true });
    }
  }
};

const getFindData = (session: ISession) => session.get<IFindData | undefined>('findData');

const saveFindData = (session: ISession, data: IFindData) => session.set('findData', data);

const deleteFindData = (session: ISession) => session.delete('findData');

const deleteSelectListData = (session: ISession) => session.delete('selectListData');

// const getSelectListData = (session: ISession): ISelectListData => session.get<ISelectListData>('selectListData');

// const saveSelectListData = (session: ISession, newData: ISelectListData) => session.set('selectListData', newData); // !

export {
  // SELECT_LIST_SCENE,
  POEM_SCENE,
  SET_AUTHOR_SCENE,
  SET_TITLE_SCENE,
  LEARN_SCENE,
  exitHandler,
  backHandler,
  sceneHints,
  sceneMessages,
  helpHandler,
  extractAuthor,
  // confirmSelectPoem,
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
  // getSelectListData,
  deleteSelectListData,
  // saveSelectListData,
  removeSceneHistory,
  getFindData,
  saveFindData,
  deleteFindData,
  cleanSceneHistory,
};
