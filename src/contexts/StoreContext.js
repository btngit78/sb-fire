import React, { useState, useReducer, useEffect, useRef } from "react";
import { Dimmer, Loader, Message } from "semantic-ui-react";
import { useAuth } from "../contexts/AuthContext";
import { getAllSets, getAllSongHeaders, DEFAULT_SET } from "./StoreAPI";

export const SongContext = React.createContext();

export const SONG_NOT_EXIST =
  "Song no longer exist in database.\n\nCheck and edit to correct set(s) as necessary.";

// ============= store context =============== //
// song in-mem directory DB, built at init time.
const songStore = {
  timeInit: null, // songs DB init timestamp
  songSets: new Map(), // selectable song sets per language, song entries as read in from DB
  setChoiceOptions: [], // set options for display, including user-defined sets
  songChoiceOptions: {}, // song options for display per set, including user-defined sets
  authorsOptions: new Map(), // map of language-authors
  lastAuthorsSelected: null, // saved authors search value
  userSets: null, // saved set data (cached) as read in from DB
  userSetTimeInit: null, // user-defined set init timestamp
};

const songNull = () => {
  return {
    songName: null,
    songAuthors: null,
    songKey: null,
    songToKey: null,
    songKeywords: null,
    songTempo: 0,
    songIdx: 0, // index in lang (real) set
    songLanguage: null,
    songUpdateTS: null,
    songUserId: null, // non-null if author was not admin
  };
};

// initial state values
const initialState = {
  setName: null, // set name, real or virtual (user)
  songSetIndex: 0, // index in set (lang or virtual) as selected
  ...songNull(), // selected's song specific values

  // derived values
  noChords: true,
  chordOff: false,
  realSongSetIndex: 0, // when songSet is not a language set, this is the 'real' language set index

  // in-mem catalog (database) and derived values
  store: songStore,
};

// no pagination or caching scheme to hangle larger DB (yet!)
// this should be plenty for majority of cases
// const songsInMemLimit = 2000;

const songStoreIsEmpty = (state) => {
  return state.store.timeInit && !state.store.songSets.size;
};

const songValues = (songList, index) => {
  return {
    // song's specific
    songName: songList[index].title,
    songAuthors: songList[index].authors,
    songKey: songList[index].key,
    songToKey: songList[index].key,
    songKeywords: songList[index].keywords,
    songTempo: songList[index].tempo,
    songIdx: songList[index].idx,
    songLanguage: songList[index].language,
    songUpdateTS: songList[index].updatedAt,
    songUserId: songList[index].userId ?? null,

    // inclusion by default and derived values
    songSetIndex: index,
    noChords: songList[index].key === "",
  };
};

