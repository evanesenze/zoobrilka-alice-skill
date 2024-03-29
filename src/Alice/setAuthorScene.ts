import { Reply, Scene } from 'yandex-dialogs-sdk';
import { SET_AUTHOR_SCENE, SET_TITLE_SCENE, addSceneHistory, backHandler, exitHandler, extractAuthor, getAuthorName, getFindData, helpHandler, saveFindData } from './extras';

const atSetAuthor = new Scene(SET_AUTHOR_SCENE);

const nextCommand = /дальше|далее|потом|следующее|вперед|перейти.*к.*следующему|следующий|дальнейший/;
const skipCommand = /пропусти|пропуск|опустить/;

atSetAuthor.command(nextCommand, (ctx) => {
  const findData = getFindData(ctx.session);
  if (!findData?.author) return Reply.text('Автор не задан.\nСкажите "Пропустить", если не хотите указывать автора.');
  addSceneHistory(ctx.session, SET_TITLE_SCENE);
  ctx.enter(SET_TITLE_SCENE);
  return Reply.text(`Автор ${getAuthorName(findData.author)} задан.\nТеперь скажи название.`);
});

atSetAuthor.command(skipCommand, (ctx) => {
  addSceneHistory(ctx.session, SET_TITLE_SCENE);
  saveFindData(ctx.session, { author: null, title: '', poems: [], items: [] });
  ctx.enter(SET_TITLE_SCENE);
  return Reply.text('Скажи название.');
});

atSetAuthor.command(...exitHandler);

atSetAuthor.command(...backHandler);

atSetAuthor.command(...helpHandler);

atSetAuthor.any(async (ctx) => {
  const entities = ctx.nlu?.entities;
  const author = extractAuthor(entities);
  const text = `Автор: ${author ? getAuthorName(author) : 'Не задан'}.`;
  const tts = text + 'Если я правильно тебя понял, скажи "Дальше", если нет - попробуй сказать по-другому.';
  saveFindData(ctx.session, { title: '', author, poems: [], items: [] });
  return Reply.text({ text: text + "\nСкажи 'Дальше' или 'Пропустить', чтобы продолжить.", tts });
});

export { atSetAuthor };
