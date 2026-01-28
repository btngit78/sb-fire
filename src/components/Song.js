import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Segment,
  Dimmer,
  Loader,
  Message,
  Icon,
  Button,
} from "semantic-ui-react";

import SongBody from "./SongBody";
import { findKeyInSong } from "../lib/utils";

import { SongContext, SONG_NOT_EXIST } from "../contexts/StoreContext";
import { getSong } from "../contexts/StoreAPI";

// song have been not assigned a key, see if we can
// determine its key (assuming song ends in normal pattern and
// did not change tone in the middle of the song).
// this auto-detect key will not work otherwise
// - return key (sharp/flat + "m" if minor)
function autoDetectKey(state) {
  let lastChord = "";
  let lines = [];

  if (state.songKey === "") {
    lines = state.songContent.split("\n");
    lastChord = findKeyInSong(lines);

    state.noChords = !lastChord;
    if (state.noChords) return "";

    // get <key><flat/sharp> + "m" only if minor
    if (lastChord.length > 1) {
      let mret = lastChord.match(/m$/i);

      if (mret && mret.index > 0) {
        lastChord = lastChord.slice(
          0,
          lastChord[mret.index] === "M" ? mret.idx : mret.idx + 1
        );
      }
    }

    // console.log("assigned key to song: " + lastChord);
    state.songKey = state.songToKey = lastChord;
    const ridx = state.store.songSets.has(state.setName)
      ? state.songSetIndex
      : state.realSongSetIndex;

    // real songset collection
    if (ridx >= 0) {
      state.store.songSets.get(state.songLanguage)[ridx].key = lastChord;
      return lastChord;
    }
    return "";
  }
}

export function DatabaseErrorMsg({ mesg, exitHdlr }) {
  return (
    <div>
      <Message icon negative size="big">
        <Icon name="database" />
        <Message.Content>
          <Message.Header>Error in loading data.</Message.Header>
          <p>
            An error occurred in reading/writing the database. Contact the admin
            if this error is persistent.
          </p>
          <p>{mesg}</p>
          {exitHdlr ? (
            <Button
              basic
              size="large"
              color="black"
              content="Close"
              onClick={exitHdlr}
            ></Button>
          ) : null}
        </Message.Content>
      </Message>
    </div>
  );
}

export default function SongDisplay() {
  const [state] = useContext(SongContext);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updateTS, setUpdateTS] = useState(null);
  const keyChecked = useRef(false);

  // fetch data only if changing song
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Reading [${state.songName}]`);
        setError(null);
        setIsLoading(true);
        const res = await getSong(state.songName);
        console.log("song content: ", res);
        setData(res);
        setUpdateTS(state.songUpdateTS);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!updateTS || state.songUpdateTS !== updateTS) {
      // real index is negative only if song does not exist in catalog; just a place holder
      if (state.realSongSetIndex >= 0) fetchData();
    }
  }, [state.realSongSetIndex, state.songName, updateTS, state.songUpdateTS]);

  if (keyChecked.current === false) {
    // ! bad entry into DB for song key field; try autodetect anyway once
    if (state.songKey === "") {
      autoDetectKey(state);
    }
    keyChecked.current = true;
  }

  console.log("--- SongDisplay");

  if (error) {
    return <DatabaseErrorMsg mesg={error.message} />;
  }

  if (isLoading)
    return (
      <div>
        <Dimmer active>
          <Loader size="big" inverted>
            Loading song {state.songName}...
          </Loader>
        </Dimmer>
      </div>
    );

  // return error if song not found or song empty
  if (!data || !data.content) {
    return (
      <div>
        <Message icon negative size="big">
          <Icon name="database" />
          <Message.Content>
            <Message.Header>Song is not found!</Message.Header>
            <p>
              It's likely that the song has been removed from the database and
              the app hasn't been synced with the cloud for a while.
            </p>
            <p>Refresh the app to synchronize with the cloud DB.</p>
          </Message.Content>
        </Message>
      </div>
    );
  }

  if (state.realSongSetIndex < 0) state.songContent = SONG_NOT_EXIST;
  else state.songContent = data.content;

  return (
    <Segment basic>
      <div className="song-title">{state.songName}</div>
      <div className="song-author">
        {state.songAuthors}
        <br />
        <br />
      </div>
      <div className="song-body">
        <SongBody state={state} />
      </div>
    </Segment>
  );
}
