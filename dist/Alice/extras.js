"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanSceneHistory = exports.deleteFindData = exports.saveFindData = exports.getFindData = exports.removeSceneHistory = exports.deleteSelectListData = exports.goLearnNext = exports.saveLearnData = exports.getNewLearnData = exports.getOldLearnData = exports.loggingIsEnable = exports.getCurrentScene = exports.getAllSessionData = exports.enableLogging = exports.getPoemText = exports.addSceneHistory = exports.getAuthorName = exports.extractAuthor = exports.helpHandler = exports.sceneMessages = exports.sceneHints = exports.backHandler = exports.exitHandler = exports.LEARN_SCENE = exports.SET_TITLE_SCENE = exports.SET_AUTHOR_SCENE = exports.POEM_SCENE = void 0;
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const Base_1 = require("../Base");
const lodash_1 = require("lodash");
const ROWS_COUNT = 2;
// const FIND_MENU_SCENE: SceneType = 'FIND_MENU_SCENE';
// const SELECT_LIST_SCENE: SceneType = 'SELECT_LIST_SCENE';
const LEARN_SCENE = 'LEARN_SCENE';
exports.LEARN_SCENE = LEARN_SCENE;
const SET_AUTHOR_SCENE = 'SET_AUTHOR_SCENE';
exports.SET_AUTHOR_SCENE = SET_AUTHOR_SCENE;
const SET_TITLE_SCENE = 'SET_TITLE_SCENE';
exports.SET_TITLE_SCENE = SET_TITLE_SCENE;
const POEM_SCENE = 'POEM_SCENE';
exports.POEM_SCENE = POEM_SCENE;
const sceneNames = {
    MENU: 'Меню',
    POEM_SCENE: 'Просмтотре стиха',
    LEARN_SCENE: 'Зубрилке',
    SET_AUTHOR_SCENE: 'Выборе автора',
    SET_TITLE_SCENE: 'Выборе название',
};
const exitHandler = [
    ['выйти', 'хватит', 'стоп', 'я устал', 'выход'],
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
    ['назад', 'вернись'],
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
        const message = String((0, lodash_1.sample)(sceneMessages[scene]));
        ctx.enter(scene);
        return yandex_dialogs_sdk_1.Reply.text(message);
    },
];
exports.backHandler = backHandler;
const helpHandler = [
    ['помоги', 'помощь'],
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
    SET_TITLE_SCENE: ['Скажи назание стиха или назови номер одного из найденых.'],
    POEM_SCENE: ['Текущий стих.'],
};
exports.sceneMessages = sceneMessages;
const sceneHints = {
    MENU: ["Ты можешь сказать мне одну из команд: 'Учить' 'Найти', 'Стих дня'\nСкажи 'Я устал', для завершения чата."],
    LEARN_SCENE: ["Скажи 'Дальше', чтобы начать учить новую строку.\nТакже можешь сказать: 'Повтори', 'Повтори стих', 'Повтори блок' или 'Назад'\nСкажи 'Я устал', для завершения чата."],
    SET_AUTHOR_SCENE: ["Назови имя/фамилию автора или скажи 'Пропустить', чтобы перейти к поиску по названию.\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
    SET_TITLE_SCENE: ["Скажи назание стиха или назови номер одного из найденых.\nТакже можешь сказать: 'Назад'.\nСкажи 'Я устал', для завершения чата."],
    POEM_SCENE: ["Ты можешь сказать мне одну из команд: 'Прочитай', 'Учить', 'Поиск','Назад'\nСкажи 'Я устал', для завершения чата."],
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
        return { lastName: '', firstName: '' };
    const namesCount = names.length - 1;
    const name = names[namesCount];
    const firstName = `${(_b = (_a = name.value.first_name) === null || _a === void 0 ? void 0 : _a[0].toUpperCase()) !== null && _b !== void 0 ? _b : ''}${(_d = (_c = name.value.first_name) === null || _c === void 0 ? void 0 : _c.slice(1).toLocaleLowerCase()) !== null && _d !== void 0 ? _d : ''}`;
    const lastName = `${(_f = (_e = name.value.last_name) === null || _e === void 0 ? void 0 : _e[0].toUpperCase()) !== null && _f !== void 0 ? _f : ''}${(_h = (_g = name.value.last_name) === null || _g === void 0 ? void 0 : _g.slice(1).toLocaleLowerCase()) !== null && _h !== void 0 ? _h : ''}`;
    return { firstName, lastName };
};
exports.extractAuthor = extractAuthor;
const getAuthorName = (author, short) => { var _a, _b; return `${(_a = (short && (author === null || author === void 0 ? void 0 : author.firstName) ? `${author === null || author === void 0 ? void 0 : author.firstName[0]}.` : author === null || author === void 0 ? void 0 : author.firstName)) !== null && _a !== void 0 ? _a : ''} ${(_b = author === null || author === void 0 ? void 0 : author.lastName) !== null && _b !== void 0 ? _b : ''}`.trim(); };
exports.getAuthorName = getAuthorName;
const getAllSessionData = (session) => {
    if (!session)
        return {
            error: 'Session not found',
        };
    const functions = {
        currentScene: getCurrentScene,
        sceneHistory: (session) => session.get('sceneHistory'),
        findData: getFindData,
        // selectListData: getSelectListData,
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
const goLearnNext = (ctx, learnData) => {
    const { currentBlock, currentRow, poem, poemСomplited } = learnData;
    if (currentRow.isLast && currentBlock.learnedRows.includes(currentRow.index)) {
        if (currentBlock.isLast) {
            console.log('currentBlock is last');
            if (!poemСomplited) {
                const text = 'Повтори стих целиком.\n\n' + getPoemText(Object.assign(Object.assign({}, learnData), { textType: 'full' }));
                saveLearnData(ctx.session, Object.assign(Object.assign({}, learnData), { poemСomplited: true }));
                return yandex_dialogs_sdk_1.Reply.text(text, { end_session: true });
            }
            else {
                ctx.leave();
                deleteLearnData(ctx.session);
                return yandex_dialogs_sdk_1.Reply.text('Поздравляю! Ты выучил новый стих');
            }
        }
        console.log('currentRow is last');
        currentBlock.complited = true;
        if (currentBlock.rowsCount > 1 && currentBlock.index != 0 && !currentBlock.complited && currentBlock.rowsCount > 2) {
            console.log('currentBlock is not complited');
            const nextLearnData = Object.assign(Object.assign({}, learnData), { currentBlock, textType: 'full' });
            saveLearnData(ctx.session, nextLearnData);
            const text = 'Молодец! Блок закончен, теперь повтори его полностью.\n\n' + getPoemText(nextLearnData);
            return yandex_dialogs_sdk_1.Reply.text(text, { end_session: true });
        }
        else {
            const nextLearnData = getNewLearnData(poem, 'row', currentBlock.index + 1, 0);
            if (!nextLearnData) {
                ctx.enter('');
                return yandex_dialogs_sdk_1.Reply.text('вернулись в меню');
            }
            saveLearnData(ctx.session, nextLearnData);
            const text = 'Повтори новую строку.\n\n' + getPoemText(nextLearnData);
            return yandex_dialogs_sdk_1.Reply.text(text, { end_session: true });
        }
    }
    else {
        console.log('next row');
        if (currentBlock.learnedRows.includes(currentRow.index)) {
            console.log('new row');
            const nextLearnData = getNewLearnData(poem, 'row', currentBlock.index, currentRow.index + 1);
            if (!nextLearnData) {
                ctx.leave();
                return yandex_dialogs_sdk_1.Reply.text('Переход в меню');
            }
            saveLearnData(ctx.session, nextLearnData);
            const text = 'Повтори новую строку.\n\n' + getPoemText(nextLearnData);
            return yandex_dialogs_sdk_1.Reply.text(text, { end_session: true });
        }
        else {
            currentBlock.learnedRows.push(currentRow.index);
            console.log('repeat block');
            const nextLearnData = Object.assign(Object.assign({}, learnData), { currentBlock, textType: 'block' });
            saveLearnData(ctx.session, nextLearnData);
            const text = 'Повтори уже выученые строки.\n\n' + getPoemText(nextLearnData);
            return yandex_dialogs_sdk_1.Reply.text(text, { end_session: true });
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
