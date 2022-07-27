type PoemTextType = 'full' | 'block' | 'row';

type SceneType = 'LEARN_SCENE' | 'SET_AUTHOR_SCENE' | 'SET_TITLE_SCENE' | 'POEM_SCENE' | 'MENU' | 'GAMES_MENU_SCENE' | 'GAME_1_SCENE';

type IPoemRecordVotes = Record<string, number>;

interface IAuthor {
  firstName: string;
  lastName: string;
}

interface IPoem {
  author: IAuthor;
  title: string;
  first_line: string;
  text: string;
  tags: Record<string, boolean>;
  id: number;
}

interface IPoemRecord {
  id: string;
  url: string;
  ownerName: string;
  owner: string;
  poemName: string;
  poem: string;
  rating: number;
  votes?: IPoemRecordVotes;
}

interface IUser {
  id: string;
  login: string;
  displayName: string;
  firstName: string;
  lastName: string;
  realName: string;
  sex: string;
  birthday: string;
  records?: Record<string, string>;
  rating?: number;
}

interface ILearnData {
  poem: IPoem;
  poemСomplited: boolean;
  textType: PoemTextType;
  blocksData: string[][];
  errorCount: number;
  blocksCount: number;
  currentBlock: IBlockInfo;
  currentRow: IRowInfo;
}

interface IBlockInfo {
  index: number;
  isLast: boolean;
  rowsCount: number;
  learnedRows: number[];
  complited: boolean;
}

interface IRowInfo {
  index: number;
  isLast: boolean;
}

interface IAuthorInfo {
  name: string;
  poemsCount: number;
}

interface IGamesData {
  selectedPoem: IPoem;
  rows: string[];
  selectedGameId?: number;
}

interface IGame1Data {
  userScore: number;
  startPairedRowsCount: number;
  currentPairedRow: string[];
  pairedRows: string[][];
}

interface IFindData {
  author: IAuthor | null;
  title: string;
  poems: IPoem[];
  items: string[];
  selectedPoemId?: number;
}

interface IOauthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
}

interface IOauthUserInfoResponse {
  id: string;
  login: string;
  display_name: string;
  first_name: string;
  last_name: string;
  real_name: string;
  sex: string;
  birthday: string;
  client_id: string;
  is_avatar_empty: boolean;
}

type IResponse<T> = Promise<{ error?: string; response?: T }>;
