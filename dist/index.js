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
const yandex_dialogs_sdk_1 = require("yandex-dialogs-sdk");
const lodash_1 = require("lodash");
const Base_1 = require("./Base");
const port = Number(process.env.PORT) || 3000;
const ROWS_COUNT = 2;
const alice = new yandex_dialogs_sdk_1.Alice();
const exitHandler = [
    ['Выйти', 'Хватит', 'Стоп', 'Я устал'],
    (ctx) => {
        ctx.leave();
        return yandex_dialogs_sdk_1.Reply.text('Хорошо, будет скучно - обращайтесь.', { end_session: true });
    },
];
const backHandler = [
    ['Назад', 'Вернись'],
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
    FIND_MENU_SCENE: ['Скажите "Искать по названию", чтобы я нашла стих по названию.\n Скажите "Искать по автору", чтобы я нашла стих по автору.'],
    SELECT_LIST_SCENE: ['Для перемещения скажите "Далее/Назад"\nДля перехода к поиску, скажите "Поиск"'],
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
    session.set('sceneHistory', arr);
};
const getOldLearnData = (session) => session.get('learnData');
const getNewLearnData = (poem, textType, currentBlockIndex = 0, currentRowIndex = 0) => {
    const blocksData = poem.text.split('\n\n').map((item) => item.split('\n'));
    if (currentBlockIndex > blocksData.length - 1)
        return null;
    const rows = blocksData[currentBlockIndex];
    const blocksCount = blocksData.length - 1;
    const rowsCount = Math.ceil(rows.length / ROWS_COUNT);
    return {
        poem,
        blocksData,
        textType,
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
const saveLearnData = (session, data) => session.set('learnData', data); // !
const getPoemText = (learnData) => {
    const { currentBlock, currentRow, textType, blocksData } = learnData;
    const oldBlocksText = blocksData.slice(0, currentBlock.index).reduce((res, item) => res + item.join('\n') + '\n\n', '');
    const oldRowsText = blocksData[currentBlock.index].slice(0, currentRow.index * ROWS_COUNT).join('\n');
    const currentRowText = blocksData[currentBlock.index].slice(currentRow.index * ROWS_COUNT, currentRow.index * ROWS_COUNT + ROWS_COUNT).join('\n');
    switch (textType) {
        case 'full':
            if (!oldRowsText)
                return oldBlocksText + currentRowText;
            return oldBlocksText + oldRowsText + '\n' + currentRowText;
        case 'block':
            if (!oldRowsText)
                return currentRowText;
            return oldRowsText + '\n' + currentRowText;
        case 'row':
            return currentRowText;
        default:
            return currentRowText;
    }
};
const compareText = (text1, text2) => {
    return Math.random() > 0.1;
};
const deleteSelectData = (session) => session.delete('selectListData');
const getSelectListData = (session) => session.get('selectListData');
const saveSelectListData = (session, newData) => session.set('selectListData', newData); // !
const atLearn = new yandex_dialogs_sdk_1.Scene(LEARN_SCENE);
atLearn.any((ctx) => {
    const learnData = getOldLearnData(ctx.session);
    const text = getPoemText(learnData);
    if (compareText(text, ctx.message)) {
        const { currentBlock, currentRow, poem } = learnData;
        if (currentRow.isLast && currentBlock.learnedRows.includes(currentRow.index)) {
            if (currentBlock.isLast) {
                console.log('currentBlock is last');
                return yandex_dialogs_sdk_1.Reply.text(getPoemText(Object.assign(Object.assign({}, learnData), { textType: 'full' })));
            }
            console.log('currentRow is last');
            if (currentBlock.rowsCount > 1 && currentBlock.index != 0 && !currentBlock.complited) {
                console.log('currentBlock is not complited');
                currentBlock.complited = true;
                const nextLearnData = Object.assign(Object.assign({}, learnData), { currentBlock, textType: 'full' });
                saveLearnData(ctx.session, nextLearnData);
                return yandex_dialogs_sdk_1.Reply.text(getPoemText(nextLearnData));
            }
            else {
                console.log('currentBlock is complited');
                const nextLearnData = getNewLearnData(poem, 'block', currentBlock.index + 1, 0);
                if (!nextLearnData) {
                    ctx.leave();
                    return yandex_dialogs_sdk_1.Reply.text('Переход в меню');
                }
                saveLearnData(ctx.session, nextLearnData);
                return yandex_dialogs_sdk_1.Reply.text(getPoemText(nextLearnData));
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
                return yandex_dialogs_sdk_1.Reply.text(getPoemText(nextLearnData));
            }
            else {
                currentBlock.learnedRows.push(currentRow.index);
                console.log('repeat block');
                const nextLearnData = Object.assign(Object.assign({}, learnData), { currentBlock, textType: 'block' });
                saveLearnData(ctx.session, nextLearnData);
                return yandex_dialogs_sdk_1.Reply.text(getPoemText(nextLearnData));
            }
        }
    }
    else {
        return yandex_dialogs_sdk_1.Reply.text(`Вы допустили ошибку. Повторите еще раз\n\n${text}`);
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
    var _a;
    const entities = (_a = ctx.nlu) === null || _a === void 0 ? void 0 : _a.entities;
    // if (!entities?.length) return wrongHandler(ctx);
    console.log(entities);
    let author = 'Не задан';
    let title = ctx.message;
    const names = entities === null || entities === void 0 ? void 0 : entities.filter((item) => item.type === 'YANDEX.FIO').map((item) => item).filter((item) => !!item.value.first_name && !!item.value.last_name);
    if (names === null || names === void 0 ? void 0 : names.length) {
        const namesCount = names.length - 1;
        const name = names[namesCount];
        author = (names === null || names === void 0 ? void 0 : names.length) ? `${name.value.first_name} ${name.value.last_name}` : 'Не задан';
        const words = title.split(' ');
        words.splice(name.tokens.start, name.tokens.end - name.tokens.start);
        title = words.join(' ');
    }
    const text = `Параметры поиска: 
Автор: ${author}
Название: ${title}`;
    const res = yield (0, Base_1.searchPoems)(author, title);
    return yandex_dialogs_sdk_1.Reply.text(text, { buttons: res.map(({ author, title }) => yandex_dialogs_sdk_1.Markup.button(`${author} | ${title}`.substring(0, 128))) });
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
atSelectList.command('Далее', (ctx) => {
    const selectListData = getSelectListData(ctx.session);
    console.log(selectListData);
    if (!selectListData)
        return yandex_dialogs_sdk_1.Reply.text('error');
    const { offset, key, query } = selectListData;
    const newOffset = offset + 5;
    return yandex_dialogs_sdk_1.Reply.text('1');
    //   const res = findPoemsBy(key, query, newOffset);
    //   console.log(res);
    //   const newItems = Object.values(res).sort((a, b) => levenshtein(a[key], query) - levenshtein(b[key], query));
    //   const buttons = newItems.map(({ title, author }, i) => Markup.button(`${newOffset + i + 1}). ${author} - ${title}`));
    //   const text = String(sample(sceneMessages['SELECT_LIST_SCENE']));
    //   saveSelectListData(ctx.session, { ...selectListData, items: newItems, offset: newOffset });
    //   return Reply.text(text, { buttons });
});
atSelectList.command('Назад', (ctx) => {
    const selectListData = getSelectListData(ctx.session);
    console.log(selectListData);
    if (!selectListData)
        return yandex_dialogs_sdk_1.Reply.text('error');
    const { items, offset, key, query } = selectListData;
    if (offset === 0) {
        const buttons = items.map(({ title, author }, i) => yandex_dialogs_sdk_1.Markup.button(`${offset + i + 1}). ${author} - ${title}`));
        return yandex_dialogs_sdk_1.Reply.text('Вы не можете сделать шаг назад - это первый лист', { buttons });
    }
    const newOffset = offset - 5;
    return yandex_dialogs_sdk_1.Reply.text('1');
    //   const res = findPoemsBy(key, query, newOffset);
    //   console.log(res);
    //   const newItems = Object.values(res).sort((a, b) => levenshtein(a[key], query) - levenshtein(b[key], query));
    //   const buttons = newItems.map(({ title, author }, i) => Markup.button(`${newOffset + i + 1}). ${author} - ${title}`));
    //   const text = String(sample(sceneMessages['SELECT_LIST_SCENE']));
    //   saveSelectListData(ctx.session, { ...selectListData, items: newItems, offset: newOffset });
    //   return Reply.text(text, { buttons });
});
atSelectList.command('Поиск', (ctx) => {
    deleteSelectData(ctx.session);
    const text = String((0, lodash_1.sample)(sceneMessages['FIND_MENU_SCENE']));
    ctx.enter(FIND_MENU_SCENE);
    return yandex_dialogs_sdk_1.Reply.text(text);
});
atSelectList.any((ctx) => {
    var _a, _b;
    const entities = (_a = ctx.nlu) === null || _a === void 0 ? void 0 : _a.entities;
    if (entities === null || entities === void 0 ? void 0 : entities.length) {
        const numbers = entities.filter((item) => item.type === 'YANDEX.NUMBER');
        if (numbers.length) {
            const selectListData = getSelectListData(ctx.session);
            console.log(selectListData);
            if (!selectListData)
                return yandex_dialogs_sdk_1.Reply.text('error');
            const { items, offset } = selectListData;
            const itemNumbers = items.map((_, i) => i + offset + 1);
            console.log(itemNumbers);
            const currentNumber = (_b = numbers.find((item) => itemNumbers.includes(Number(item.value)))) === null || _b === void 0 ? void 0 : _b.value;
            console.log(currentNumber);
            const selectedPoem = items.find((_, i) => i + offset + 1 === currentNumber);
            if (selectedPoem) {
                ctx.enter(LEARN_SCENE);
                const learnData = getNewLearnData(selectedPoem, 'row');
                if (!learnData) {
                    ctx.leave();
                    return yandex_dialogs_sdk_1.Reply.text('Переход в меню');
                }
                const text = getPoemText(learnData);
                saveLearnData(ctx.session, learnData);
                return yandex_dialogs_sdk_1.Reply.text(`Ты выбрал ${selectedPoem.author} - ${selectedPoem.title}\n\n${text}`.substring(0, 128));
            }
        }
    }
    return yandex_dialogs_sdk_1.Reply.text(ctx.message);
});
alice.command('', () => {
    return yandex_dialogs_sdk_1.Reply.text(`Добро пожаловать в “Навык изучениия стихов”.
${(0, lodash_1.sample)(['Здесь вы можете выучить стихотворение.', 'Я помогу вам выучить стихотворение.'])}
Вы уже знакомы с тем, что я умею?`);
});
alice.command(/да|знаком/i, () => yandex_dialogs_sdk_1.Reply.text(`Итак, что будем учить сегодня?
Скажите “давай продолжим учить”, чтобы продолжить учить стихотворение.
Скажите “давай выучим новое стихотворение”, чтобы начать учить новое стихотворение.`));
alice.command(/новый|новое|другое|найти|поиск/i, (ctx) => {
    const c = ctx;
    addSceneHistory(c.session, FIND_MENU_SCENE);
    c.enter(FIND_MENU_SCENE);
    const message = String((0, lodash_1.sample)(sceneMessages['FIND_MENU_SCENE']));
    return yandex_dialogs_sdk_1.Reply.text(message);
});
alice.command(/учить|продолжи/i, (ctx) => {
    //   const c = ctx as IStageContext;
    //   addSceneHistory(c.session, LEARN_SCENE);
    //   c.enter(LEARN_SCENE);
    //   const message = String(sample(sceneMessages['LEARN_SCENE']));
    return yandex_dialogs_sdk_1.Reply.text('Я это еще не юмею');
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
