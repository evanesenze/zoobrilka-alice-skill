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
const logsRef = base.ref('logs');

let todayPoemId = '0';

const saveLog = async (id: string, log: unknown) => logsRef.child(id).push(log);

const cleanLog = async (id: string) => logsRef.child(id).remove();

const getPoemSnapshot = async (id: string) => await poemsRef.child(id).once('value');

const getPoem = async (id: string) => {
  const res = await getPoemSnapshot(id);
  const data = res.toJSON();
  if (data) return data as IPoem;
  return null;
};

const getTodayPoem = async () => {
  console.log(todayPoemId);
  return getPoem(todayPoemId);
};

const poemIsExists = async (id: string) => (await getPoemSnapshot(id)).exists();

const savePoem = async (poem: IPoem) => {
  poemsRef.child(String(poem.id)).update(poem);
};

const comparePoem = (a: IPoem, b: IPoem, title: string, author?: IAuthor): number => {
  const poem1 = levenshtein.similarity(a.title, title) + levenshtein.similarity(a.author.firstName, author?.firstName ?? '') + levenshtein.similarity(a.author.lastName, author?.lastName ?? '');
  const poem2 = levenshtein.similarity(b.title, title) + levenshtein.similarity(b.author.firstName, author?.firstName ?? '') + levenshtein.similarity(a.author.lastName, author?.lastName ?? '');
  return poem2 - poem1;
};

const searchPoems = async (author?: IAuthor, title?: string) => {
  console.time('searchPoems');
  console.log(author);
  console.log(title);
  const arr: Promise<any>[] = [];
  if (author?.firstName)
    arr.push(
      poemsRef
        .orderByChild('author/firstName')
        .startAt(author.firstName)
        .endAt(author.firstName + '\uf8ff')
        .limitToFirst(5)
        .once('value')
    );
  if (author?.lastName)
    arr.push(
      poemsRef
        .orderByChild('author/lastName')
        .startAt(author.lastName)
        .endAt(author.lastName + '\uf8ff')
        .limitToFirst(5)
        .once('value')
    );
  if (title)
    arr.push(
      poemsRef
        .orderByChild('queryTitle')
        .startAt(title)
        .endAt(title + '\uf8ff')
        .limitToFirst(5)
        .once('value')
    );
  let res = (await Promise.all(arr).then((values) => values.map((value) => Object.values(value.val() ?? {}) as IPoem[]))).reduce(
    (acc, value) => [
      ...acc,
      ...value.filter((value) => acc.filter((x) => x.author.firstName === value.author.firstName && x.author.lastName === value.author.lastName && x.title === value.title).length === 0),
    ],
    []
  );
  res = res.sort((a, b) => comparePoem(a, b, title ?? '', author)).slice(0, 5);
  console.timeEnd('searchPoems');
  console.log(res.map((x) => `${x.author} - ${x.title}`));
  return res;
};

(async () => {
  do {
    todayPoemId = String(Math.ceil(Math.random() * 49000));
    console.log('try ', todayPoemId);
  } while (!(await poemIsExists(todayPoemId)));
  console.log(todayPoemId);
})();
// const test = async () => {
//   for (let i = 1; i < 48823; i++) {
//     const poem = await getPoem(String(i));
//     if (!poem) {
//       console.log(`${i}.) not found`);
//       continue;
//     }
//     const authorName = poem.author.split(' ');
//     const author = {
//       firstName: authorName[0],
//       lastName: authorName[1],
//     };
//     savePoem({ ...poem, author });
//     console.log(`${i}.) done`);
//   }
// };

export { getPoem, poemIsExists, savePoem, searchPoems, comparePoem, logsRef, saveLog, cleanLog, getTodayPoem };