// this is the 'reducer' function that got dispatched
// to update the state
function songStoreReducer(state, action) {
  const store = state.store;
  let songList;

  // update state display values by reading from in-mem catalog

  switch (action.type) {
    case "selectSet": {
      // select set name and set song default to the first in list
      if (store.songSets.has(action.payload)) {
        songList = store.songSets.get(action.payload);
        return {
          ...state,
          setName: action.payload,
          ...songValues(songList, 0),
          realSongSetIndex: 0,
        };
      } else {
        // first song of user's set that exists
        let max = store.songChoiceOptions[action.payload].length;
        let si, fidx;
        for (si = 0; si < max; si++) {
          const lang = store.songChoiceOptions[action.payload][si].fromSet;
          const pick = store.songChoiceOptions[action.payload][si].text;
          songList = store.songSets.get(lang);
          fidx = songList.findIndex((e) => e.title === pick);
          if (fidx >= 0) break;
        }
        if (si >= max) {
          // none of the song in set exist anymore;
          // use last song in set as but indicate its non-existence
          return {
            ...state,
            realSongSetIndex: -1,
            ...songNull(),
            songSetIndex: max - 1,
            songName: store.songChoiceOptions[action.payload][max - 1].text,
            songContent: SONG_NOT_EXIST,
          };
        }
        const ekey = store.songChoiceOptions[action.payload][si].toKey ?? "";
        return {
          ...state,
          setName: action.payload,
          ...songValues(songList, fidx),
          songSetIndex: si,
          realSongSetIndex: fidx,
          songToKey: ekey !== "" ? ekey : songList[fidx].key,
          songTempo:
            store.songChoiceOptions[action.payload][si].toTempo ??
            songList[fidx].tempo,
        };
      }
    }
    case "selectSong": {
      // select song by index in the current set
      // real (language) set case
      const index = action.payload;
      if (store.songSets.has(state.setName)) {
        songList = store.songSets.get(state.setName);
        return {
          ...state,
          ...songValues(songList, index),
          realSongSetIndex: index,
        };
      } else {
        // user set case; look up lang and find song named in lang set
        const lang = store.songChoiceOptions[state.setName][index].fromSet;
        songList = store.songSets.get(lang);
        const nameInList = store.songChoiceOptions[state.setName][index].text;
        const fidx = songList.findIndex((e) => e.title === nameInList);

        if (fidx < 0) {
          // song no longer exist in catalog
          return {
            ...state,
            realSongSetIndex: -1,
            ...songNull(),
            songSetIndex: index,
            songName: nameInList,
            songContent: SONG_NOT_EXIST,
          };
        }

        const ekey = store.songChoiceOptions[state.setName][index].toKey ?? "";
        return {
          ...state,
          ...songValues(songList, fidx),
          songSetIndex: index,
          realSongSetIndex: fidx,
          songToKey: ekey !== "" ? ekey : songList[fidx].key,
          songTempo:
            store.songChoiceOptions[state.setName][index].toTempo ??
            songList[fidx].tempo,
        };
      }
    }
    case "selectSongByTitle": {
      // only thru author search result or recent additions table
      const language = action.payload.language;
      const title = action.payload.title;
      songList = store.songSets.get(language);
      if (songList) {
        const fidx = store.songChoiceOptions[language].findIndex(
          (e) => e.text === title
        );
        if (fidx >= 0) {
          return {
            ...state,
            setName: language,
            ...songValues(songList, fidx),
            realSongSetIndex: fidx,
          };
        }
      }
      // no change since either language's set or song title is not found
      return state;
    }
    case "selectKey":
      return {
        ...state,
        songToKey:
          state.songKey.endsWith("m") && !action.payload.endsWith("m")
            ? action.payload.concat("m")
            : action.payload,
      };
    case "chordOff":
      return {
        ...state,
        chordOff: action.payload,
      };

    case "storeReset":
      state.store.timeInit = null;
      state.store.songSets.clear();
      state.store.setChoiceOptions = [];
      state.store.songChoiceOptions = {};
      state.store.authorsOptions.clear();
      state.store.lastAuthorsSelected = null;
      state.store.userSets = null;
      state.store.userSetTimeInit = null;
      return {
        ...state, // store

        // song state
        setName: null,
        songSetIndex: 0,
        ...songNull(),

        // derived values
        noChords: true,
        chordOff: false,
        realSongSetIndex: 0,
      };

    case "syncAfterEdit":
      console.log("update via edit: ", { ...action.payload });
      const tmp = {};
      // tmp.songLanguage = action.payload.language;  -- not supposed to change
      // tmp.userId = action.payload.language;  -- not supposed to change
      tmp.songKey = action.payload.key;
      tmp.songToKey = tmp.songKey !== "" ? tmp.songKey : "";
      tmp.songAuthors = action.payload.authors;
      tmp.songKeywords = action.payload.keywords;
      tmp.songTempo = action.payload.tempo;
      tmp.songContent = action.payload.content;
      tmp.songUpdateTS = action.payload.updatedAt;
      if (action.payload.userId) {
        tmp.songUserId = action.payload.userId;
      }

      updateEntryInStore(state, action.payload);

      return {
        // to ensure triggering of re-render
        ...state,
        ...tmp,
      };

    case "addNewSong": {
      const tmp = {};
      tmp.songName = action.payload.title;
      tmp.songLanguage = action.payload.language;
      tmp.songKey = action.payload.key;
      tmp.songToKey = tmp.songKey;
      tmp.songAuthors = action.payload.authors;
      tmp.songKeywords = action.payload.keywords;
      tmp.songTempo = action.payload.tempo;
      tmp.songContent = action.payload.content;
      tmp.songUpdateTS = action.payload.createdAt;
      if (action.payload.userId) {
        // store id for only premium user
        tmp.songUserId = action.payload.userId;
      }

      const si = insertNewEntry(state, action.payload);

      return {
        // to ensure triggering of re-render
        ...state,
        setName: tmp.songLanguage,
        songSetIndex: si,
        ...tmp,
      };
    }

    default:
      return state;
  }
}

