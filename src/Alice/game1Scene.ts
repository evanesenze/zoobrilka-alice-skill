import { GAMES_MENU_SCENE, GAME_1_SCENE, backHandler, deleteGame1Data, exitHandler, exitWithError, getGame1Data, helpHandler, removeSceneHistory, saveGame1Data, sceneMessages } from './extras';
import { Reply, Scene } from 'yandex-dialogs-sdk';
import { levenshtein } from 'string-comparison';

const atGame1 = new Scene(GAME_1_SCENE);

atGame1.command(...exitHandler);

atGame1.command(...backHandler);

atGame1.command(...helpHandler);

atGame1.any((ctx) => {
  const gameData = getGame1Data(ctx.session);
  if (!gameData) return exitWithError(ctx, 'gameData not found');
  const [_, hideRow] = gameData.currentPairedRow;
  const rate = levenshtein.similarity(ctx.message, hideRow);
  let userScore = gameData.userScore;
  if (rate > 0.6) userScore += 1;
  console.log(gameData.pairedRows);
  if (gameData.pairedRows.length < 1) {
    deleteGame1Data(ctx.session);
    removeSceneHistory(ctx.session);
    ctx.enter(GAMES_MENU_SCENE);
    return Reply.text(`Игра закончена. Ты знаешь стих на ${((gameData.userScore / gameData.startPairedRowsCount) * 100).toFixed(1)}%.

Для начала новой игры, назови ее номер:
1.)Игра 1.
2.)Игра 2.`);
  }
  const currentPairedRow = gameData.pairedRows.pop()!;
  const text = `Твой текст совпал с оригиналом на ${(rate * 100).toFixed(1)}%.
Текущий счет: ${userScore}.

Вот первая строка следующего блока:
${currentPairedRow[0]}`;
  saveGame1Data(ctx.session, { ...gameData, currentPairedRow, userScore });
  return Reply.text({ text, tts: text + 'sil <[5000]> Скажи вторую строку.' });
});

export { atGame1 };
