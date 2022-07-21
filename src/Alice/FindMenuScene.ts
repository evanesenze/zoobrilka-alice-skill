import { FIND_MENU_SCENE, SELECT_LIST_SCENE, addSceneHistory, backHandler, exitHandler, extractTitleAndAuthor, getAuthorName, helpHandler, saveSelectListData } from './extras';
import { Markup, Reply, Scene } from 'yandex-dialogs-sdk';
import { searchPoems } from '../Base';

const atFindMenu = new Scene(FIND_MENU_SCENE);
atFindMenu.command(/рейтинг/gi, () => Reply.text('Рейтинг стихов можешь посмотреть на сайте', { buttons: [Markup.button({ url: 'https://www.google.com', title: 'Перейти на сайт' })] }));

atFindMenu.command(...exitHandler);

atFindMenu.command(...backHandler);

atFindMenu.command(...helpHandler);

atFindMenu.any(async (ctx) => {
  const entities = ctx.nlu?.entities;
  const { title, author } = extractTitleAndAuthor(ctx.message, entities);
  const authorName = getAuthorName(author);
  const text = `Параметры поиска:
Автор: ${authorName ?? 'Не задан'}
Название: ${title}`;
  const items = await searchPoems(author, title);
  let tts = 'Ничего не смог найти. Попробуй сказать по-другому';
  const buttons = items.map(({ title, author }, i) => Markup.button(`${i + 1}). ${getAuthorName(author)} | ${title}`.substring(0, 128)));
  if (buttons.length) {
    tts = 'Вот что я нашел. Для выбора, скажи номер или название. Или скажи "Поиск", чтобы вернуться к поиску.';
    addSceneHistory(ctx.session, SELECT_LIST_SCENE);
    saveSelectListData(ctx.session, { items });
    ctx.enter(SELECT_LIST_SCENE);
  }
  return Reply.text({ text, tts }, { buttons });
});

export { atFindMenu };
