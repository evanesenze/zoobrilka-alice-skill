"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
define("index", ["require", "exports", "./Api", "./SocketServer", "http"], function (require, exports, Api_1, SocketServer_1, http_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.server = void 0;
    http_1 = __importDefault(http_1);
    const port = Number(process.env.PORT) || 3001;
    const server = http_1.default.createServer(Api_1.app);
    exports.server = server;
    (0, SocketServer_1.createIoServer)(server);
    server.listen(port, () => {
        console.log('server running on port ' + port);
        // reshuffleTodayPoemId();
    });
});
define("Alice/extras", ["require", "exports", "yandex-dialogs-sdk", "../Base", "lodash"], function (require, exports, yandex_dialogs_sdk_1, Base_1, lodash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.removeSceneHistory = exports.saveSelectListData = exports.deleteSelectListData = exports.getSelectListData = exports.goLearnNext = exports.saveLearnData = exports.getNewLearnData = exports.getOldLearnData = exports.loggingIsEnable = exports.getCurrentScene = exports.getAllSessionData = exports.enableLogging = exports.getPoemText = exports.addSceneHistory = exports.getAuthorName = exports.confirmSelectPoem = exports.extractTitleAndAuthor = exports.helpHandler = exports.sceneMessages = exports.sceneHints = exports.backHandler = exports.exitHandler = exports.LEARN_SCENE = exports.SET_TITLE_SCENE = exports.SET_AUTHOR_SCENE = exports.SELECT_LIST_SCENE = exports.FIND_MENU_SCENE = void 0;
    const ROWS_COUNT = 2;
    const FIND_MENU_SCENE = 'FIND_MENU_SCENE';
    exports.FIND_MENU_SCENE = FIND_MENU_SCENE;
    const SELECT_LIST_SCENE = 'SELECT_LIST_SCENE';
    exports.SELECT_LIST_SCENE = SELECT_LIST_SCENE;
    const LEARN_SCENE = 'LEARN_SCENE';
    exports.LEARN_SCENE = LEARN_SCENE;
    const SET_AUTHOR_SCENE = 'SET_AUTHOR_SCENE';
    exports.SET_AUTHOR_SCENE = SET_AUTHOR_SCENE;
    const SET_TITLE_SCENE = 'SET_TITLE_SCENE';
    exports.SET_TITLE_SCENE = SET_TITLE_SCENE;
    const sceneNames = {
        MENU: 'Меню',
        FIND_MENU_SCENE: 'Поиске',
        SELECT_LIST_SCENE: 'Выборе стиха',
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
            return yandex_dialogs_sdk_1.Reply.text('Хорошо! Будет скучно - обращайся.', { end_session: true });
        },
    ];
    exports.exitHandler = exitHandler;
    const backHandler = [
        ['назад', 'вернись'],
        (ctx) => {
            console.log(ctx.session);
            const scene = removeSceneHistory(ctx.session);
            ctx.enter(scene);
            const message = String((0, lodash_1.sample)(sceneMessages[scene]));
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
        LEARN_SCENE: ['Повторяй строчки стиха, чтобы двигаться дальше.'],
        FIND_MENU_SCENE: ['Назови имя/фамилию автора или название стиха, чтобы начать поиск.'],
        SELECT_LIST_SCENE: ["Для выбора стиха, назови его номер или название.\nCкажи 'Поиск', чтобы вернуться к поиску"],
        SET_AUTHOR_SCENE: [''],
        SET_TITLE_SCENE: [''],
    };
    exports.sceneMessages = sceneMessages;
    const sceneHints = {
        MENU: [
            "Скажи 'Учить', чтобы продолжить учить.\nСкажи 'Найти', чтобы начать поиск.\nСкажи 'Стих дня', чтобы узнать стих дня.\nСкажи 'Помощь' в любом месте, чтобы получить помощь.\nСкажи 'Я устал', для завершения чата.",
        ],
        LEARN_SCENE: ["Повторяй строчки стиха, чтобы двигаться дальше.\nСкажи 'Продолжить', чтобы пропустить текущий шаг\nСкажи 'Назад', чтобы вернуться назад.\nСкажи 'Я устал', для завершения чата."],
        FIND_MENU_SCENE: ["Назови имя/фамилию автора или название стиха, чтобы начать поиск.\nСкажи 'Назад', чтобы вернуться назад.\nСкажи 'Я устал', для завершения чата."],
        SELECT_LIST_SCENE: ["Для выбора стиха, назови его номер или название.\nCкажи 'Поиск', чтобы вернуться к поиску\nСкажи 'Назад', чтобы вернуться назад.\nСкажи 'Я устал', для завершения чата."],
        SET_AUTHOR_SCENE: [''],
        SET_TITLE_SCENE: [],
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
    const extractTitleAndAuthor = (message, entities) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        let author;
        let title = message;
        const names = entities === null || entities === void 0 ? void 0 : entities.filter((item) => item.type === 'YANDEX.FIO').map((item) => item);
        if (names === null || names === void 0 ? void 0 : names.length) {
            const namesCount = names.length - 1;
            const name = names[namesCount];
            if (names === null || names === void 0 ? void 0 : names.length) {
                const firstName = `${(_b = (_a = name.value.first_name) === null || _a === void 0 ? void 0 : _a[0].toUpperCase()) !== null && _b !== void 0 ? _b : ''}${(_d = (_c = name.value.first_name) === null || _c === void 0 ? void 0 : _c.slice(1).toLocaleLowerCase()) !== null && _d !== void 0 ? _d : ''}`;
                const lastName = `${(_f = (_e = name.value.last_name) === null || _e === void 0 ? void 0 : _e[0].toUpperCase()) !== null && _f !== void 0 ? _f : ''}${(_h = (_g = name.value.last_name) === null || _g === void 0 ? void 0 : _g.slice(1).toLocaleLowerCase()) !== null && _h !== void 0 ? _h : ''}`;
                author = { firstName, lastName };
                const words = title.split(' ');
                words.splice(name.tokens.start, name.tokens.end - name.tokens.start);
                title = words.join(' ');
            }
        }
        return { author, title };
    };
    exports.extractTitleAndAuthor = extractTitleAndAuthor;
    const confirmSelectPoem = (ctx, selectedPoem, selectListData, isDayPoem) => {
        const blocksData = getBlocksData(selectedPoem.text);
        const lastBlockIndex = blocksData.length - 1;
        const lastBlockRows = blocksData[lastBlockIndex];
        const lastBlockRowIndex = lastBlockRows.length - 1;
        const newLearnData = getNewLearnData(selectedPoem, 'full', lastBlockIndex, lastBlockRowIndex);
        if (!newLearnData) {
            ctx.leave();
            return yandex_dialogs_sdk_1.Reply.text('Вышли назад');
        }
        const text = getPoemText(newLearnData);
        saveSelectListData(ctx.session, Object.assign(Object.assign({}, selectListData), { selectedPoem }));
        if (isDayPoem)
            return yandex_dialogs_sdk_1.Reply.text(`Стих дня: ${getAuthorName(selectedPoem.author)} - ${selectedPoem.title}\n\n${text}\nБудем учить его?`);
        return yandex_dialogs_sdk_1.Reply.text(`Ты выбрал ${getAuthorName(selectedPoem.author)} - ${selectedPoem.title}\n\n${text}\nУчим его?`);
    };
    exports.confirmSelectPoem = confirmSelectPoem;
    const getAuthorName = (author) => { var _a, _b; return `${(_a = author === null || author === void 0 ? void 0 : author.firstName) !== null && _a !== void 0 ? _a : ''} ${(_b = author === null || author === void 0 ? void 0 : author.lastName) !== null && _b !== void 0 ? _b : ''}`.trim(); };
    exports.getAuthorName = getAuthorName;
    const getAllSessionData = (session) => {
        if (!session)
            return {
                error: 'Session not found',
            };
        const functions = {
            currentScene: getCurrentScene,
            sceneHistory: (session) => session.get('sceneHistory') || [],
            selectListData: getSelectListData,
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
        const rows = blocksData[currentBlockIndex];
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
                    const text = 'Повторите стих целиком:\n' + getPoemText(Object.assign(Object.assign({}, learnData), { textType: 'full' }));
                    saveLearnData(ctx.session, Object.assign(Object.assign({}, learnData), { poemСomplited: true }));
                    return yandex_dialogs_sdk_1.Reply.text(text);
                }
                else {
                    ctx.leave();
                    deleteLearnData(ctx.session);
                    return yandex_dialogs_sdk_1.Reply.text('Поздравляю! Вы выучили новый стих');
                }
            }
            console.log('currentRow is last');
            currentBlock.complited = true;
            if (currentBlock.rowsCount > 1 && currentBlock.index != 0 && !currentBlock.complited && currentBlock.rowsCount > 2) {
                console.log('currentBlock is not complited');
                const nextLearnData = Object.assign(Object.assign({}, learnData), { currentBlock, textType: 'full' });
                saveLearnData(ctx.session, nextLearnData);
                const text = 'Молодец! Блок закончен, теперь повтори его полностью:\n\n' + getPoemText(nextLearnData);
                return yandex_dialogs_sdk_1.Reply.text(text);
            }
            else {
                const tts = `Скажите "Дальше", чтобы продолжить.
  Скажить "Повторить стих", чтобы повторить весь стих.
  Скажите "Повторить блок", чтобы повторить последний блок.`;
                return yandex_dialogs_sdk_1.Reply.text({ text: 'Двигаемся дальше, потворяем блок или весь стих?', tts });
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
                const text = 'Повторите строку:\n\n' + getPoemText(nextLearnData);
                return yandex_dialogs_sdk_1.Reply.text(text);
            }
            else {
                currentBlock.learnedRows.push(currentRow.index);
                console.log('repeat block');
                const nextLearnData = Object.assign(Object.assign({}, learnData), { currentBlock, textType: 'block' });
                saveLearnData(ctx.session, nextLearnData);
                const text = 'Повторите уже выученые строки:\n\n' + getPoemText(nextLearnData);
                return yandex_dialogs_sdk_1.Reply.text(text);
            }
        }
    };
    exports.goLearnNext = goLearnNext;
    const deleteSelectListData = (session) => session.delete('selectListData');
    exports.deleteSelectListData = deleteSelectListData;
    const getSelectListData = (session) => session.get('selectListData');
    exports.getSelectListData = getSelectListData;
    const saveSelectListData = (session, newData) => session.set('selectListData', newData); // !
    exports.saveSelectListData = saveSelectListData;
});
define("Alice/findMenuScene", ["require", "exports", "Alice/extras", "yandex-dialogs-sdk", "../Base"], function (require, exports, extras_1, yandex_dialogs_sdk_2, Base_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.atFindMenu = void 0;
    const atFindMenu = new yandex_dialogs_sdk_2.Scene(extras_1.FIND_MENU_SCENE);
    exports.atFindMenu = atFindMenu;
    atFindMenu.command(/рейтинг/gi, () => yandex_dialogs_sdk_2.Reply.text('Рейтинг стихов можешь посмотреть на сайте', { buttons: [yandex_dialogs_sdk_2.Markup.button({ url: 'https://www.google.com', title: 'Перейти на сайт' })] }));
    atFindMenu.command(...extras_1.exitHandler);
    atFindMenu.command(...extras_1.backHandler);
    atFindMenu.command(...extras_1.helpHandler);
    atFindMenu.any((ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const entities = (_a = ctx.nlu) === null || _a === void 0 ? void 0 : _a.entities;
        const { title, author } = (0, extras_1.extractTitleAndAuthor)(ctx.message, entities);
        const authorName = (0, extras_1.getAuthorName)(author);
        const text = `Параметры поиска:
Автор: ${authorName !== null && authorName !== void 0 ? authorName : 'Не задан'}
Название: ${title}`;
        const items = yield (0, Base_2.searchPoems)(author, title);
        let tts = 'Ничего не смог найти. Попробуй сказать по-другому';
        const buttons = items.map(({ title, author }, i) => yandex_dialogs_sdk_2.Markup.button(`${i + 1}). ${(0, extras_1.getAuthorName)(author)} | ${title}`.substring(0, 128)));
        if (buttons.length) {
            tts = 'Вот что я нашел. Для выбора, скажи номер или название. Или скажи "Поиск", чтобы вернуться к поиску.';
            (0, extras_1.addSceneHistory)(ctx.session, extras_1.SELECT_LIST_SCENE);
            (0, extras_1.saveSelectListData)(ctx.session, { items });
            ctx.enter(extras_1.SELECT_LIST_SCENE);
        }
        return yandex_dialogs_sdk_2.Reply.text({ text, tts }, { buttons });
    }));
});
define("Alice/learnScene", ["require", "exports", "Alice/extras", "yandex-dialogs-sdk", "string-comparison"], function (require, exports, extras_2, yandex_dialogs_sdk_3, string_comparison_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.atLearn = void 0;
    const atLearn = new yandex_dialogs_sdk_3.Scene(extras_2.LEARN_SCENE);
    exports.atLearn = atLearn;
    atLearn.command(/дальше/gi, (ctx) => {
        const learnData = (0, extras_2.getOldLearnData)(ctx.session);
        if (!learnData)
            return yandex_dialogs_sdk_3.Reply.text('Вы не можете этого сделать');
        console.log('currentBlock is complited');
        console.log(learnData);
        const { currentBlock, poem } = learnData;
        if (!currentBlock.complited) {
            const poemText = (0, extras_2.getPoemText)(learnData);
            const text = 'Текущий блок еще не выучен.\nПродолжай учить:\n\n' + poemText;
            return yandex_dialogs_sdk_3.Reply.text({ text, tts: 'Сначала выучи текущий блок!\n' + text });
        }
        const nextLearnData = (0, extras_2.getNewLearnData)(poem, 'row', currentBlock.index + 1, 0);
        if (!nextLearnData) {
            ctx.leave();
            return yandex_dialogs_sdk_3.Reply.text('Вернулись в меню');
        }
        (0, extras_2.saveLearnData)(ctx.session, nextLearnData);
        const text = 'Повтори строку:\n\n' + (0, extras_2.getPoemText)(nextLearnData);
        return yandex_dialogs_sdk_3.Reply.text(text);
    });
    atLearn.command(/повторить стих/gi, (ctx) => {
        const learnData = (0, extras_2.getOldLearnData)(ctx.session);
        if (!learnData)
            return yandex_dialogs_sdk_3.Reply.text('Вы не можете этого сделать');
        console.log('repeat poem');
        const newLearnData = Object.assign(Object.assign({}, learnData), { textType: 'full' });
        const text = 'Повтори стих:\n\n' + (0, extras_2.getPoemText)(newLearnData);
        (0, extras_2.saveLearnData)(ctx.session, newLearnData);
        return yandex_dialogs_sdk_3.Reply.text(text);
    });
    atLearn.command(/повторить блок/gi, (ctx) => {
        const learnData = (0, extras_2.getOldLearnData)(ctx.session);
        if (!learnData)
            return yandex_dialogs_sdk_3.Reply.text('Вы не можете этого сделать');
        console.log('repeat poem');
        const newLearnData = Object.assign(Object.assign({}, learnData), { textType: 'block' });
        const text = 'Повтори блок:\n\n' + (0, extras_2.getPoemText)(newLearnData);
        (0, extras_2.saveLearnData)(ctx.session, newLearnData);
        return yandex_dialogs_sdk_3.Reply.text(text);
    });
    atLearn.command(/продолжить/gi, (ctx) => {
        const learnData = (0, extras_2.getOldLearnData)(ctx.session);
        if (!learnData)
            return yandex_dialogs_sdk_3.Reply.text('Вы не можете этого сделать');
        const poemText = (0, extras_2.getPoemText)(learnData);
        if (!learnData.errorCount)
            return yandex_dialogs_sdk_3.Reply.text('Ты не допустили ни одной ошибки. Продолжай учить:\n\n' + poemText);
        return (0, extras_2.goLearnNext)(ctx, Object.assign(Object.assign({}, learnData), { errorCount: 0 }));
    });
    atLearn.command(...extras_2.exitHandler);
    atLearn.command(...extras_2.backHandler);
    atLearn.command(...extras_2.helpHandler);
    atLearn.any((ctx) => {
        const learnData = (0, extras_2.getOldLearnData)(ctx.session);
        if (!learnData)
            return yandex_dialogs_sdk_3.Reply.text('Вы не можете этого сделать');
        const poemText = (0, extras_2.getPoemText)(learnData);
        const matchDigit = string_comparison_1.levenshtein.similarity(poemText.toLowerCase(), ctx.message.toLowerCase());
        // console.log(matchDigit);
        // return goLearnNext(ctx, learnData);
        if (matchDigit > 0.5) {
            return (0, extras_2.goLearnNext)(ctx, learnData);
        }
        else {
            (0, extras_2.saveLearnData)(ctx.session, Object.assign(Object.assign({}, learnData), { errorCount: learnData.errorCount + 1 }));
            const matchText = `Твой текст совпал на ${(matchDigit * 100).toFixed(1)}%.`;
            return yandex_dialogs_sdk_3.Reply.text({ text: `${matchText} Повтори еще раз\n\n${poemText}`, tts: `${matchText} Скажи "Продолжить", чтобы учить дальше или повтори текст: \n\n${poemText}` });
        }
    });
});
define("Alice/selectListScene", ["require", "exports", "Alice/extras", "yandex-dialogs-sdk", "../Base", "lodash"], function (require, exports, extras_3, yandex_dialogs_sdk_4, Base_3, lodash_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.atSelectList = void 0;
    const atSelectList = new yandex_dialogs_sdk_4.Scene(extras_3.SELECT_LIST_SCENE);
    exports.atSelectList = atSelectList;
    atSelectList.command(/поиск/gi, (ctx) => {
        (0, extras_3.deleteSelectListData)(ctx.session);
        const text = String((0, lodash_2.sample)(extras_3.sceneMessages['FIND_MENU_SCENE']));
        (0, extras_3.removeSceneHistory)(ctx.session);
        ctx.enter(extras_3.FIND_MENU_SCENE); // !!
        return yandex_dialogs_sdk_4.Reply.text(text);
    });
    atSelectList.command(/да|учим/gi, (ctx) => {
        const selectListData = (0, extras_3.getSelectListData)(ctx.session);
        const { items, selectedPoem } = selectListData;
        if (!selectedPoem) {
            const buttons = items.map(({ title, author }, i) => yandex_dialogs_sdk_4.Markup.button(`${i + 1}). ${(0, extras_3.getAuthorName)(author)} | ${title}`.substring(0, 128)));
            return yandex_dialogs_sdk_4.Reply.text({ text: 'Выбери стих из списка', tts: 'Сначала выбери стих' }, { buttons });
        }
        const learnData = (0, extras_3.getNewLearnData)(selectedPoem, 'row');
        if (!learnData) {
            ctx.leave();
            return yandex_dialogs_sdk_4.Reply.text('Ошибка.Переход в меню'); // !!
        }
        const text = (0, extras_3.getPoemText)(learnData);
        (0, extras_3.saveLearnData)(ctx.session, learnData);
        (0, extras_3.addSceneHistory)(ctx.session, extras_3.LEARN_SCENE);
        (0, extras_3.deleteSelectListData)(ctx.session);
        ctx.enter(extras_3.LEARN_SCENE);
        return yandex_dialogs_sdk_4.Reply.text('Повтори строку:\n\n' + text);
    });
    atSelectList.command(/нет|другой/gi, (ctx) => {
        const selectListData = (0, extras_3.getSelectListData)(ctx.session);
        const { items } = selectListData;
        const buttons = items.map(({ title, author }, i) => yandex_dialogs_sdk_4.Markup.button(`${i + 1}). ${(0, extras_3.getAuthorName)(author)} | ${title}`.substring(0, 128)));
        (0, extras_3.saveSelectListData)(ctx.session, { items });
        return yandex_dialogs_sdk_4.Reply.text('Выбери стих из списка', { buttons });
    });
    atSelectList.command(...extras_3.exitHandler);
    atSelectList.command(...extras_3.backHandler);
    atSelectList.command(...extras_3.helpHandler);
    atSelectList.any((ctx) => {
        var _a, _b;
        const entities = (_a = ctx.nlu) === null || _a === void 0 ? void 0 : _a.entities;
        const selectListData = (0, extras_3.getSelectListData)(ctx.session);
        if (entities === null || entities === void 0 ? void 0 : entities.length) {
            const numbers = entities.filter((item) => item.type === 'YANDEX.NUMBER');
            if (numbers.length) {
                console.log(selectListData);
                if (!selectListData)
                    return yandex_dialogs_sdk_4.Reply.text('error');
                const { items } = selectListData;
                const itemNumbers = items.map((_, i) => i + 1);
                console.log(itemNumbers);
                const currentNumber = (_b = numbers.find((item) => itemNumbers.includes(Number(item.value)))) === null || _b === void 0 ? void 0 : _b.value;
                console.log(currentNumber);
                const selectedPoem = items.find((_, i) => i + 1 === currentNumber);
                if (selectedPoem)
                    return (0, extras_3.confirmSelectPoem)(ctx, selectedPoem, selectListData);
            }
        }
        const { title, author } = (0, extras_3.extractTitleAndAuthor)(ctx.message, entities);
        const bestMatch = [...selectListData.items].sort((a, b) => (0, Base_3.comparePoem)(a, b, title, author))[0];
        if (bestMatch)
            return (0, extras_3.confirmSelectPoem)(ctx, bestMatch, selectListData);
        const tts = String((0, lodash_2.sample)(extras_3.sceneHints['SELECT_LIST_SCENE']));
        const buttons = selectListData.items.map(({ title, author }, i) => yandex_dialogs_sdk_4.Markup.button(`${i + 1}). ${(0, extras_3.getAuthorName)(author)} | ${title}`.substring(0, 128)));
        return yandex_dialogs_sdk_4.Reply.text({ text: 'Выберите стих из списка:', tts }, { buttons });
    });
});
define("Alice/index", ["require", "exports", "yandex-dialogs-sdk", "Alice/extras", "../Base", "Alice/findMenuScene", "Alice/learnScene", "Alice/selectListScene", "lodash"], function (require, exports, yandex_dialogs_sdk_5, extras_4, Base_4, findMenuScene_1, learnScene_1, selectListScene_1, lodash_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.alice = void 0;
    const alice = new yandex_dialogs_sdk_5.Alice();
    exports.alice = alice;
    alice.command('', (ctx) => {
        const c = ctx;
        const learnData = (0, extras_4.getOldLearnData)(c.session);
        console.log(learnData);
        return yandex_dialogs_sdk_5.Reply.text(`Добро пожаловать в "Зубрилку".
${(0, lodash_3.sample)(['Здесь ты можешь выучить стихотворение.', 'Я помогу тебе выучить стихотворение.'])}${learnData ? "\nСкажи 'Учить', чтобы продолжить учить." : ''}
Скажи 'Найти', чтобы начать поиск.
Скажи 'Помощь' в любом месте, чтобы получить помощь.`);
    });
    alice.command(/новый|новое|другое|найти|поиск|искать/gi, (ctx) => {
        const c = ctx;
        (0, extras_4.addSceneHistory)(c.session, extras_4.FIND_MENU_SCENE);
        c.enter(extras_4.FIND_MENU_SCENE);
        const message = String((0, lodash_3.sample)(extras_4.sceneMessages['FIND_MENU_SCENE']));
        return yandex_dialogs_sdk_5.Reply.text(message);
    });
    alice.command(/учить|продолжи/gi, (ctx) => {
        const c = ctx;
        const learnData = (0, extras_4.getOldLearnData)(c.session);
        if (!learnData) {
            (0, extras_4.addSceneHistory)(c.session, extras_4.FIND_MENU_SCENE);
            c.enter(extras_4.FIND_MENU_SCENE);
            return yandex_dialogs_sdk_5.Reply.text('Ты ещё не начал учить стихотворение с "Зубрилкой".\nНазови имя/фамилию автора или название стиха, чтобы начать поиск');
        }
        (0, extras_4.addSceneHistory)(c.session, extras_4.LEARN_SCENE);
        const { poem } = learnData;
        const poemText = (0, extras_4.getPoemText)(learnData);
        const text = `Продолжаем учить стих ${(0, extras_4.getAuthorName)(poem.author)} - ${poem.title}.
Повтори текст:

${poemText}`;
        c.enter(extras_4.LEARN_SCENE);
        return yandex_dialogs_sdk_5.Reply.text(text);
    });
    alice.command(/запомни|запиши|запись|записать|запомнить/gi, () => yandex_dialogs_sdk_5.Reply.text('К сожалению, я не умею записывать ваш голос. Перейди на сайт', { buttons: [yandex_dialogs_sdk_5.Markup.button({ title: 'Перейти на сайт', hide: true, url: 'https://www.google.com' })] }));
    alice.command(/расскажи|умеешь|не/gi, (ctx) => __awaiter(void 0, void 0, void 0, function* () { return extras_4.helpHandler[1](ctx); }));
    alice.command(/стих дня/gi, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const c = ctx;
        const poem = yield (0, Base_4.getTodayPoem)();
        if (!poem)
            return yandex_dialogs_sdk_5.Reply.text('К сожалению, сегодня не день стихов');
        (0, extras_4.addSceneHistory)(c.session, extras_4.SELECT_LIST_SCENE);
        c.enter(extras_4.SELECT_LIST_SCENE);
        return (0, extras_4.confirmSelectPoem)(c, poem, { items: [poem] }, true);
    }));
    alice.command('лог', (ctx) => {
        const c = ctx;
        (0, extras_4.enableLogging)(c.session);
        return yandex_dialogs_sdk_5.Reply.text('Логирование влючено\nТвой ид:\n' + c.userId);
    });
    alice.command(...extras_4.exitHandler);
    alice.command(...extras_4.helpHandler);
    alice.any((ctx) => {
        const c = ctx;
        const currentScene = (0, extras_4.getCurrentScene)(c.session);
        const hint = String((0, lodash_3.sample)(extras_4.sceneHints[currentScene]));
        return yandex_dialogs_sdk_5.Reply.text(hint);
    });
    alice.on('response', (ctx) => {
        const c = ctx;
        if (!(0, extras_4.loggingIsEnable)(c.session))
            return;
        (0, Base_4.saveLog)(c.userId, (0, extras_4.getAllSessionData)(c.session));
    });
    // registerLearnScene(alice, LEARN_SCENE);
    alice.registerScene(learnScene_1.atLearn);
    alice.registerScene(findMenuScene_1.atFindMenu);
    alice.registerScene(selectListScene_1.atSelectList);
});
define("Api/index", ["require", "exports", "../Base", "express", "swagger-ui-express", "../Alice", "cors", "express-fileupload", "./swagger.json"], function (require, exports, Base_5, express_1, swagger_ui_express_1, Alice_1, cors_1, express_fileupload_1, swagger_json_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.app = void 0;
    express_1 = __importStar(express_1);
    cors_1 = __importDefault(cors_1);
    express_fileupload_1 = __importDefault(express_fileupload_1);
    swagger_json_1 = __importDefault(swagger_json_1);
    // import swaggerDoc from './swagger.dev.json';
    const app = (0, express_1.default)();
    exports.app = app;
    app.use((0, express_1.json)());
    app.use((0, express_1.urlencoded)({ extended: false }));
    app.use((0, cors_1.default)());
    app.use((0, express_fileupload_1.default)({ limits: { files: 1 } }));
    // POEM
    // Возвращает стих
    app.get('/api/poem/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const poem = id === 'today' ? yield (0, Base_5.getTodayPoem)() : yield (0, Base_5.getPoem)(id);
        if (!poem)
            return res.status(404).send({ error: { message: 'Poem not found' } });
        return res.send({ response: poem });
    }));
    // Возвращает записи стиха
    app.get('/api/records/:poemId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { poemId } = req.params;
        const { offset } = req.query;
        const response = yield (0, Base_5.getPoemRecords)(poemId, offset !== null && offset !== void 0 ? offset : 0);
        return res.send({ response });
    }));
    // Возвращает записи стихов
    app.get('/api/records', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { offset } = req.query;
        const response = yield (0, Base_5.getAllPoemRecords)(offset !== null && offset !== void 0 ? offset : 0);
        return res.send({ response });
    }));
    // RECORD
    // Загрузка новой записи
    app.post('/api/record', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { files } = req;
        const { userId, poemId } = req.body;
        if (!(files === null || files === void 0 ? void 0 : files.record))
            return res.status(400).send({ error: { message: 'Parameter "record" is empty' } });
        if (!userId)
            return res.status(400).send({ error: { message: 'Parameter "userId" is empty' } });
        if (!poemId)
            return res.status(400).send({ error: { message: 'Parameter "poemId" is empty' } });
        const record = files.record;
        const response = yield (0, Base_5.saveNewPoemRecord)(userId, poemId, record);
        return res.send({ response });
    }));
    // Возвращает запись
    app.get('/api/record/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const poemRecord = yield (0, Base_5.getPoemRecord)(id);
        if (!poemRecord)
            return res.status(404).send({ error: { message: 'Poem record not found' } });
        return res.send({ response: poemRecord });
    }));
    // Удаляет запись
    app.delete('/api/record/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId)
            return res.status(400).send({ error: { message: 'Parameter "userId" is empty' } });
        const ok = yield (0, Base_5.deletePoemRecord)(userId, id);
        return res.sendStatus(ok ? 201 : 403);
    }));
    // Оценить запись
    app.post('/api/record/:id/vote', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const { userId, vote } = req.body;
        if (!id)
            return res.status(400).send({ error: { message: 'Parameter "id" is empty' } });
        if (!userId)
            return res.status(400).send({ error: { message: 'Parameter "userId" is empty' } });
        if (!vote)
            return res.status(400).send({ error: { message: 'Parameter "vote" is empty' } });
        const ok = yield (0, Base_5.setPoemRecordScore)(id, userId, Number(vote));
        return res.sendStatus(ok ? 201 : 403);
    }));
    // USER
    // Возвращает топ записей юзера
    app.get('/api/user/:id/records', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const { poemId } = req.query;
        if (!id)
            return res.status(400).send({ error: { message: 'Parameter "id" is empty' } });
        const response = yield (0, Base_5.getUserRecords)(id, poemId);
        return res.send({ response });
    }));
    // Возвращает топ юзеров и их записей
    app.get('/api/users/records', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { poemId, offset } = req.query;
        const response = yield (0, Base_5.getAllUserRecords)(offset !== null && offset !== void 0 ? offset : 0, poemId);
        return res.send({ response });
    }));
    // EXTRA
    app.get('/api/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { firstName, title, lastName } = req.query;
        const response = yield (0, Base_5.searchPoems)({ firstName: firstName !== null && firstName !== void 0 ? firstName : '', lastName: lastName !== null && lastName !== void 0 ? lastName : '' }, title);
        return res.send({ response });
    }));
    app.get('/wakeup', (req, res) => res.send('OK'));
    app.use('/swagger', swagger_ui_express_1.serve, (0, swagger_ui_express_1.setup)(swagger_json_1.default));
    app.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield Alice_1.alice.handleRequest(req.body);
        return res.send(result);
    }));
});
define("Base/index", ["require", "exports", "firebase-admin", "string-comparison", "./serviceAccount.json", "uuid"], function (require, exports, firebase_admin_1, string_comparison_2, serviceAccount_json_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reshuffleTodayPoemId = exports.getAllUserRecords = exports.getUserRecords = exports.setPoemRecordScore = exports.getPoemRecord = exports.getPoemRecords = exports.deletePoemRecord = exports.saveNewPoemRecord = exports.getTodayPoem = exports.getAllPoemRecords = exports.cleanLog = exports.saveLog = exports.logsRef = exports.comparePoem = exports.searchPoems = exports.savePoem = exports.poemIsExists = exports.getPoem = void 0;
    firebase_admin_1 = __importDefault(firebase_admin_1);
    serviceAccount_json_1 = __importDefault(serviceAccount_json_1);
    const app = firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount_json_1.default),
        databaseURL: 'https://zoobrilka-app-default-rtdb.europe-west1.firebasedatabase.app',
        // databaseURL: process.env.DATABASE_URL,
    });
    const base = app.database();
    const storage = app.storage().bucket('gs://zoobrilka-app.appspot.com');
    const poemsRef = base.ref('poems');
    const usersRef = base.ref('users');
    const recordsRef = base.ref('records');
    const logsRef = base.ref('logs');
    exports.logsRef = logsRef;
    // eslint-disable-next-line prefer-const
    let todayPoemId = '0';
    const saveLog = (id, log) => __awaiter(void 0, void 0, void 0, function* () { return logsRef.child(id).push(log); });
    exports.saveLog = saveLog;
    const cleanLog = (id) => __awaiter(void 0, void 0, void 0, function* () { return logsRef.child(id).remove(); });
    exports.cleanLog = cleanLog;
    const getPoemSnapshot = (id) => __awaiter(void 0, void 0, void 0, function* () { return yield poemsRef.child(id).once('value'); });
    const getPoem = (id) => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield getPoemSnapshot(id);
        const data = res.toJSON();
        if (data)
            return data;
        return null;
    });
    exports.getPoem = getPoem;
    const getTodayPoem = () => __awaiter(void 0, void 0, void 0, function* () {
        console.log(todayPoemId);
        return getPoem(todayPoemId);
    });
    exports.getTodayPoem = getTodayPoem;
    const poemIsExists = (id) => __awaiter(void 0, void 0, void 0, function* () { return (yield getPoemSnapshot(id)).exists(); });
    exports.poemIsExists = poemIsExists;
    const savePoem = (poem) => __awaiter(void 0, void 0, void 0, function* () {
        poemsRef.child(String(poem.id)).update(poem);
    });
    exports.savePoem = savePoem;
    const comparePoem = (a, b, title, author) => {
        var _a, _b, _c, _d;
        const poem1 = string_comparison_2.levenshtein.similarity(a.title, title) + string_comparison_2.levenshtein.similarity(a.author.firstName, (_a = author === null || author === void 0 ? void 0 : author.firstName) !== null && _a !== void 0 ? _a : '') + string_comparison_2.levenshtein.similarity(a.author.lastName, (_b = author === null || author === void 0 ? void 0 : author.lastName) !== null && _b !== void 0 ? _b : '');
        const poem2 = string_comparison_2.levenshtein.similarity(b.title, title) + string_comparison_2.levenshtein.similarity(b.author.firstName, (_c = author === null || author === void 0 ? void 0 : author.firstName) !== null && _c !== void 0 ? _c : '') + string_comparison_2.levenshtein.similarity(a.author.lastName, (_d = author === null || author === void 0 ? void 0 : author.lastName) !== null && _d !== void 0 ? _d : '');
        return poem2 - poem1;
    };
    exports.comparePoem = comparePoem;
    const searchPoems = (author, title) => __awaiter(void 0, void 0, void 0, function* () {
        console.time('searchPoems');
        console.log(author);
        console.log(title);
        const arr = [];
        if (author === null || author === void 0 ? void 0 : author.firstName)
            arr.push(poemsRef
                .orderByChild('author/firstName')
                .startAt(author.firstName)
                .endAt(author.firstName + '\uf8ff')
                .limitToFirst(5)
                .once('value'));
        if (author === null || author === void 0 ? void 0 : author.lastName)
            arr.push(poemsRef
                .orderByChild('author/lastName')
                .startAt(author.lastName)
                .endAt(author.lastName + '\uf8ff')
                .limitToFirst(5)
                .once('value'));
        if (title)
            arr.push(poemsRef
                .orderByChild('queryTitle')
                .startAt(title)
                .endAt(title + '\uf8ff')
                .limitToFirst(5)
                .once('value'));
        let res = (yield Promise.all(arr).then((values) => values.map((value) => { var _a; return Object.values((_a = value.val()) !== null && _a !== void 0 ? _a : {}); }))).reduce((acc, value) => [
            ...acc,
            ...value.filter((value) => acc.filter((x) => x.author.firstName === value.author.firstName && x.author.lastName === value.author.lastName && x.title === value.title).length === 0),
        ], []);
        res = res.sort((a, b) => comparePoem(a, b, title !== null && title !== void 0 ? title : '', author)).slice(0, 5);
        console.timeEnd('searchPoems');
        console.log(res.map((x) => `${x.author} - ${x.title}`));
        return res;
    });
    exports.searchPoems = searchPoems;
    const getPoemRecord = (recordId) => __awaiter(void 0, void 0, void 0, function* () { return (yield recordsRef.child(recordId).once('value')).toJSON(); });
    exports.getPoemRecord = getPoemRecord;
    const updatePoemRecord = (poemRecord) => __awaiter(void 0, void 0, void 0, function* () { return yield recordsRef.child(poemRecord.id).update(poemRecord); });
    const saveNewPoemRecord = (userId, poemId, record) => __awaiter(void 0, void 0, void 0, function* () {
        const recordId = (0, uuid_1.v4)();
        const file = storage.file(`${poemId}/${recordId}.mp3`);
        yield file.save(record.data);
        const url = (yield file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491',
        }))[0];
        const poemRecord = {
            id: recordId,
            url,
            owner: userId,
            poem: poemId,
            rating: 0,
        };
        updatePoemRecord(poemRecord);
        usersRef.child(`${userId}/records`).transaction((arr) => {
            arr !== null && arr !== void 0 ? arr : (arr = []);
            arr.push(recordId);
            return arr;
        });
        return poemRecord;
    });
    exports.saveNewPoemRecord = saveNewPoemRecord;
    const getUser = (userId) => __awaiter(void 0, void 0, void 0, function* () { return (yield usersRef.child(userId).once('value')).toJSON(); });
    const updateUser = (user) => __awaiter(void 0, void 0, void 0, function* () { return yield usersRef.child(user.id).update(user); });
    const calculateUserRating = (recordIds) => __awaiter(void 0, void 0, void 0, function* () {
        const votes = [];
        for (let i = 0; i < recordIds.length; i++) {
            const poemRecord = yield getPoemRecord(recordIds[i]);
            if (!poemRecord)
                continue;
            votes.push(poemRecord.rating);
        }
        console.log(votes);
        return Number((votes.reduce((sum, value) => sum + value, 0) / votes.length).toFixed(1));
    });
    const deletePoemRecord = (userId, recordId) => __awaiter(void 0, void 0, void 0, function* () {
        const recordRef = recordsRef.child(recordId);
        const poemRecord = (yield recordRef.once('value')).toJSON();
        if (!poemRecord || poemRecord.owner !== userId)
            return false;
        recordRef.remove();
        const user = yield getUser(userId);
        if (user && user.records) {
            const arr = Object.values(user.records);
            user.records = arr.filter((id) => id !== recordId);
            user.rating = yield calculateUserRating(arr);
            updateUser(user);
        }
        return true;
    });
    exports.deletePoemRecord = deletePoemRecord;
    const setPoemRecordScore = (recordId, userId, vote) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const poemRecord = yield getPoemRecord(recordId);
        if (!poemRecord)
            return false;
        (_a = poemRecord.votes) !== null && _a !== void 0 ? _a : (poemRecord.votes = {});
        poemRecord.votes[userId] = vote;
        const votes = Object.values(poemRecord.votes);
        poemRecord.rating = Number((votes.reduce((sum, value) => sum + value, 0) / votes.length).toFixed(1));
        yield updatePoemRecord(poemRecord);
        const owner = yield getUser(poemRecord.owner);
        if (owner && owner.records && Object.values(owner.records).includes(recordId)) {
            owner.rating = yield calculateUserRating(Object.values(owner.records));
            updateUser(owner);
        }
        return true;
    });
    exports.setPoemRecordScore = setPoemRecordScore;
    const getPoemRecords = (poemId, offset) => __awaiter(void 0, void 0, void 0, function* () {
        const poemRecords = (yield recordsRef.orderByChild('poem').equalTo(poemId).once('value')).toJSON();
        if (!poemRecords)
            return [];
        const arr = Object.values(poemRecords)
            .sort((a, b) => b.rating - a.rating)
            .slice(offset, offset + 10);
        return arr;
    });
    exports.getPoemRecords = getPoemRecords;
    const getAllPoemRecords = (offset) => __awaiter(void 0, void 0, void 0, function* () {
        const poemRecords = (yield recordsRef.once('value')).toJSON();
        if (!poemRecords)
            return [];
        const arr = Object.values(poemRecords)
            .sort((a, b) => b.rating - a.rating)
            .slice(offset, offset + 10);
        return arr;
    });
    exports.getAllPoemRecords = getAllPoemRecords;
    const getSortedRecords = (records, poemId) => __awaiter(void 0, void 0, void 0, function* () {
        const poemRecords = [];
        console.log(records);
        for (let i = 0; i < records.length; i++) {
            const recordId = records[i];
            const record = yield getPoemRecord(recordId);
            if (!record || (poemId && record.poem !== poemId))
                continue;
            poemRecords.push(record);
        }
        return poemRecords.sort((a, b) => b.rating - a.rating);
    });
    const getUserRecords = (userId, poemId) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield getUser(userId);
        if (!user || !user.records)
            return [];
        return getSortedRecords(Object.values(user.records), poemId);
    });
    exports.getUserRecords = getUserRecords;
    const getAllUserRecords = (offset, poemId) => __awaiter(void 0, void 0, void 0, function* () {
        const usersData = (yield usersRef.once('value')).toJSON();
        if (!usersData)
            return [];
        const users = Object.values(usersData)
            .sort((a, b) => { var _a, _b; return ((_a = b.rating) !== null && _a !== void 0 ? _a : 0) - ((_b = a.rating) !== null && _b !== void 0 ? _b : 0); })
            .slice(offset, offset + 10);
        const usersRecords = [];
        for (const user of users) {
            if (!user.records)
                continue;
            usersRecords.push({ userId: user.id, records: yield getSortedRecords(Object.values(user.records), poemId) });
        }
        return usersRecords;
    });
    exports.getAllUserRecords = getAllUserRecords;
    const reshuffleTodayPoemId = () => __awaiter(void 0, void 0, void 0, function* () {
        do {
            todayPoemId = String(Math.ceil(Math.random() * 49000));
            console.log('try ', todayPoemId);
        } while (!(yield poemIsExists(todayPoemId)));
        console.log('todayPoemId >', todayPoemId);
    });
    exports.reshuffleTodayPoemId = reshuffleTodayPoemId;
});
define("SocketServer/index", ["require", "exports", "socket.io", "../Base"], function (require, exports, socket_io_1, Base_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createIoServer = void 0;
    const onConnection = (socket) => {
        console.log('Client connected...');
        socket.on('users:get', () => __awaiter(void 0, void 0, void 0, function* () {
            const users = (yield Base_6.logsRef.once('value')).toJSON();
            if (users)
                return socket.emit('users', Object.keys(users));
            return socket.emit('users', []);
        }));
        socket.on('user:set', (userId) => {
            if (socket.data.baseRef)
                socket.data.baseRef.off();
            console.log(userId);
            const base = Base_6.logsRef.child(userId).limitToLast(2);
            base.on('child_added', (data) => {
                console.log('base edit');
                socket.emit('logs:update', data.val());
            });
            socket.data.baseRef = base;
        });
        socket.on('disconnect', () => {
            if (socket.data.baseRef)
                socket.data.baseRef.off();
            console.log('Client disconnect...');
        });
    };
    const createIoServer = (server) => {
        const ioServer = new socket_io_1.Server(server, { cors: {} });
        ioServer.on('connection', onConnection);
        return ioServer;
    };
    exports.createIoServer = createIoServer;
});
