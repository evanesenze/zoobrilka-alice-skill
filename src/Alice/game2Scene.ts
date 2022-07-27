import { GAMES_MENU_SCENE, GAME_2_SCENE, backHandler, deleteGame2Data, exitHandler, exitWithError, getGame2Data, helpHandler, removeSceneHistory, saveGame2Data } from './extras';
import { Reply, Scene } from 'yandex-dialogs-sdk';
import { levenshtein } from 'string-comparison';

const atGame2 = new Scene(GAME_2_SCENE);

atGame2.command(...exitHandler);

atGame2.command(...backHandler);

atGame2.command(...helpHandler);

atGame2.any((ctx) => {
  const gameData = getGame2Data(ctx.session);
  if (!gameData) return exitWithError(ctx, 'gameData not found');
  const rate = levenshtein.similarity(ctx.message, gameData.currentItem.originalText);
  let userScore = gameData.userScore;
  if (rate > 0.8) userScore += 1;
  console.log(gameData.items);
  if (gameData.items.length < 1) {
    deleteGame2Data(ctx.session);
    removeSceneHistory(ctx.session);
    ctx.enter(GAMES_MENU_SCENE);
    return Reply.text(`Игра закончена. Ты знаешь стих на ${((gameData.userScore / gameData.startItemsCount) * 100).toFixed(1)}%.

Для начала новой игры, назови ее номер:
1.)Игра 1.
2.)Игра 2.`);
  }
  const currentItem = gameData.items.pop()!;
  const text = `Твой текст совпал с оригиналом на ${(rate * 100).toFixed(1)}%.
Текущий счет: ${userScore}.

Вот строка следующего блока с закрытыми словами:
${currentItem.replacedText}`;
  saveGame2Data(ctx.session, { ...gameData, currentItem, userScore });
  return Reply.text({ text, tts: text + 'sil <[5000]> Скажи полный текст.' });
});

export { atGame2 };
