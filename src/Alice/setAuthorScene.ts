import { Reply, Scene } from 'yandex-dialogs-sdk';
import { SET_AUTHOR_SCENE, SET_TITLE_SCENE, addSceneHistory, backHandler, exitHandler, extractAuthor, getAuthorName, helpHandler, saveFindData } from './extras';

const atSetAuthor = new Scene(SET_AUTHOR_SCENE);

atSetAuthor.command(...exitHandler);

atSetAuthor.command(...backHandler);

atSetAuthor.command(...helpHandler);

atSetAuthor.command(/дальше/gi, (ctx) => {
  addSceneHistory(ctx.session, SET_TITLE_SCENE);
  ctx.enter(SET_TITLE_SCENE);
  return Reply.text('Автор задан. Теперь скажи название.');
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
  const authorName = getAuthorName(author);
  console.log(authorName);
  const text = `Автор: ${authorName || 'Не задан'}.`;
  const tts = text + 'Если я правильно тебя понял, скажи "Дальше", если нет - попробуй сказать по-другому.';
  saveFindData(ctx.session, { title: '', author, poems: [], items: [] });
  return Reply.text({ text, tts });
});

export { atSetAuthor };