// update the store's directory of a song entry with data object which should contain all
// relevant fields except the song content itself
function updateEntryInStore(state, song) {
  if (!song || !song.language || !song.title) {
    console.log("bad update entry: ", song);
    return;
  }

  const songList = state.store.songSets.get(song.language);
  if (songList) {
    const index = songList.findIndex((el) => el.title === song.title);
    const tmp = song;
    delete tmp.content;
    songList[index] = { ...songList[index], ...tmp };
    console.log("in store: ", songList[index]);
  }
}

// insert the new song into the catalog and display's select list
export function insertNewEntry(state, song) {
  if (!song || !song.language || !song.title) {
    console.log("bad data to insert: ", song);
    return;
  }
  // set time even though not the same as will be set in the API call to add the song;
  // values will be early, but consistent for in-mem store
  song.createdAt = song.updatedAt = Date.now();

  // console.log("Song to add: ", song);
  const songList = state.store.songSets.get(song.language);
  const songOpts = state.store.songChoiceOptions[song.language];

  if (songList) {
    // find entry where title is greater than new song
    let sidx = songList.findIndex(
      (el) => el.title.localeCompare(song.title) > 0
    );
    sidx = sidx >= 0 ? sidx : songList.length;

    // insert song in songSet
    songList.splice(sidx, 0, song);
    songList[sidx].idx = sidx;

    // insert song choice in select list
    songOpts.splice(sidx, 0, { text: song.title, value: sidx });

    // update indexes in the higher entries
    for (let i = sidx + 1; i < songList.length; i++) {
      songList[i].idx = i;
      songOpts[i].value = i;
    }

    // console.log("updated lists after insert: ", songList, " select:", songOpts);
    return sidx; // index of new song
  } else console.log("bad language in song to insert:", song);
  return -1;
}

// delete song from catalog and reharmonize lists
export function deleteEntryInStore(state, title) {
  const idx = state.songSetIndex;
  const set = state.setName;
  const ss = state.store.songSets.get(set);
  const dl = state.store.songChoiceOptions[set];
  const setIdx = state.store.setChoiceOptions.findIndex((e) => e.text === set);

  // currently, only delete the song in use so title isn't actually necessary
  if (
    title !== state.songName ||
    setIdx < 0 ||
    !(state.store.setChoiceOptions[setIdx].builtin === true)
  ) {
    console.log("!! something wrong; not valid delete");
    return;
  }

  if (ss[idx].title !== title) {
    console.log("!! data out of sync; not safe to delete !!");
    return;
  }

  ss.splice(idx, 1);
  dl.splice(idx, 1);
  // renumber in both songSet and select list
  for (let i = idx; i < ss.length; i++) {
    ss[i].idx = dl[i].value = i;
  }
}

/* ========================================================================= */
function installSong(songSets, song) {
  let songList;

  let se = {
    title: song.title,
    authors: !!song.authors ? song.authors : "",
    key: !!song.key ? song.key : "",
    keywords: !!song.keywords ? song.keywords : "",
    tempo:
      !song.tempo || song.tempo === "" || song.tempo === "0"
        ? 0
        : parseInt(song.tempo, 10),
    idx: 0, // to be revised after sorting the list later
    language: song.language,
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
  };

  // new for premium feature: optional userId field
  if (song.userId) se = { ...se, userId: song.userId };

  if (!songSets.has(song.language)) {
    // create new set for language
    songSets.set(song.language, []);
  }
  // add song to pre-existing language set
  songList = songSets.get(song.language);
  songList.push(se);
}

