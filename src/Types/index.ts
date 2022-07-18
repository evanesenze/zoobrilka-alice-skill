type PoemTextType = 'full' | 'block' | 'row';

type SceneType = 'LEARN_SCENE' | 'FIND_MENU_SCENE' | 'SELECT_LIST_SCENE';

type FindProperty = 'title' | 'first_line' | 'author';

interface IPoem {
  author: string;
  title: string;
  first_line: string;
  text: string;
  tags: string[];
  id: number;
}

interface ILearnData {
  poem: IPoem;
  textType: PoemTextType;
  blocksData: string[][];
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

interface ISelectListData {
  key: FindProperty;
  query: string;
  offset: number;
  items: IPoem[];
}
