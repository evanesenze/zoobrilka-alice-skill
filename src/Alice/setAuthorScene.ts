import { Reply, Scene } from 'yandex-dialogs-sdk';
import { SET_AUTHOR_SCENE, SET_TITLE_SCENE, addSceneHistory, backHandler, exitHandler, extractAuthor, getAuthorName, getFindData, helpHandler, saveFindData } from './extras';

const atSetAuthor = new Scene(SET_AUTHOR_SCENE);

atSetAuthor.command(...exitHandler);

atSetAuthor.command(...backHandler);

atSetAuthor.command(...helpHandler);

atSetAuthor.command(/дальше|далее/gi, (ctx) => {
  const findData = getFindData(ctx.session);
  if (!findData?.author) return Reply.text('Автор не задан. Скажите "Пропустить", если не хотите указывать автора.');
  addSceneHistory(ctx.session, SET_TITLE_SCENE);
  ctx.enter(SET_TITLE_SCENE);
  return Reply.text(`Автор ${getAuthorName(findData.author)} задан. Теперь скажи название.`);
});

atSetAuthor.command(/пропустить/gi, (ctx) => {
  addSceneHistory(ctx.session, SET_TITLE_SCENE);
  saveFindData(ctx.session, { author: { firstName: '', lastName: '' }, title: '', poems: [], items: [] });
  ctx.enter(SET_TITLE_SCENE);
  return Reply.text('Скажи название.');
});

atSetAuthor.any(async (ctx) => {
  const entities = ctx.nlu?.entities;
  const author = extractAuthor(entities);
  const text = `Автор: ${author ? getAuthorName(author) : 'Не задан'}.`;
  const tts = text + 'Если я правильно тебя понял, скажи "Дальше", если нет - попробуй сказать по-другому.';
  saveFindData(ctx.session, { title: '', author, poems: [], items: [] });
  return Reply.text({ text: text + "Скажи 'Дальше' или 'Пропустить', чтобы продолжить.", tts });
});

export { atSetAuthor };
