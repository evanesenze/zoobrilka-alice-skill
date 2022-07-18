// import 'dotenv/config';
import admin, { ServiceAccount } from 'firebase-admin';
import { levenshtein } from 'string-comparison';
import serviceAccount from './serviceAccount.json';

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  databaseURL: 'https://zoobrilka-app-default-rtdb.europe-west1.firebasedatabase.app',
  // databaseURL: process.env.DATABASE_URL,
});

const base = app.database();

const poemsRef = base.ref('poems');

const getPoemSnapshot = async (id: string) => await poemsRef.child(id).once('value');

const getPoem = async (id: string) => {
  const res = await getPoemSnapshot(id);
  const data = res.toJSON();
  if (data) return data as IPoem;
  return null;
};

const poemIsExists = async (id: string) => (await getPoemSnapshot(id)).exists();

const savePoem = async (poem: IPoem) => {
  poemsRef.child(String(poem.id)).update(poem);
};

const searchPoems = async (author?: string, title?: string, tagName?: string) => {
  console.time('searchPoems');
  const arr: Promise<any>[] = [];
  if (author)
    arr.push(
      poemsRef
        .orderByChild('author')
        .startAt(author)
        .endAt(author + '\uf8ff')
        .limitToFirst(5)
        .once('value')
    );
  if (title)
    arr.push(
      poemsRef
        .orderByChild('title')
        .startAt(title)
        .endAt(title + '\uf8ff')
        .limitToFirst(5)
        .once('value')
    );
  let res = (await Promise.all(arr).then((values) => values.map((value) => Object.values(value.val() ?? {}) as IPoem[]))).reduce(
    (acc, value) => [...acc, ...value.filter((value) => acc.filter((x) => x.author === value.author && x.title === value.title).length === 0)],
    []
  );
  if (title) res = res.sort((a, b) => levenshtein.similarity(b.title, title) - levenshtein.similarity(a.title, title));
  if (author) res = res.sort((a, b) => levenshtein.similarity(b.author, author) - levenshtein.similarity(a.author, author));
  console.timeEnd('searchPoems');
  console.log(res.slice(0, 5).map((x) => `${x.author} - ${x.title}`));
  return res;
};

export { getPoem, poemIsExists, savePoem, searchPoems };
