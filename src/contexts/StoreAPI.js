import firebase from "firebase/app";
import {} from "firebase/firestore";

const SONG_HEADER_COLLECTION = "song-header";
const SONG_BODY_COLLECTION = "song-body";
const RECENT_LIMIT = 50;

const SET_COLLECTION = "song-set";

export const DEFAULT_SET = "English";

// theoretically, we should use serverTimestamp, but what about timezone difference
// between server-client; and the moment library has problem (?) with the server timestamp format.
// const { serverTimestamp } = firebase.firestore.FieldValue;
const serverTimestamp = () => Date.now();

const db = firebase.firestore();

// async function getSongHeader(title) {
//   const songRef = db.collection(SONG_HEADER_COLLECTION).doc(title);

//   if (!!title) {
//     try {
//       const doc = await songRef.get();
//       if (!doc.exists) {
//         throw new Error("No such song found.");
//       } else {
//         return doc.data();
//       }
//     } catch (e) {
//       throw e;
//     }
//   }
// }

// async function getSongBody(title) {
//   const songRef = db.collection(SONG_BODY_COLLECTION).doc(title);

//   if (!!title) {
//     try {
//       const doc = await songRef.get();
//       if (!doc.exists) {
//         throw new Error("No such song found.");
//       } else {
//         return doc.data();
//       }
//     } catch (e) {
//       throw e;
//     }
//   }
// }

export async function getSong(title) {
  const songRef = db.collection(SONG_HEADER_COLLECTION).doc(title);
  const songBodyRef = db.collection(SONG_BODY_COLLECTION).doc(title);

  if (!!title) {
    try {
      const hdr = await songRef.get();
      if (!hdr.exists) {
        throw new Error("No such song found.");
      } else {
        const bdy = await songBodyRef.get();
        if (!bdy.exists) {
          console.log("No content for: " + title);
          return { ...hdr.data(), content: "" };
        }
        return { ...hdr.data(), ...bdy.data() };
      }
    } catch (err) {
      throw err;
    }
  } else throw new Error("No title to get");
}

export async function getAllSongHeaders() {
  const allRef = db.collection(SONG_HEADER_COLLECTION);
  const res = { songs: [] };

  try {
    const snapshot = await allRef.get();
    if (snapshot.empty) {
      console.log("Song DB is empty!");
    } else {
      snapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        res.songs.push({
          title: doc.id,
          ...doc.data(),
        });
      });
    }
    // console.log({ res });
    return res;
  } catch (err) {
    throw err;
  }
}

export async function getRecentAdditions() {
  const allRef = db.collection(SONG_HEADER_COLLECTION);
  const res = { songs: [] };

  try {
    const snapshot = await allRef.orderBy("createdAt").get();

    if (snapshot.empty) {
      console.log("Song DB is empty!");
    } else {
      const docs = snapshot.docs;
      docs.reverse();
      for (let i = 0; i < RECENT_LIMIT; i++) {
        // doc.data() is never undefined for query doc snapshots
        // console.log({doc.id, data: doc.data()});
        res.songs.push({
          title: docs[i].id,
          ...docs[i].data(),
        });
      }
    }
    return res;
  } catch (err) {
    throw err;
  }
}