function addAuthor(store, author, language) {
  // add the first name in the list of authors into the set
  if (author.length) {
    let names = author.split(/[,|&|(]/);
    if (names.length) {
      // drop author that is likely a comment (or unclear authorship)
      if (names[0].charAt(0) !== "(" && names[0].charAt(0) !== "#") {
        let newval = names[0].trim();
        for (var i = 0; i < newval.length; i++) {
          if (newval.charAt(i) === " ") {
            // uppercase the initial char to make sure names will be catalogued properly
            if (newval.charCodeAt(i + 1) > "Z".charCodeAt(0)) {
              let s = newval
                .charAt(i + 1)
                .toUpperCase()
                .concat(newval.substring(i + 2));
              newval = newval.substring(0, i + 1).concat(s);
            }
          }
        }
        if (!store.authorsOptions.has(newval)) {
          store.authorsOptions.set(newval, language);
        }
      }
    }
  }
}

function populateDB(data, state) {
  if (!data) return;

  if (state.store.timeInit) {
    console.log("!! problem: populateDB should not be called again !!");
    return;
  }

  state.store.timeInit = Date.now();

  // build song tables grouped by language
  data.songs.forEach((song) => installSong(state.store.songSets, song));
  // sort each list in-mem due to apparent bug in Strapi which may have to do with
  // mixed character set. By using localeCompare we get accurate sort results
  state.store.songSets.forEach((value, key) => {
    state.store.songSets.set(
      key,
      value.sort((a, b) => a.title.localeCompare(b.title))
    );
    value.forEach((song, idx) => (song.idx = idx)); // update idx
  });

  // build set select list (text/value) for display
  const tmp = [...state.store.songSets.keys()].sort();
  tmp.forEach((val) =>
    state.store.setChoiceOptions.push({
      text: val,
      value: val,
      builtin: true,
    })
  );

  // build song select list (text/value) for display,
  // also add author name into set for selection later
  state.store.songSets.forEach((value, key) => {
    console.log(
      "Set [" +
        key +
        "] has " +
        state.store.songSets.get(key).length +
        " entries."
    );
    state.store.songChoiceOptions[key] = [];
    value.forEach((cur, index) => {
      state.store.songChoiceOptions[key].push({
        text: cur.title,
        value: index,
      });
      addAuthor(state.store, cur.authors, key);
    });
  });

  // const firstSet = [...state.store.songSets.keys()].sort()[0];
  // const songList = state.store.songSets.get(firstSet);
  // state = { ...state, setName: firstSet, ...songValues(songList, 0) };

  console.log("Done with populateDB: ", state);
}

export function updateUserSetDB(
  state,
  setName,
  song,
  newFlg,
  timestamp,
  userId = null
) {
  if (newFlg) {
    // this is new set; insert new set into data saved
    const set = {
      title: setName,
      songs: [song],
      createdAt: timestamp,
      updatedAt: timestamp,
      userId: userId ?? null,
    };

    // insert new set into saved data (as read from db)
    state.store.userSets.sets.splice(
      state.store.userSets.sets.findIndex(
        (e) => e.title.localeCompare(setName) > 0
      ),
      0,
      set
    );

    // insert new set choice into setchoiceOptions
    state.store.setChoiceOptions.splice(
      state.store.setChoiceOptions.findIndex(
        (e) => e.text.localeCompare(setName) > 0
      ),
      0,
      { text: setName, value: setName, builtin: false }
    );
  }

  // add new entry to songChoiceOptions at the end (default)
  const lastidx = state.store.songChoiceOptions[setName].length;
  state.store.songChoiceOptions[setName].splice(lastidx, 0, {
    text: song.title,
    value: lastidx,
    fromSet: song.language,
    toKey: song.toKey ?? "",
    toTempo: song.toTempo ?? 0,
  });
}

export function addNewSetToDB(state, setName, songs, timestamp, userId = null) {
  // timestamp !! is local Date.now(); how to use serverTimestamp on client side?

  // add to set select choices
  state.store.setChoiceOptions.push({
    text: setName,
    value: setName,
    builtin: false,
  });

  // add to song select choices
  state.store.songChoiceOptions[setName] = [];
  if (songs.length) {
    songs.forEach((se, sidx) => {
      state.store.songChoiceOptions[setName].push({
        text: se.title,
        value: sidx,
        fromSet: se.language,
        toKey: se.toKey,
        toTempo: se.toTempo,
      });
    });
  }

  // insert into raw data set
  state.store.userSets.sets.splice(
    state.store.userSets.sets.findIndex(
      (e) => e.title.localeCompare(setName) > 0
    ),
    0,
    {
      title: setName,
      songs: songs,
      createdAt: timestamp,
      updatedAt: timestamp,
      userId: userId ?? null,
    }
  );
}

// this is only used for 'fixed name set' (recentlyAdded set), never need userId for set's data
export function updateOrAddSetToDB(state, setName, songs, fidx, timestamp) {
  if (fidx < 0) {
    addNewSetToDB(state, setName, songs, timestamp);
    return;
  }

  // replace complete content of set
  state.store.songChoiceOptions[setName] = [];
  songs.forEach((se, sidx) => {
    state.store.songChoiceOptions[setName].push({
      text: se.title,
      value: sidx,
      fromSet: se.language,
      toKey: se.toKey,
      toTempo: se.toTempo,
    });
  });
}

export const totalSongsInStore = (state) => {
  let count = 0;
  state.store.songSets.forEach((val, key) => (count += val.length));
  return count;
};

export const totalUserSetCount = (state) => {
  return state.store.userSets.sets.length;
};

export const averageSetSize = (state) => {
  let total = 0;
  state.store.userSets.sets.forEach((e) => (total += e.songs.length));
  return Math.floor(total / state.store.userSets.sets.length);
};

export function populateUserSetsDB(data, state) {
  state.store.userSets = data;
  state.store.userSetTimeInit = Date.now();

  // rebuild the whole user sets data, any number of sets might have been modified/deleted/added
  // keep only lang sets in setChoice and songChoice, then rebuild the user sets data
  state.store.setChoiceOptions = state.store.setChoiceOptions.filter(
    (e) => e.builtin === true
  );

  // each user-defined set will have its builtin flag in setchoices set to false
  for (const setname in state.store.songChoiceOptions) {
    if (!state.store.songSets.has(setname))
      delete state.store.songChoiceOptions[setname];
  }

  data.sets.forEach((set, idx) => {
    state.store.setChoiceOptions.push({
      text: set.title,
      value: set.title,
      builtin: false,
    });
    state.store.songChoiceOptions[set.title] = [];
    if (set.songs?.length) {
      set.songs.forEach((se, sidx) => {
        state.store.songChoiceOptions[set.title].push({
          text: se.title,
          value: sidx,
          fromSet: se.language,
          toKey: se.toKey,
          toTempo: se.toTempo,
        });
      });
    }
  });
}

// Component to provide song context/store for the React UI
export function SongProvider({ children }) {
  const { currentUser, userStateChange } = useAuth();
  const [state, dispatch] = useReducer(songStoreReducer, initialState);
  const [storeReady, setStoreReady] = useState(false);
  const [dstate, setDstate] = useState({
    data: null,
    isLoading: false,
    error: null,
  });
  const [userSets, setUserSets] = useState(null);
  const loopCnt = useRef(0);

  useEffect(() => {
    if (!currentUser) {
      if (!state.store.timeInit) setStoreReady(false);
      const unsubscribe = userStateChange((user) => {});
      return unsubscribe;
    }
  }, [currentUser, userStateChange, state.store.timeInit]);

  useEffect(() => {
    // don't need to init db if not logged in or already load db
    if (!currentUser || storeReady) return;

    // fetching is not going on, start fetchin
    if (!dstate.isLoading && !dstate.data) {
      setDstate({ ...dstate, isLoading: true });
      console.log("Reading [ all set list if any ]");
      getAllSets().then((res) => setUserSets(res)); // ok if no set has been created
      console.log("Reading [ all song headers ]");
      getAllSongHeaders()
        .then((res) => setDstate({ data: res, isLoading: false, error: null }))
        .catch((err) =>
          setDstate({ data: null, isLoading: false, error: err })
        );
    }

    // if got data and no error, init db and set first song for display
    if (dstate.data && !state.store.timeInit) {
      populateDB(dstate.data, state); // timeInit will be set by this call
      populateUserSetsDB(userSets, state);
      dispatch({ type: "selectSet", payload: DEFAULT_SET });
      setStoreReady(true);
      // remove dstate.data and userSets;
      delete dstate.data;
      setUserSets(null);
      loopCnt.current = 0;
    }
    loopCnt.current += 1;
    console.log("Loop count:", loopCnt.current);
  }, [currentUser, storeReady, dstate, userSets, state]);

  console.log("--- Song Provider");

  if (currentUser) {
    if (dstate.isLoading) {
      console.log("render loading ..");
      return (
        <Dimmer active>
          <Loader size="big" inverted>
            Loading MySongBook database ...
          </Loader>
        </Dimmer>
      );
    }

    if (dstate.error) {
      console.log("render error ..");
      return (
        <div>
          <Message size="big">
            <Message.Header>Error in loading data.</Message.Header>
            <p>{dstate.error.message}</p>
          </Message>
        </div>
      );
    }

    if (songStoreIsEmpty(state)) {
      console.log("render empty ..");
      return (
        <div>
          <Message size="big">
            <Message.Header>
              Database is empty.
              <br />
              There is no song in the database.
            </Message.Header>
          </Message>
        </div>
      );
    }

    if (!storeReady) {
      return (
        <Dimmer active>
          <Loader size="big">MySongBook is almost ready ...</Loader>
        </Dimmer>
      );
    }
  }

  return (
    <SongContext.Provider value={[state, dispatch]}>
      {children}
    </SongContext.Provider>
  );
}
