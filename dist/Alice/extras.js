"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewGame2Data = exports.deleteGame2Data = exports.saveGame2Data = exports.getGame2Data = exports.getNewGame1Data = exports.deleteGame1Data = exports.saveGame1Data = exports.getGame1Data = exports.getGamesData = exports.saveGamesData = exports.getDelaySendText = exports.cleanSceneHistory = exports.deleteFindData = exports.saveFindData = exports.getFindData = exports.removeSceneHistory = exports.deleteSelectListData = exports.goLearnNext = exports.saveLearnData = exports.getNewLearnData = exports.getOldLearnData = exports.loggingIsEnable = exports.getCurrentScene = exports.getAllSessionData = exports.enableLogging = exports.getPoemText = exports.addSceneHistory = exports.getAuthorName = exports.exitWithError = exports.extractAuthor = exports.helpHandler = exports.sceneMessages = exports.sceneHints = exports.backHandler = exports.exitHandler = exports.LEARN_SCENE = exports.GAME_2_SCENE = exports.GAME_1_SCENE = exports.GAMES_MENU_SCENE = exports.SET_TITLE_SCENE = exports.SET_AUTHOR_SCENE = exports.POEM_SCENE = void 0;
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const lodash_1 = require("lodash");
const Base_1 = require("../Base");
const reading_time_1 = __importDefault(require("reading-time"));
const ROWS_COUNT = 2;
const WORDS_PER_MINUTE = 40;
const LEARN_SCENE = 'LEARN_SCENE';
exports.LEARN_SCENE = LEARN_SCENE;
const SET_AUTHOR_SCENE = 'SET_AUTHOR_SCENE';
exports.SET_AUTHOR_SCENE = SET_AUTHOR_SCENE;
const SET_TITLE_SCENE = 'SET_TITLE_SCENE';
exports.SET_TITLE_SCENE = SET_TITLE_SCENE;
const POEM_SCENE = 'POEM_SCENE';
exports.POEM_SCENE = POEM_SCENE;
const GAMES_MENU_SCENE = 'GAMES_MENU_SCENE';
exports.GAMES_MENU_SCENE = GAMES_MENU_SCENE;
const GAME_1_SCENE = 'GAME_1_SCENE';
exports.GAME_1_SCENE = GAME_1_SCENE;
const GAME_2_SCENE = 'GAME_2_SCENE';
exports.GAME_2_SCENE = GAME_2_SCENE;
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
const sceneNames = {
    MENU: 'Меню',
    POEM_SCENE: 'Просмотре стиха',
    LEARN_SCENE: 'Зубрилке',
    SET_AUTHOR_SCENE: 'Выборе автора',
    SET_TITLE_SCENE: 'Выборе название',
    GAMES_MENU_SCENE: 'Выборе игры',
    GAME_1_SCENE: 'Игре 1',
    GAME_2_SCENE: 'Игре 2',
};
const exitHandler = [
    exitCommand,
    (ctx) => {
        ctx.enter('');
        if (loggingIsEnable(ctx.session))
            (0, Base_1.cleanLog)(ctx.userId);
        cleanSceneHistory(ctx.session);
        deleteSelectListData(ctx.session);
        deleteFindData(ctx.session);
        return yandex_dialogs_sdk_1.Reply.text('Хорошо! Будет скучно - обращайся.', { end_session: true });
    },
];
exports.exitHandler = exitHandler;
const backHandler = [
    backCommand,
    (ctx) => {
        const currentScene = getCurrentScene(ctx.session);
        if (currentScene === 'SET_AUTHOR_SCENE') {
            deleteFindData(ctx.session);
        }
        else if (currentScene === 'SET_TITLE_SCENE') {
            const findData = getFindData(ctx.session);
            if (findData)
                saveFindData(ctx.session, { author: findData.author, title: '', poems: [], items: [] });
        }
        const scene = removeSceneHistory(ctx.session);
        let message = String((0, lodash_1.sample)(sceneMessages[scene]));
        if (scene === 'SET_TITLE_SCENE') {
            const findData = getFindData(ctx.session);
            if (findData) {
                message += findData.items.reduce((msg, item) => msg + `\n${item}`, '\n');
            }
        }
        else if (scene === 'POEM_SCENE') {
            {
                const findData = getFindData(ctx.session);
                if (findData && findData.selectedPoemId) {
                    const poem = findData.poems[findData.selectedPoemId];
                    const newLearnData = getNewLearnData(poem, 'full', -1, -1);
                    if (!newLearnData)
                        return exitWithError(ctx, 'newLearnData not found');
                    const poemText = getPoemText(newLearnData);
                    message += `\n\n ${poemText}`;
                }
            }
        }
        ctx.enter(scene);
        return yandex_dialogs_sdk_1.Reply.text(message);
    },
];
exports.backHandler = backHandler;
const helpHandler = [
    helpCommand,
    (ctx) => {
        const scene = getCurrentScene(ctx.session);
        const sceneName = sceneNames[scene];
        const message = String((0, lodash_1.sample)(sceneHints[scene]));
        return yandex_dialogs_sdk_1.Reply.text(`Ты находишься в ${sceneName}.
${message}`);
    },
];
exports.helpHandler = helpHandler;
const sceneMessages = {
    MENU: ['Меню текст'],
    LEARN_SCENE: ['Cкажи "Дальше", чтобы начать учить новую строку.'],
    SET_AUTHOR_SCENE: ['Назови имя/фамилию автора или скажи "Пропустить", чтобы перейти к поиску по названию.'],
    SET_TITLE_SCENE: ['Скажи название стиха или назови номер одного из найденых.'],
    POEM_SCENE: ['Текущий стих.'],
    GAMES_MENU_SCENE: ['Режим создан для проверки знаний стиха.\nДля начала, назови номер игры из списка\n1.)Игра 1.\n2.)Игра 2.'],
    GAME_1_SCENE: [
        'В этой игре стих делится на блоки по две строки. Я говорю первую строку, даю тебе время вспомнить вторую и слушаю ответ.\nЕсли он верный - ты получаешь балл.\n\nСкажи "Начать", для запуска игры.',
    ],
    GAME_2_SCENE: [
        'В этой игре стих делится на блоки по две строки. Я говорю текст блока, но закртываю в нем некоторые слова; даю тебе время подумать и слушаю полный текст блока\nЕсли он верный - ты получаешь балл.\n\nСкажи "Начать", для запуска игры.',
    ],
};
exports.sceneMessages = sceneMessages;
const sceneHints = {
    MENU: ["Ты можешь сказать мне одну из команд: 'Учить', 'Найти' или 'Стих дня'\nСкажи 'Я устал', для завершения чата."],
    LEARN_SCENE: [
        "Я буду произносить строку и давать время на ее повторение.\nСкажи 'Дальше', чтобы начать учить новую строку.\nТакже можешь сказать: 'Повтори', 'Повтори стих', 'Повтори блок' или 'Назад'\nСкажи 'Я устал', для завершения чата.",
    ],
    SET_AUTHOR_SCENE: ["Назови имя/фамилию автора или скажи 'Пропустить', чтобы перейти к поиску по названию.\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
    SET_TITLE_SCENE: ["Скажи название стиха или назови номер одного из найденых.\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
    POEM_SCENE: ["Ты можешь сказать мне одну из команд: 'Прочитай', 'Учить', 'Поиск' или 'Назад'\nСкажи 'Я устал', для завершения чата."],
    GAMES_MENU_SCENE: ["Для начала, назови номер игры из списка\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
    GAME_1_SCENE: ["Прослушай первую строку блока и назови вторую, чтобы двигаться дальше.\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
    GAME_2_SCENE: ["Прослушай текст блока с закртыми словами и назови полный текст, чтобы двигаться дальше.\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
};
exports.sceneHints = sceneHints;
const enableLogging = (session) => session.set('logging', true);
exports.enableLogging = enableLogging;
const loggingIsEnable = (session) => session.has('logging');
exports.loggingIsEnable = loggingIsEnable;
const getCurrentScene = (session) => {
    var _a;
    const arr = (session.get('sceneHistory') || []);
    return (_a = arr[arr.length - 1]) !== null && _a !== void 0 ? _a : 'MENU';
};
exports.getCurrentScene = getCurrentScene;
const removeSceneHistory = (session) => {
    var _a;
    const arr = (session.get('sceneHistory') || []);
    arr.pop();
    session.set('sceneHistory', arr);
    return (_a = arr[arr.length - 1]) !== null && _a !== void 0 ? _a : 'MENU';
};
exports.removeSceneHistory = removeSceneHistory;
const cleanSceneHistory = (session) => session.set('sceneHistory', []);
exports.cleanSceneHistory = cleanSceneHistory;
const addSceneHistory = (session, newSceneName) => {
    const arr = (session.get('sceneHistory') || []);
    arr.push(newSceneName);
    session.set('sceneHistory', [...new Set(arr)]);
};
exports.addSceneHistory = addSceneHistory;
const getPoemText = (learnData) => {
    const { currentBlock, currentRow, textType, blocksData } = learnData;
    const oldBlocksText = blocksData.slice(0, currentBlock.index).reduce((res, item) => res + item.join('\n') + '\n\n', '');
    const oldRowsText = blocksData[currentBlock.index].slice(0, currentRow.index * ROWS_COUNT).join('\n');
    const currentRowText = blocksData[currentBlock.index].slice(currentRow.index * ROWS_COUNT, currentRow.index * ROWS_COUNT + ROWS_COUNT).join('\n');
    switch (textType) {
        case 'full':
            if (!oldRowsText)
                return (oldBlocksText + currentRowText).substring(0, 900);
            return (oldBlocksText + oldRowsText + '\n' + currentRowText).substring(0, 900);
        case 'block':
            if (!oldRowsText)
                return currentRowText.substring(0, 900);
            return (oldRowsText + '\n' + currentRowText).substring(0, 900);
        case 'row':
            return currentRowText.substring(0, 900);
        default:
            return currentRowText.substring(0, 900);
    }
};
exports.getPoemText = getPoemText;
const extractAuthor = (entities) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const names = entities === null || entities === void 0 ? void 0 : entities.filter((item) => item.type === 'YANDEX.FIO').map((item) => item);
    if (!(names === null || names === void 0 ? void 0 : names.length))
        return null;
    const namesCount = names.length - 1;
    const name = names[namesCount];
    const firstName = `${(_b = (_a = name.value.first_name) === null || _a === void 0 ? void 0 : _a[0].toUpperCase()) !== null && _b !== void 0 ? _b : ''}${(_d = (_c = name.value.first_name) === null || _c === void 0 ? void 0 : _c.slice(1).toLocaleLowerCase()) !== null && _d !== void 0 ? _d : ''}`;
    const lastName = `${(_f = (_e = name.value.last_name) === null || _e === void 0 ? void 0 : _e[0].toUpperCase()) !== null && _f !== void 0 ? _f : ''}${(_h = (_g = name.value.last_name) === null || _g === void 0 ? void 0 : _g.slice(1).toLocaleLowerCase()) !== null && _h !== void 0 ? _h : ''}`;
    return { firstName, lastName };
};
exports.extractAuthor = extractAuthor;
const getAuthorName = (author, short) => { var _a, _b; return `${(_a = (short && author.firstName ? `${author.firstName[0]}.` : author.firstName)) !== null && _a !== void 0 ? _a : ''} ${(_b = author.lastName) !== null && _b !== void 0 ? _b : ''}`.trim(); };
exports.getAuthorName = getAuthorName;
const getAllSessionData = (session) => {
    if (!session)
        return {
            error: 'Session not found',
        };
    const functions = {
        currentScene: getCurrentScene,
        gamesData: getGamesData,
        game2Data: getGame2Data,
        game1Data: getGame1Data,
        errorsList: getErrorsList,
        sceneHistory: (session) => session.get('sceneHistory'),
        findData: getFindData,
        learnData: getOldLearnData,
    };
    const res = Object.entries(functions).reduce((acc, [name, func]) => { var _a; return (Object.assign(Object.assign({}, acc), { [name]: (_a = func(session)) !== null && _a !== void 0 ? _a : null })); }, {});
    return res;
};
exports.getAllSessionData = getAllSessionData;
const deleteLearnData = (session) => session.delete('learnData');
const getOldLearnData = (session) => session.get('learnData');
exports.getOldLearnData = getOldLearnData;
const getBlocksData = (text) => text.split('\n\n').map((item) => item.split('\n'));
const getNewLearnData = (poem, textType, currentBlockIndex = 0, currentRowIndex = 0) => {
    const blocksData = getBlocksData(poem.text);
    const blocksCount = blocksData.length;
    if (currentBlockIndex > blocksCount - 1)
        return null;
    if (currentBlockIndex < 0)
        currentBlockIndex = blocksData.length - 1;
    const rows = blocksData[currentBlockIndex];
    if (currentRowIndex < 0)
        currentRowIndex = rows.length - 1;
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
exports.getNewLearnData = getNewLearnData;
const saveLearnData = (session, data) => session.set('learnData', data); // !
exports.saveLearnData = saveLearnData;
const getDelaySendText = (text, isEnd) => {
    const delay = getTextReadingMs(text);
    console.log(delay);
    const end = isEnd ? 'завершению' : 'следующей строке';
    return `sil <[${delay}]> Скажи "Дальше", чтобы перейти к ${end}`;
};
exports.getDelaySendText = getDelaySendText;
const goLearnNext = (ctx, learnData) => {
    const { currentBlock, currentRow, poem, poemСomplited } = learnData;
    if (currentRow.isLast && currentBlock.learnedRows.includes(currentRow.index)) {
        if (currentBlock.isLast) {
            console.log('currentBlock is last');
            if (!poemСomplited) {
                const poemText = getPoemText(Object.assign(Object.assign({}, learnData), { textType: 'full' }));
                const text = 'Повтори стих целиком.\n\n' + poemText;
                saveLearnData(ctx.session, Object.assign(Object.assign({}, learnData), { poemСomplited: true }));
                return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + getDelaySendText(poemText, true) });
            }
            else {
                deleteLearnData(ctx.session);
                deleteFindData(ctx.session);
                cleanSceneHistory(ctx.session);
                const text = 'Поздравляю! Ты выучил новый стих.';
                ctx.enter('');
                return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + 'Скажи "Записать", чтобы записать свое чтение. Скажи "Поиск", чтобы найти новый стих' });
            }
        }
        console.log('currentRow is last');
        if (currentBlock.rowsCount > 1 && currentBlock.index != 0 && !currentBlock.complited && currentBlock.rowsCount > 2) {
            currentBlock.complited = true;
            console.log('currentBlock is not complited');
            const nextLearnData = Object.assign(Object.assign({}, learnData), { currentBlock, textType: 'full' });
            saveLearnData(ctx.session, nextLearnData);
            const poemText = getPoemText(nextLearnData);
            const text = 'Молодец! Блок закончен, теперь повтори его полностью.\n\n' + poemText;
            return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + getDelaySendText(poemText) });
        }
        else {
            const nextLearnData = getNewLearnData(poem, 'row', currentBlock.index + 1, 0);
            if (!nextLearnData)
                return exitWithError(ctx, 'nextLearnData not found');
            saveLearnData(ctx.session, nextLearnData);
            const poemText = getPoemText(nextLearnData);
            const text = 'Повтори новую строку.\n\n' + poemText;
            return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + getDelaySendText(poemText) });
        }
    }
    else {
        console.log('next row');
        if (currentBlock.learnedRows.includes(currentRow.index)) {
            console.log('new row');
            const nextLearnData = getNewLearnData(poem, 'row', currentBlock.index, currentRow.index + 1);
            if (!nextLearnData)
                return exitWithError(ctx, 'nextLearnData not found');
            saveLearnData(ctx.session, nextLearnData);
            const poemText = getPoemText(nextLearnData);
            const text = 'Повтори новую строку.\n\n' + poemText;
            return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + getDelaySendText(poemText) });
        }
        else {
            currentBlock.learnedRows.push(currentRow.index);
            console.log('repeat block');
            const nextLearnData = Object.assign(Object.assign({}, learnData), { currentBlock, textType: 'block' });
            saveLearnData(ctx.session, nextLearnData);
            const poemText = getPoemText(nextLearnData);
            const text = 'Повтори уже выученые строки.\n\n' + poemText;
            return yandex_dialogs_sdk_1.Reply.text({ text, tts: text + getDelaySendText(poemText) });
        }
    }
};
exports.goLearnNext = goLearnNext;
const getFindData = (session) => session.get('findData');
exports.getFindData = getFindData;
const saveFindData = (session, data) => session.set('findData', data);
exports.saveFindData = saveFindData;
const deleteFindData = (session) => session.delete('findData');
exports.deleteFindData = deleteFindData;
const deleteSelectListData = (session) => session.delete('selectListData');
exports.deleteSelectListData = deleteSelectListData;
const getErrorsList = (session) => session.get('errorsList') || [];
const saveErrorsList = (session, errorsList) => session.set('errorsList', errorsList);
const updateErrorsList = (session, error) => {
    const errors = getErrorsList(session);
    errors.push(error);
    saveErrorsList(session, errors);
};
const exitWithError = (ctx, error) => {
    updateErrorsList(ctx.session, error);
    const messages = [
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
    const message = String((0, lodash_1.sample)(messages));
    return yandex_dialogs_sdk_1.Reply.text(message);
};
exports.exitWithError = exitWithError;
const getTextReadingMs = (text) => {
    const { time } = (0, reading_time_1.default)(text, { wordsPerMinute: WORDS_PER_MINUTE });
    return time;
};
const getGamesData = (session) => session.get('gamesData');
exports.getGamesData = getGamesData;
const saveGamesData = (session, data) => session.set('gamesData', data);
exports.saveGamesData = saveGamesData;
const getNewGame1Data = (gamesData) => {
    const pairedRows = (0, lodash_1.chunk)(gamesData.rows, 2)
        .filter((item) => item.length === 2)
        .sort(() => 0.5 - Math.random());
    if (!pairedRows.length)
        return null;
    const startPairedRowsCount = pairedRows.length;
    const currentPairedRow = pairedRows.pop();
    return { pairedRows, userScore: 0, currentPairedRow, startPairedRowsCount };
};
exports.getNewGame1Data = getNewGame1Data;
const getNewGame2Data = (gamesData) => {
    const items = (0, lodash_1.chunk)(gamesData.rows, 2)
        .filter((item) => item.length === 2)
        .reduce((acc, item) => {
        var _a;
        const originalText = item.join('\n');
        const words = [...((_a = originalText.match(/([А-я]+)/gi)) !== null && _a !== void 0 ? _a : [])];
        if (words.length < 3)
            return acc;
        const replacingWordsCount = Math.floor(words.length * 0.4);
        const replacingWords = words.sort(() => Math.random() - 0.5).slice(0, replacingWordsCount);
        const replacedText = replacingWords.reduce((res, word) => res.replace(word, '_'.repeat(word.length)), originalText);
        acc.push({ originalText, replacedText });
        return acc;
    }, [])
        .sort(() => 0.5 - Math.random());
    if (!items.length)
        return null;
    const startItemsCount = items.length;
    const currentItem = items.pop();
    return { items, userScore: 0, currentItem, startItemsCount };
};
exports.getNewGame2Data = getNewGame2Data;
const getGame1Data = (session) => session.get('game1Data');
exports.getGame1Data = getGame1Data;
const saveGame1Data = (session, data) => session.set('game1Data', data);
exports.saveGame1Data = saveGame1Data;
const deleteGame1Data = (session) => session.delete('game1Data');
exports.deleteGame1Data = deleteGame1Data;
const getGame2Data = (session) => session.get('game2Data');
exports.getGame2Data = getGame2Data;
const saveGame2Data = (session, data) => session.set('game2Data', data);
exports.saveGame2Data = saveGame2Data;
const deleteGame2Data = (session) => session.delete('game2Data');
exports.deleteGame2Data = deleteGame2Data;
