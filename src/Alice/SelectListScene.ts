import {
  FIND_MENU_SCENE,
  LEARN_SCENE,
  SELECT_LIST_SCENE,
  addSceneHistory,
  backHandler,
  confirmSelectPoem,
  deleteSelectListData,
  exitHandler,
  extractTitleAndAuthor,
  getAuthorName,
  getNewLearnData,
  getPoemText,
  getSelectListData,
  helpHandler,
  saveLearnData,
  saveSelectListData,
  sceneHints,
  sceneMessages,
} from './extras';
import { Markup, Reply, Scene } from 'yandex-dialogs-sdk';
import { comparePoem } from '../Base';
import { sample } from 'lodash';

const atSelectList = new Scene(SELECT_LIST_SCENE);

atSelectList.command(/поиск/gi, (ctx) => {
  deleteSelectListData(ctx.session);
  const text = String(sample(sceneMessages['FIND_MENU_SCENE']));
  ctx.enter(FIND_MENU_SCENE); // !!
  return Reply.text(text);
});

atSelectList.command(/да|учим/gi, (ctx) => {
  const selectListData = getSelectListData(ctx.session);
  const { items, selectedPoem } = selectListData;
  if (!selectedPoem) {
    const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${getAuthorName(author)} | ${title}`.substring(0, 128)));
    return Reply.text({ text: 'Выбери стих из списка', tts: 'Сначала выбери стих' }, { buttons });
  }
  const learnData = getNewLearnData(selectedPoem, 'row');
  if (!learnData) {
    ctx.leave();
    return Reply.text('Ошибка.Переход в меню'); // !!
  }
  const text = getPoemText(learnData);
  saveLearnData(ctx.session, learnData);
  addSceneHistory(ctx.session, LEARN_SCENE);
  deleteSelectListData(ctx.session);
  ctx.enter(LEARN_SCENE);
  return Reply.text('Повтори строку:\n\n' + text);
});

atSelectList.command(/нет|другой/gi, (ctx) => {
  const selectListData = getSelectListData(ctx.session);
  const { items } = selectListData;
  const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${getAuthorName(author)} | ${title}`.substring(0, 128)));
  saveSelectListData(ctx.session, { items });
  return Reply.text('Выбери стих из списка', { buttons });
});

atSelectList.command(...exitHandler);

atSelectList.command(...backHandler);

atSelectList.command(...helpHandler);

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
      if (selectedPoem) return confirmSelectPoem(ctx, selectedPoem, selectListData);
    }
  }
  const { title, author } = extractTitleAndAuthor(ctx.message, entities);
  const bestMatch = [...selectListData.items].sort((a, b) => comparePoem(a, b, title, author))[0];
  if (bestMatch) return confirmSelectPoem(ctx, bestMatch, selectListData);
  const tts = String(sample(sceneHints['SELECT_LIST_SCENE']));
  const buttons = selectListData.items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${getAuthorName(author)} | ${title}`.substring(0, 128)));
  return Reply.text({ text: 'Выберите стих из списка:', tts }, { buttons });
});

export { atSelectList };