export async function addSong({
  title = "",
  language = "",
  authors = "",
  key = "",
  keywords = "",
  tempo = 0,
  content = "",
  userId = "",
}) {
  const songHdrRef = db.collection(SONG_HEADER_COLLECTION).doc(title);
  const songBdyRef = db.collection(SONG_BODY_COLLECTION).doc(title);
  const timestamp = serverTimestamp();

  if (title) {
    let so = {
      authors,
      language,
      key,
      keywords,
      tempo,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    let co = { content };

    if (userId) {
      // need in both for security rules
      so = { ...so, userId: userId };
      co = { ...co, userId: userId };
    }

    try {
      const res = await songHdrRef.get();
      if (res.exists) {
        throw new Error("Song already exists");
      }
      // should be batched (transaction start/end)
      await songHdrRef.set(so);
      await songBdyRef.set(co);
      return true;
    } catch (err) {
      throw err;
    }
  }
  return false;
}

export async function updateSong({
  title,
  // language = "",
  authors = "",
  key = "",
  keywords = "",
  tempo = 0,
  content = "",
}) {
  const songHdrRef = db.collection(SONG_HEADER_COLLECTION).doc(title);
  const songBdyRef = db.collection(SONG_BODY_COLLECTION).doc(title);
  const timestamp = serverTimestamp();

  if (!!title) {
    try {
      // should be batched (transaction start/end)
      await songHdrRef.update({
        authors,
        // language,
        key,
        keywords,
        tempo,
        updatedAt: timestamp,
      });
      await songBdyRef.update({ content });
      return true;
    } catch (err) {
      throw err;
    }
  }
  return false;
}

export async function deleteSong(title) {
  const songHdrRef = db.collection(SONG_HEADER_COLLECTION).doc(title);
  const songBdyRef = db.collection(SONG_BODY_COLLECTION).doc(title);

  if (!!title) {
    try {
      const res = await songHdrRef.get();
      if (!res.exists) {
        throw new Error("Song does not exist");
      }
      // should be batched (transaction start/end)
      await songBdyRef.delete();
      await songHdrRef.delete();
      return true;
    } catch (err) {
      // console.log("failed to delete: ", title);
      throw err;
    }
  }
}

// ============= set document api ============ //
export async function addSet(title, set = [], userId = "") {
  // console.log("Adding .. ", {title, set, userId});

  const setRef = db.collection(SET_COLLECTION).doc(title);
  const timestamp = serverTimestamp();

  if (!!title) {
    let so = {
      songs: set,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (!!userId) {
      // include userId only if provided (as for premium)
      so = { ...so, userId: userId };
    }

    try {
      const res = await setRef.get();
      if (res.exists) {
        throw new Error("Set already exists");
      }

      await setRef.set(so);
      return true;
    } catch (err) {
      throw err;
    }
  }
  return false;
}

export async function updateSet(title, songs) {
  const setRef = db.collection(SET_COLLECTION).doc(title);
  const timestamp = serverTimestamp();

  if (!!title) {
    try {
      await setRef.update({
        songs: songs,
        updatedAt: timestamp,
      });
      return true;
    } catch (err) {
      throw err;
    }
  }
  return false;
}

export async function updateSetField(title, fieldName, fieldVal) {
  const setRef = db.collection(SET_COLLECTION).doc(title);
  const timestamp = serverTimestamp();

  if (setRef && !!fieldName && fieldVal) {
    try {
      await setRef.update({
        [fieldName]: firebase.firestore.FieldValue.arrayUnion(fieldVal),
      });
      await setRef.update({
        updatedAt: timestamp,
      });
      setRef
        .get()
        .then((res) =>
          console.log("Get after update ...", { title, data: res.data() })
        );
      return true;
    } catch (err) {
      throw err;
    }
  }
  return false;
}

export async function deleteSet(title) {
  const setRef = db.collection(SET_COLLECTION).doc(title);

  if (!!title) {
    try {
      const res = await setRef.get();
      if (!res.exists) {
        throw new Error("Set does not exist");
      }

      await setRef.delete();
      return true;
    } catch (err) {
      throw err;
    }
  }
}

export async function getSet(title) {
  const setRef = db.collection(SET_COLLECTION).doc(title);

  if (!!title) {
    try {
      const setDoc = await setRef.get();
      if (!setDoc.exists) {
        throw new Error("No such set found.");
      } else {
        return { ...setDoc.data() };
      }
    } catch (err) {
      throw err;
    }
  } else throw new Error("No title to get");
}

export async function getAllSets() {
  const allRef = db.collection(SET_COLLECTION);
  const res = { sets: [] };

  try {
    const snapshot = await allRef.get();
    if (snapshot.empty) {
      console.log("Set DB is empty!");
    } else {
      snapshot.forEach((doc) => {
        // console.log({doc.id, data: doc.data()});
        res.sets.push({
          title: doc.id,
          ...doc.data(),
        });
      });
    }
    // console.log({ res });
    return res;
  } catch (err) {
    throw err;
  }
}
