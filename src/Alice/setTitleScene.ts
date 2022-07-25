import { POEM_SCENE, SET_TITLE_SCENE, addSceneHistory, backHandler, exitHandler, exitWithError, getAuthorName, getFindData, getNewLearnData, getPoemText, helpHandler, saveFindData } from './extras';
import { Reply, Scene } from 'yandex-dialogs-sdk';
import { searchPoems } from '../Base';

const atSetTitle = new Scene(SET_TITLE_SCENE);

atSetTitle.command(...exitHandler);

atSetTitle.command(...backHandler);

atSetTitle.command(...helpHandler);

atSetTitle.any(async (ctx) => {
  const entities = ctx.nlu?.entities;
  const findData = getFindData(ctx.session);
  if (!findData) return exitWithError(ctx, 'findData not found');
  if (entities?.length && findData.items.length) {
    const numbers = entities.filter((item) => item.type === 'YANDEX.NUMBER');
    if (numbers.length) {
      if (!findData) return Reply.text('error');
      const { poems } = findData;
      const itemNumbers = poems.map((_, i) => i + 1);
      const currentNumber = numbers.find((item) => itemNumbers.includes(Number(item.value)))?.value;
      const selectedPoemId = poems.findIndex((_, i) => i + 1 === currentNumber);
      if (selectedPoemId !== -1) {
        const poem = poems[selectedPoemId];
        const newLearnData = getNewLearnData(poem, 'full', -1, -1);
        if (!newLearnData) {
          ctx.leave();
          return Reply.text('Вышли назад');
        }
        saveFindData(ctx.session, { ...findData, selectedPoemId });
        const poemText = getPoemText(newLearnData);
        const text = `Ты выбрал ${getAuthorName(poem.author)} - ${poem.title}.\n\n`;
        addSceneHistory(ctx.session, POEM_SCENE);
        ctx.enter(POEM_SCENE);
        return Reply.text({ text: text + poemText, tts: text + 'Скажи "Прочитай", чтобы я его озвучил.\nСкажи "Учить", чтобы начать учить.\nСкажи "Поиск", чтобы начать поиск заново.' });
      }
    }
  }
  const poems = await searchPoems(findData?.author ?? undefined, ctx.message);
  let text = `Автор: ${findData?.author ? getAuthorName(findData.author) : 'Не задан'}.
Название: ${ctx.message}.`;
  if (poems.length) {
    const items = poems.map(({ title, author }, i) => `${i + 1}). ${getAuthorName(author, true)} - ${title}.`.substring(0, 128));
    const itemsText = items.reduce((res, item) => (res += `\n${item}`), '\nВот что я нашел:');
    text += itemsText + '\nДля выбора назови номер стиха.';
    saveFindData(ctx.session, { ...findData, title: ctx.message, poems, items });
    return Reply.text(text);
  } else {
    text += '\nНичего не смог найти. Скажи название по-другому';
    return Reply.text({ text });
  }
});

export { atSetTitle };
