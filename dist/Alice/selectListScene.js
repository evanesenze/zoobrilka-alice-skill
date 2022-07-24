"use strict";
// import {
//   LEARN_SCENE,
//   SELECT_LIST_SCENE,
//   SET_AUTHOR_SCENE,
//   addSceneHistory,
//   backHandler,
//   confirmSelectPoem,
//   deleteFindData,
//   deleteSelectListData,
//   exitHandler,
//   getFindData,
//   getNewLearnData,
//   getPoemText,
//   getSelectListData,
//   helpHandler,
//   removeSceneHistory,
//   saveLearnData,
//   saveSelectListData,
//   sceneHints,
//   sceneMessages,
// } from './extras';
// import { Reply, Scene } from 'yandex-dialogs-sdk';
// import { sample } from 'lodash';
// const atSelectList = new Scene(SELECT_LIST_SCENE);
// atSelectList.command(/поиск/gi, (ctx) => {
//   deleteSelectListData(ctx.session);
//   deleteFindData(ctx.session);
//   const text = String(sample(sceneMessages[SET_AUTHOR_SCENE]));
//   removeSceneHistory(ctx.session);
//   ctx.enter(SET_AUTHOR_SCENE); // !!
//   return Reply.text(text);
// });
// atSelectList.command(/да|учим/gi, (ctx) => {
//   const selectListData = getSelectListData(ctx.session);
//   const { items, selectedPoem } = selectListData;
//   if (!selectedPoem) {
//     const text = items.reduce((res, item) => (res += `\n${item}`), 'Выбери стих из списка:');
//     return Reply.text({ text, tts: 'Сначала выбери стих' });
//   }
//   const learnData = getNewLearnData(selectedPoem, 'row');
//   if (!learnData) {
//     ctx.leave();
//     return Reply.text('Ошибка.Переход в меню'); // !!
//   }
//   const text = getPoemText(learnData);
//   saveLearnData(ctx.session, learnData);
//   addSceneHistory(ctx.session, LEARN_SCENE);
//   saveSelectListData(ctx.session, { items: selectListData.items });
//   ctx.enter(LEARN_SCENE);
//   return Reply.text('Повтори строку.\nСкажи "Дальше", чтобы продолжить учить\n\n' + text, { end_session: true });
// });
// atSelectList.command(/нет|другой/gi, (ctx) => {
//   const selectListData = getSelectListData(ctx.session);
//   const { items } = selectListData;
//   const text = items.reduce((res, item) => (res += `\n${item}`), 'Выбери стих из списка:');
//   saveSelectListData(ctx.session, { items });
//   return Reply.text(text);
// });
// atSelectList.command(...exitHandler);
// atSelectList.command(...backHandler);
// atSelectList.command(...helpHandler);
// atSelectList.any((ctx) => {
//   const entities = ctx.nlu?.entities;
//   const selectListData = getSelectListData(ctx.session);
//   const findData = getFindData(ctx.session);
//   if (entities?.length) {
//     const numbers = entities.filter((item) => item.type === 'YANDEX.NUMBER');
//     if (numbers.length) {
//       if (!findData) return Reply.text('error');
//       const { poems } = findData;
//       const itemNumbers = poems.map((_, i) => i + 1);
//       console.log(itemNumbers);
//       const currentNumber = numbers.find((item) => itemNumbers.includes(Number(item.value)))?.value;
//       console.log(currentNumber);
//       const selectedPoem = poems.find((_, i) => i + 1 === currentNumber);
//       if (selectedPoem) return confirmSelectPoem(ctx, selectedPoem, selectListData);
//     }
//   }
//   saveSelectListData(ctx.session, { items: selectListData.items });
//   const tts = String(sample(sceneHints['SELECT_LIST_SCENE']));
//   const text = selectListData.items.reduce((res, item) => (res += `\n${item}`), 'Выбери стих из списка:');
//   return Reply.text({ text, tts });
// });
// export { atSelectList };
