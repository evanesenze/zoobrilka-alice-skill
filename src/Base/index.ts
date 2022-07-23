// import 'dotenv/config';
import admin, { ServiceAccount } from 'firebase-admin';
import { UploadedFile } from 'express-fileupload';
import { levenshtein } from 'string-comparison';
import serviceAccount from './serviceAccount.json';
import { v4 } from 'uuid';

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  databaseURL: 'https://zoobrilka-app-default-rtdb.europe-west1.firebasedatabase.app',
  // databaseURL: process.env.DATABASE_URL,
});

const base = app.database();
const storage = app.storage().bucket('gs://zoobrilka-app.appspot.com');

const poemsRef = base.ref('poems');
const usersRef = base.ref('users');
const recordsRef = base.ref('records');
const logsRef = base.ref('logs');

// eslint-disable-next-line prefer-const
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

const getPoemRecord = async (recordId: string): Promise<IPoemRecord | null> => (await recordsRef.child(recordId).once('value')).toJSON() as IPoemRecord | null;

const updatePoemRecord = async (poemRecord: IPoemRecord) => await recordsRef.child(poemRecord.id).update(poemRecord);

const saveNewPoemRecord = async (userId: string, poemId: string, record: UploadedFile): Promise<IPoemRecord> => {
  const recordId = v4();
  const file = storage.file(`${poemId}/${recordId}.mp3`);
  await file.save(record.data);
  const url = (
    await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491',
    })
  )[0];
  const poemRecord: IPoemRecord = {
    id: recordId,
    url,
    owner: userId,
    poem: poemId,
    rating: 0,
  };
  updatePoemRecord(poemRecord);
  usersRef.child(`${userId}/records`).transaction((arr) => {
    arr ??= [];
    arr.push(recordId);
    return arr;
  });
  return poemRecord;
};

const getUser = async (userId: string): Promise<IUser | null> => (await usersRef.child(userId).once('value')).toJSON() as IUser | null;

const updateUser = async (user: IUser) => await usersRef.child(user.id).update(user);

const calculateUserRating = async (recordIds: string[]) => {
  const votes: number[] = [];
  for (let i = 0; i < recordIds.length; i++) {
    const poemRecord = await getPoemRecord(recordIds[i]);
    if (!poemRecord) continue;
    votes.push(poemRecord.rating);
  }
  console.log(votes);
  return Number((votes.reduce((sum, value) => sum + value, 0) / votes.length).toFixed(1));
};

const deletePoemRecord = async (userId: string, recordId: string): Promise<boolean> => {
  const recordRef = recordsRef.child(recordId);
  const poemRecord = (await recordRef.once('value')).toJSON() as IPoemRecord | null;
  if (!poemRecord || poemRecord.owner !== userId) return false;
  recordRef.remove();
  const user = await getUser(userId);
  if (user && user.records) {
    const arr = Object.values(user.records);
    user.records = arr.filter((id: string) => id !== recordId) as unknown as Record<string, string>;
    user.rating = await calculateUserRating(arr);
    updateUser(user);
  }
  return true;
};

const setPoemRecordScore = async (recordId: string, userId: string, vote: number): Promise<boolean> => {
  const poemRecord = await getPoemRecord(recordId);
  if (!poemRecord) return false;
  poemRecord.votes ??= {};
  poemRecord.votes[userId] = vote;
  const votes = Object.values(poemRecord.votes);
  poemRecord.rating = Number((votes.reduce((sum, value) => sum + value, 0) / votes.length).toFixed(1));
  await updatePoemRecord(poemRecord);
  const owner = await getUser(poemRecord.owner);
  if (owner && owner.records && Object.values(owner.records).includes(recordId)) {
    owner.rating = await calculateUserRating(Object.values(owner.records));
    updateUser(owner);
  }
  return true;
};

const getPoemRecords = async (poemId: string, offset: number): Promise<IPoemRecord[]> => {
  const poemRecords = (await recordsRef.orderByChild('poem').equalTo(poemId).once('value')).toJSON() as Record<string, IPoemRecord> | null;
  if (!poemRecords) return [];
  const arr = Object.values(poemRecords)
    .sort((a, b) => b.rating - a.rating)
    .slice(offset, offset + 10);
  return arr;
};

const getAllPoemRecords = async (offset: number): Promise<IPoemRecord[]> => {
  const poemRecords = (await recordsRef.once('value')).toJSON() as Record<string, IPoemRecord> | null;
  if (!poemRecords) return [];
  const arr = Object.values(poemRecords)
    .sort((a, b) => b.rating - a.rating)
    .slice(offset, offset + 10);
  return arr;
};

const getSortedRecords = async (records: string[], poemId?: string): Promise<IPoemRecord[]> => {
  const poemRecords: IPoemRecord[] = [];
  console.log(records);
  for (let i = 0; i < records.length; i++) {
    const recordId = records[i];
    const record = await getPoemRecord(recordId);
    if (!record || (poemId && record.poem !== poemId)) continue;
    poemRecords.push(record);
  }
  return poemRecords.sort((a, b) => b.rating - a.rating);
};

const getUserRecords = async (userId: string, poemId?: string): Promise<IPoemRecord[]> => {
  const user = await getUser(userId);
  if (!user || !user.records) return [];
  return getSortedRecords(Object.values(user.records), poemId);
};

const getAllUserRecords = async (offset: number, poemId?: string): Promise<{ userId: string; records: IPoemRecord[] }[]> => {
  const usersData = (await usersRef.once('value')).toJSON() as Record<string, IUser> | null;
  if (!usersData) return [];
  const users = Object.values(usersData)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(offset, offset + 10);
  const usersRecords: { userId: string; records: IPoemRecord[] }[] = [];
  for (const user of users) {
    if (!user.records) continue;
    usersRecords.push({ userId: user.id, records: await getSortedRecords(Object.values(user.records), poemId) });
  }
  return usersRecords;
};

// const getUsersRating = async (poemId?: string): Promise<IUser[]> => {};

// (async () => {
//   do {
//     todayPoemId = String(Math.ceil(Math.random() * 49000));
//     console.log('try ', todayPoemId);
//   } while (!(await poemIsExists(todayPoemId)));
//   console.log(todayPoemId);
// })();
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

export {
  getPoem,
  poemIsExists,
  savePoem,
  searchPoems,
  comparePoem,
  logsRef,
  saveLog,
  cleanLog,
  getAllPoemRecords,
  getTodayPoem,
  saveNewPoemRecord,
  deletePoemRecord,
  getPoemRecords,
  getPoemRecord,
  setPoemRecordScore,
  getUserRecords,
  getAllUserRecords,
};
