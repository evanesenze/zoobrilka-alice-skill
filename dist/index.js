"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./Api");
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const string_comparison_1 = require("string-comparison");
const lodash_1 = require("lodash");
const Base_1 = require("./Base");
const port = Number(process.env.PORT) || 3000;
const ROWS_COUNT = 2;
const alice = new yandex_dialogs_sdk_1.Alice();
const exitHandler = [
    ['выйти', 'хватит', 'стоп', 'я устал'],
    (ctx) => {
        ctx.leave();
        return yandex_dialogs_sdk_1.Reply.text('Хорошо, будет скучно - обращайтесь.', { end_session: true });
    },
];
const backHandler = [
    ['назад', 'вернись'],
    (ctx) => {
        console.log(ctx.session);
        const scene = removeSceneHistory(ctx.session);
        if (!scene) {
            ctx.leave();
            return yandex_dialogs_sdk_1.Reply.text('Мы вернулись в меню');
        }
        ctx.enter(scene);
        const message = String((0, lodash_1.sample)(sceneMessages[scene]));
        return yandex_dialogs_sdk_1.Reply.text(message);
    },
];
const wrongHandler = (ctx) => {
    const c = ctx;
    const currentScene = getCurrentScene(c.session);
    if (!currentScene)
        return yandex_dialogs_sdk_1.Reply.text('К сожалению я не поняла, что Вы хотели сказать, повторите пожалуйста.');
    const hint = String((0, lodash_1.sample)(sceneHints[currentScene]));
    return yandex_dialogs_sdk_1.Reply.text(hint);
};
const FIND_MENU_SCENE = 'FIND_MENU_SCENE';
const SELECT_LIST_SCENE = 'SELECT_LIST_SCENE';
const LEARN_SCENE = 'LEARN_SCENE';
const sceneMessages = {
    LEARN_SCENE: ['Начинаем учить'],
    FIND_MENU_SCENE: ['Я могу найти стих по автору или по названию. Также можете взглянуть на рейтинг'],
    SELECT_LIST_SCENE: ['Выбери стих из списка\n Для перемещения скажите "Далее/Назад"\nДля перехода к поиску, скажите "Поиск"'],
};
const sceneHints = {
    LEARN_SCENE: ['Учите, ничем не могу помочь'],
    FIND_MENU_SCENE: ['Назовите автора или название стиха, чтобы начать поиск'],
    SELECT_LIST_SCENE: ['Для выбора стиха, назовите его номер\nДля перехода к поиску, скажите "Поиск"'],
};
const getCurrentScene = (session) => {
    const arr = (session.get('sceneHistory') || []);
    return arr[arr.length - 1];
};
const removeSceneHistory = (session) => {
    const arr = (session.get('sceneHistory') || []);
    arr.pop();
    session.set('sceneHistory', arr);
    return arr[arr.length - 1];
};
const addSceneHistory = (session, newSceneName) => {
    const arr = (session.get('sceneHistory') || []);
    arr.push(newSceneName);
    session.set('sceneHistory', [...new Set(arr)]);
};
const deleteLearnData = (session) => session.delete('learnData');
const getOldLearnData = (session) => session.get('learnData');
const getBlocksData = (text) => text.split('\n\n').map((item) => item.split('\n'));
const getNewLearnData = (poem, textType, currentBlockIndex = 0, currentRowIndex = 0) => {
    const blocksData = getBlocksData(poem.text);
    if (currentBlockIndex > blocksData.length - 1)
        return null;
    const rows = blocksData[currentBlockIndex];
    const blocksCount = blocksData.length - 1;
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
            isLast: currentBlockIndex === blocksCount,
            learnedRows,
        },
        currentRow: {
            index: currentRowIndex,
            isLast: rowsCount === currentRowIndex + 1,
        },
    };
};
const saveLearnData = (session, data) => session.set('learnData', data); // !
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
const deleteSelectData = (session) => session.delete('selectListData');
const getSelectListData = (session) => session.get('selectListData');
const saveSelectListData = (session, newData) => session.set('selectListData', newData); // !
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
const atLearn = new yandex_dialogs_sdk_1.Scene(LEARN_SCENE);
atLearn.command(/дальше/, (ctx) => {
    const learnData = getOldLearnData(ctx.session);
    console.log('currentBlock is complited');
    console.log(learnData);
    const { currentBlock, poem } = learnData;
    if (!currentBlock.complited) {
        const poemText = getPoemText(learnData);
        const text = 'Продолжайте учить:\n\n' + poemText;
        return yandex_dialogs_sdk_1.Reply.text({ text, tts: 'Сначала выучите текущий блок!\n' + text });
    }
    const nextLearnData = getNewLearnData(poem, 'row', currentBlock.index + 1, 0);
    if (!nextLearnData) {
        ctx.leave();
        return yandex_dialogs_sdk_1.Reply.text('Переход в меню');
    }
    saveLearnData(ctx.session, nextLearnData);
    const text = 'Повторите строку:\n\n' + getPoemText(nextLearnData);
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atLearn.command('повторить стих', (ctx) => {
    const learnData = getOldLearnData(ctx.session);
    console.log('repeat poem');
    const text = 'Повторите стих:\n\n' + getPoemText(Object.assign(Object.assign({}, learnData), { textType: 'full' }));
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atLearn.command('повторить блок', (ctx) => {
    const learnData = getOldLearnData(ctx.session);
    console.log('repeat poem');
    const text = 'Повторите блок:\n\n' + getPoemText(Object.assign(Object.assign({}, learnData), { textType: 'block' }));
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atLearn.command(/продолжить/, (ctx) => {
    const learnData = getOldLearnData(ctx.session);
    const poemText = getPoemText(learnData);
    if (!learnData.errorCount)
        return yandex_dialogs_sdk_1.Reply.text('Вы не допустили ни одной ошибки. Продолжайте учить:\n\n' + poemText);
    return goLearnNext(ctx, Object.assign(Object.assign({}, learnData), { errorCount: 0 }));
});
atLearn.any((ctx) => {
    const learnData = getOldLearnData(ctx.session);
    const poemText = getPoemText(learnData);
    const matchDigit = string_comparison_1.levenshtein.similarity(poemText.toLowerCase(), ctx.message.toLowerCase());
    console.log(matchDigit);
    return goLearnNext(ctx, learnData);
    if (matchDigit > 0.5) {
        return goLearnNext(ctx, learnData);
    }
    else {
        saveLearnData(ctx.session, Object.assign(Object.assign({}, learnData), { errorCount: learnData.errorCount + 1 }));
        const matchText = `Твой текст совпал на ${(matchDigit * 100).toFixed(1)}%.`;
        return yandex_dialogs_sdk_1.Reply.text({ text: `${matchText} Повторите еще раз\n\n${poemText}`, tts: `${matchText} Скажи "Продолжить", чтобы учить дальше или повтори текст: \n\n${poemText}` });
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
const atFindMenu = new yandex_dialogs_sdk_1.Scene(FIND_MENU_SCENE);
atFindMenu.command(/рейтинг/i, () => yandex_dialogs_sdk_1.Reply.text('Рейтинг стихов можете посмотреть на сайте', { buttons: [yandex_dialogs_sdk_1.Markup.button({ url: 'https://www.google.com', title: 'Перейти на сайт' })] }));
atFindMenu.command(...exitHandler);
atFindMenu.command(...backHandler);
atFindMenu.any((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const entities = (_a = ctx.nlu) === null || _a === void 0 ? void 0 : _a.entities;
    console.log(entities);
    let author = 'Не задан';
    let title = `${ctx.message[0].toUpperCase()}${ctx.message.slice(1).toLocaleLowerCase()}`;
    const names = entities === null || entities === void 0 ? void 0 : entities.filter((item) => item.type === 'YANDEX.FIO').map((item) => item).filter((item) => !!item.value.first_name);
    if (names === null || names === void 0 ? void 0 : names.length) {
        const namesCount = names.length - 1;
        const name = names[namesCount];
        if (names === null || names === void 0 ? void 0 : names.length) {
            const first_name = `${name.value.first_name[0].toUpperCase()}${name.value.first_name.slice(1).toLocaleLowerCase()}`;
            const last_name = `${(_c = (_b = name.value.last_name) === null || _b === void 0 ? void 0 : _b[0].toUpperCase()) !== null && _c !== void 0 ? _c : ''}${(_e = (_d = name.value.last_name) === null || _d === void 0 ? void 0 : _d.slice(1).toLocaleLowerCase()) !== null && _e !== void 0 ? _e : ''}`;
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
    const items = yield (0, Base_1.searchPoems)(author, title);
    let tts = 'Ничего не смог найти';
    const buttons = items.map(({ title, author }, i) => yandex_dialogs_sdk_1.Markup.button(`${i + 1}). ${author} | ${title}`.substring(0, 128)));
    if (buttons.length) {
        tts = 'Вот что я нашел. Для выбора, назовите номер. Для выхода, скажите "Поиск"';
        saveSelectListData(ctx.session, { items });
        ctx.enter(SELECT_LIST_SCENE);
    }
    return yandex_dialogs_sdk_1.Reply.text({ text, tts }, { buttons });
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
}));
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
const atSelectList = new yandex_dialogs_sdk_1.Scene(SELECT_LIST_SCENE);
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
    const text = String((0, lodash_1.sample)(sceneMessages['FIND_MENU_SCENE']));
    ctx.enter(FIND_MENU_SCENE);
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atSelectList.command(/да|учим/, (ctx) => {
    const selectListData = getSelectListData(ctx.session);
    const { items, selectedPoem } = selectListData;
    if (!selectedPoem) {
        const buttons = items.map(({ title, author }, i) => yandex_dialogs_sdk_1.Markup.button(`${i + 1}). ${author} | ${title}`.substring(0, 128)));
        return yandex_dialogs_sdk_1.Reply.text({ text: 'Выберите стих из списка', tts: 'Сначала выберите стих' }, { buttons });
    }
    const learnData = getNewLearnData(selectedPoem, 'row');
    if (!learnData) {
        ctx.leave();
        return yandex_dialogs_sdk_1.Reply.text('Ошибка.Переход в меню');
    }
    const text = getPoemText(learnData);
    saveLearnData(ctx.session, learnData);
    ctx.enter(LEARN_SCENE);
    return yandex_dialogs_sdk_1.Reply.text('Повторите строку:\n\n' + text);
});
atSelectList.command(/нет|другой/, (ctx) => {
    const selectListData = getSelectListData(ctx.session);
    const { items } = selectListData;
    const buttons = items.map(({ title, author }, i) => yandex_dialogs_sdk_1.Markup.button(`${i + 1}). ${author} | ${title}`.substring(0, 128)));
    saveSelectListData(ctx.session, { items });
    return yandex_dialogs_sdk_1.Reply.text('Выберите стих из списка', { buttons });
});
atSelectList.command(...exitHandler);
atSelectList.command(...backHandler);
atSelectList.any((ctx) => {
    var _a, _b;
    const entities = (_a = ctx.nlu) === null || _a === void 0 ? void 0 : _a.entities;
    const selectListData = getSelectListData(ctx.session);
    if (entities === null || entities === void 0 ? void 0 : entities.length) {
        const numbers = entities.filter((item) => item.type === 'YANDEX.NUMBER');
        if (numbers.length) {
            console.log(selectListData);
            if (!selectListData)
                return yandex_dialogs_sdk_1.Reply.text('error');
            const { items } = selectListData;
            const itemNumbers = items.map((_, i) => i + 1);
            console.log(itemNumbers);
            const currentNumber = (_b = numbers.find((item) => itemNumbers.includes(Number(item.value)))) === null || _b === void 0 ? void 0 : _b.value;
            console.log(currentNumber);
            const selectedPoem = items.find((_, i) => i + 1 === currentNumber);
            if (selectedPoem) {
                const blocksData = getBlocksData(selectedPoem.text);
                const lastBlockIndex = blocksData.length - 1;
                const lastBlockRows = blocksData[lastBlockIndex];
                const lastBlockRowIndex = lastBlockRows.length - 1;
                const text = getPoemText(getNewLearnData(selectedPoem, 'full', lastBlockIndex, lastBlockRowIndex));
                saveSelectListData(ctx.session, Object.assign(Object.assign({}, selectListData), { selectedPoem }));
                return yandex_dialogs_sdk_1.Reply.text(`Ты выбрал ${selectedPoem.author} - ${selectedPoem.title}\n\n${text}\nУчим его?`);
            }
        }
    }
    const tts = String((0, lodash_1.sample)(sceneHints['SELECT_LIST_SCENE']));
    const buttons = selectListData.items.map(({ title, author }, i) => yandex_dialogs_sdk_1.Markup.button(`${i + 1}). ${author} | ${title}`.substring(0, 128)));
    return yandex_dialogs_sdk_1.Reply.text({ text: 'Выберите стих из списка:', tts }, { buttons });
});
alice.command('', () => {
    return yandex_dialogs_sdk_1.Reply.text(`Добро пожаловать в “Навык изучениия стихов”.
${(0, lodash_1.sample)(['Здесь вы можете выучить стихотворение.', 'Я помогу вам выучить стихотворение.'])}
Вы уже знакомы с тем, что я умею?`);
});
alice.command(/да|знаком/i, () => yandex_dialogs_sdk_1.Reply.text(`Итак, что будем учить сегодня?
Скажите “давай продолжим учить”, чтобы продолжить учить стихотворение.
Скажите “давай выучим новое стихотворение”, чтобы начать учить новое стихотворение.`));
alice.command(/новый|новое|другое|найти|поиск|искать/i, (ctx) => {
    const c = ctx;
    addSceneHistory(c.session, FIND_MENU_SCENE);
    c.enter(FIND_MENU_SCENE);
    const message = String((0, lodash_1.sample)(sceneMessages['FIND_MENU_SCENE']));
    return yandex_dialogs_sdk_1.Reply.text(message);
});
alice.command(/учить|продолжи/i, (ctx) => {
    const c = ctx;
    const learnData = getOldLearnData(c.session);
    if (!learnData) {
        addSceneHistory(c.session, FIND_MENU_SCENE);
        c.enter(FIND_MENU_SCENE);
        return yandex_dialogs_sdk_1.Reply.text('У вас нет начатых стихов. Назовите автора или название, чтобы начать поиск');
    }
    addSceneHistory(c.session, LEARN_SCENE);
    c.enter(LEARN_SCENE);
    const { poem } = learnData;
    const text = `Продолжаем учить стих ${poem.author} - ${poem.title}`;
    const tts = `${text}
Скажите "Дальше", чтобы начать учит новую строку.
Скажить "Повторить стих", чтобы повторить весь стих.
Скажите "Повторить блок", чтобы повторить последний блок.`;
    return yandex_dialogs_sdk_1.Reply.text({ text, tts });
    // return Reply.text('Я это еще не юмею');
});
alice.command(/запомни|запиши|запись|записать|запомнить/i, () => yandex_dialogs_sdk_1.Reply.text('К сожалению, я не умею записывать ваш голос. Перейдите на сайт', { buttons: [yandex_dialogs_sdk_1.Markup.button({ title: 'Перейти на сайт', hide: true, url: 'https://www.google.com' })] }));
alice.command(/расскажи|умеешь|не/i, () => yandex_dialogs_sdk_1.Reply.text(`Что ж, пора рассказать Вам обо мне.
  Я могу помочь найти стихотворение, достаточно сказать “Найти”.
  Я могу помочь выучить стихотворение, достаточно сказать “Учить”.
  Так же по команде “Запомни” я запишу Ваше чтение.`));
alice.command(...exitHandler);
alice.any(wrongHandler);
alice.registerScene(atLearn);
alice.registerScene(atFindMenu);
alice.registerScene(atSelectList);
alice.listen(port);
console.log(1);
