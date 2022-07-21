import { CommandCallback, ISession, IStageContext, Reply } from 'yandex-dialogs-sdk';
import { IApiEntity, IApiEntityYandexFio } from 'yandex-dialogs-sdk/dist/api/nlu';
import { CommandDeclaration } from 'yandex-dialogs-sdk/dist/command/command';
import { cleanLog } from '../Base';
import { sample } from 'lodash';

type IHandlerType = [declaration: CommandDeclaration<IStageContext>, callback: CommandCallback<IStageContext>];

interface IApiEntityYandexFioNew extends IApiEntityYandexFio {
  tokens: { start: number; end: number };
}

const ROWS_COUNT = 2;

const FIND_MENU_SCENE: SceneType = 'FIND_MENU_SCENE';
const SELECT_LIST_SCENE: SceneType = 'SELECT_LIST_SCENE';
const LEARN_SCENE: SceneType = 'LEARN_SCENE';

const exitHandler: IHandlerType = [
  ['выйти', 'хватит', 'стоп', 'я устал', 'выход'],
  (ctx) => {
    ctx.enter('');
    if (loggingIsEnable(ctx.session)) cleanLog(ctx.userId);
    cleanSceneHistory(ctx.session);
    deleteSelectListData(ctx.session);
    return Reply.text('Хорошо! Будет скучно - обращайся.', { end_session: true });
  },
];

const backHandler: IHandlerType = [
  ['назад', 'вернись'],
  (ctx) => {
    console.log(ctx.session);
    const scene = removeSceneHistory(ctx.session);
    ctx.enter(scene);
    const message = String(sample(sceneMessages[scene]));
    return Reply.text(message);
  },
];

const sceneMessages: Record<SceneType, string[]> = {
  MENU: ['меню'],
  LEARN_SCENE: ['Начинаем учить'],
  FIND_MENU_SCENE: ['Назови имя/фамилию автора или название стиха, чтобы начать поиск.'],
  SELECT_LIST_SCENE: ['Выбери стих из списка\n Для перемещения скажите "Далее/Назад"\nДля перехода к поиску, скажите "Поиск"'],
};

const sceneHints: Record<SceneType, string[]> = {
  MENU: ['меню'],
  LEARN_SCENE: ['Учите, ничем не могу помочь'],
  FIND_MENU_SCENE: ['Назовите имя и фамилию автора или название стиха, чтобы начать поиск'],
  SELECT_LIST_SCENE: ['Для выбора стиха, назовите его номер\nДля перехода к поиску, скажите "Поиск"'],
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

const confirmSelectPoem = (ctx: IStageContext, selectedPoem: IPoem, selectListData: ISelectListData, isDayPoem?: boolean) => {
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
  if (isDayPoem) return Reply.text(`Стих дня: ${getAuthorName(selectedPoem.author)} - ${selectedPoem.title}\n\n${text}\nБудем учить его?`);
  return Reply.text(`Ты выбрал ${getAuthorName(selectedPoem.author)} - ${selectedPoem.title}\n\n${text}\nУчим его?`);
};

const getAuthorName = (author?: IAuthor): string => `${author?.firstName ?? ''} ${author?.lastName ?? ''}`.trim();

const getAllSessionData = (session?: ISession) => {
  if (!session)
    return {
      error: 'Session not found',
    };
  const functions: Record<string, (session: ISession) => unknown> = {
    currentScene: getCurrentScene,
    sceneHistory: (session) => session.get('sceneHistory') || [],
    selectListData: getSelectListData,
    learnData: getOldLearnData,
  };
  const res: Record<string, any> = Object.entries(functions).reduce((acc, [name, func]) => ({ ...acc, [name]: func(session) ?? null }), {});
  return res;
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

const deleteSelectListData = (session: ISession) => session.delete('selectListData');

const getSelectListData = (session: ISession): ISelectListData => session.get<ISelectListData>('selectListData');

const saveSelectListData = (session: ISession, newData: ISelectListData) => session.set('selectListData', newData); // !

export {
  FIND_MENU_SCENE,
  SELECT_LIST_SCENE,
  LEARN_SCENE,
  exitHandler,
  backHandler,
  sceneHints,
  sceneMessages,
  extractTitleAndAuthor,
  confirmSelectPoem,
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
  getSelectListData,
  deleteSelectListData,
  saveSelectListData,
};
