import {
  GAMES_MENU_SCENE,
  GAME_1_SCENE,
  GAME_2_SCENE,
  addSceneHistory,
  backHandler,
  exitHandler,
  exitWithError,
  getGamesData,
  getNewGame1Data,
  getNewGame2Data,
  helpHandler,
  saveGame1Data,
  saveGame2Data,
  saveGamesData,
  sceneMessages,
} from './extras';
import { Reply, Scene } from 'yandex-dialogs-sdk';
import { sample } from 'lodash';

const games = [GAME_1_SCENE, GAME_2_SCENE];

const atGameMenu = new Scene(GAMES_MENU_SCENE);

atGameMenu.command(...exitHandler);

atGameMenu.command(...backHandler);

atGameMenu.command(...helpHandler);

atGameMenu.command(/начать/, (ctx) => {
  const gamesData = getGamesData(ctx.session);
  if (!gamesData) return exitWithError(ctx, 'gamesData not found');
  if (gamesData.selectedGameId === undefined) return Reply.text('Сначала выбери игру.');
  const { selectedGameId } = gamesData;
  if (selectedGameId === 1) {
    ctx.enter(GAME_1_SCENE);
    addSceneHistory(ctx.session, GAME_1_SCENE);
    const game1Data = getNewGame1Data(gamesData);
    if (!game1Data) return Reply.text('Данный стих не подходит для этой игры. Выберите другую.');
    saveGame1Data(ctx.session, game1Data);
    const text = `Вот первая строка блока:
    
${game1Data.currentPairedRow[0]}`;
    return Reply.text({ text, tts: text + 'sil <[5000]> Скажи вторую строку.' });
  } else if (selectedGameId === 2) {
    ctx.enter(GAME_2_SCENE);
    addSceneHistory(ctx.session, GAME_2_SCENE);
    const game2Data = getNewGame2Data(gamesData);
    if (!game2Data) return Reply.text('Данный стих не подходит для этой игры. Выберите другую.');
    saveGame2Data(ctx.session, game2Data);
    const text = `Вот текст блока, с закрытыми словами:
    
${game2Data.currentItem.replacedText}`;
    return Reply.text({ text, tts: text + 'sil <[5000]> Скажи полный текст.' });
  } else {
    saveGamesData(ctx.session, { ...gamesData, selectedGameId: undefined });
    return Reply.text('Выбранная игра недоступна. Выбери другую');
  }
});

atGameMenu.any((ctx) => {
  const entities = ctx.nlu?.entities;
  const gamesData = getGamesData(ctx.session);
  if (!gamesData) return exitWithError(ctx, 'gamesData not found');
  if (entities?.length) {
    const numbers = entities.filter((item) => item.type === 'YANDEX.NUMBER' && item.value > 0 && item.value <= games.length);
    if (numbers.length) {
      const number = numbers[0].value as number;
      console.log(number);
      saveGamesData(ctx.session, { ...gamesData, selectedGameId: number });
      if (number === 1) {
        const text = String(sample(sceneMessages['GAME_1_SCENE']));
        return Reply.text(text);
      } else if (number === 2) {
        const text = String(sample(sceneMessages['GAME_2_SCENE']));
        return Reply.text(text);
      }
    }
  }
  const text = String(sample(sceneMessages['GAMES_MENU_SCENE']));
  return Reply.text(text);
});

export { atGameMenu };
