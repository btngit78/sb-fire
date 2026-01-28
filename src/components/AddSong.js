import React, { useState, useContext, useEffect } from "react";
import {
  Dimmer,
  Loader,
  Button,
  TextArea,
  Grid,
  Input,
  Form,
  Dropdown,
} from "semantic-ui-react";
import { DatabaseErrorMsg } from "./Song";
// import { generateTextFormatForCurrentState } from "./SongBody";

import { SongContext, insertNewEntry } from "../contexts/StoreContext";
import {
  addSong,
  updateSong,
  getSong,
  DEFAULT_SET,
} from "../contexts/StoreAPI";
import { PromptConfirm, PromptBinary } from "./Prompt";
import { errorInSongFields } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

let savedTS = null;
let savedData = null;
let songAdded = false; // set only when song is added, reset only when new song
// is being worked on, or when editor closes.

const initSong = (ts, state) => {
  const sidx = state.store.setChoiceOptions.findIndex(
    (e) => e.text === state.setName && e.builtin
  );
  const lang = sidx >= 0 ? state.store.setChoiceOptions[sidx].text : "";

  if (!ts)
    return {
      title: "",
      authors: "",
      key: "",
      keywords: "",
      tempo: "",
      language: lang, // default
      content: "",
      createdAt: null,
      updatedAt: null,
    };
  else return { ...savedData };
};

export function AddSongDisplay({ closeHandler }) {
  console.log("--- AddSongDisplay");

  const [state, dispatch] = useContext(SongContext);
  const { isPremium, userId } = useAuth();

  // song values
  const [song, setSong] = useState(initSong(savedTS, state));

  // editor state tracking
  const [changed, setChanged] = useState(false);

  // data io state tracking
  const [dstate, setDstate] = useState({
    data: savedTS ? savedData : null,
    isLoading: savedTS ? false : true,
    error: null,
  });

  const [changeSetConfirmOpen, setChangeSetConfirmOpen] = useState(false);
  const [nosavePromptOpen, setNosavePromptOpen] = useState(false);
  const [exit, setExit] = useState(false);

  const doClosePostConfirm = () => {
    savedTS = null;
    savedData = null;
    songAdded = false;
    closeHandler();
  };

  const doClose = () => {
    setExit(true);
    doClosePostConfirm();
  };

  const notifyAfter = () => {
    // notification only if song wasn't added yet, not on 2nd+ saves
    if (!songAdded) {
      if (state.setName !== song.language) {
        // change set or stay ?
        setChangeSetConfirmOpen(true);
      } else {
        // same set; simply notify; do once the first time song is added
        insertNewEntry(state, song);
        alert(`"${song.title}" was added successfully.`);
      }
      songAdded = true;
    }
  };

  const handleSave = () => {
    if (changed)
      doUpdate().then((done) => {
        if (done) notifyAfter();
      });
  };

  const handleSaveClose = () => {
    if (changed) {
      doUpdate().then((done) => {
        if (done) {
          notifyAfter();
          // go ahead with close if no need to confirm set change
          if (state.setName === song.language) doClose();
        }
      });
    }
  };

  const handleChange = (field, val) => {
    savedTS = Date.now();
    if (field === "title") {
      // title changed; a new song is assumed;
      // will need to add, not update later
      if (songAdded) songAdded = false;
    }
    savedData[field] = val;

    setSong({ ...savedData });
    setChanged(true);
  };

  const doUpdate = async () => {
    let done = false;

    if (
      !songAdded &&
      (!state.store.songSets.has(song.language) ||
        state.store.songSets
          .get(song.language)
          .findIndex((e) => e.title === song.title) >= 0)
    ) {
      alert("Song named already exists or language is not correct.");
      return;
    }

    if (changed) {
      let data = {
        title: song.title,
        language: song.language,
        authors: song.authors.trim(),
        key: song.key.trim(),
        keywords: song.keywords.trim(),
        tempo: song.tempo ? parseInt(song.tempo, 10) : 0,
        content: song.content.trim(),
      };

      if (isPremium) {
        // set userId field; use data
        data = { ...data, userId: userId };
      }

      let errmsg = errorInSongFields(data);
      if (errmsg !== null) {
        alert(errmsg);
        return done;
      }

      // use input data to set form values, including userId as it will be entered into db later
      setSong({ ...data, tempo: data.tempo.toString() });

      try {
        setDstate({ ...dstate, isLoading: true });
        const ok = songAdded ? await updateSong(data) : await addSong(data);
        if (ok) {
          setChanged(false);

          // update store, read from DB to get updated timestamp and verify
          // proposed values versus recorded & returned
          const rec = await getSong(song.title);

          if (
            data.authors !== rec.authors ||
            data.language !== rec.language ||
            data.key !== rec.key ||
            data.keywords !== rec.keywords ||
            data.content !== rec.content ||
            data.tempo !== rec.tempo ||
            (isPremium && data.userId !== rec.userId)
          )
            console.log("!! recall not same as written !!");
          rec.title = song.title; // this must be added to record entry

          setDstate({ data: rec, isLoading: false, error: null });
          done = true;
        }
      } catch (err) {
        setDstate({ ...dstate, error: err, isLoading: false });
      }
      return done;
    }
  };

  const doChangeSet = () => {
    dispatch({ type: "addNewSong", payload: dstate.data });
    setChangeSetConfirmOpen(false);
    if (exit) doClosePostConfirm();
  };

  const doSameSet = () => {
    insertNewEntry(state, song);
    setChangeSetConfirmOpen(false);
    if (exit) doClosePostConfirm();
  };

  const handleCancel = () => {
    if (changed)
      // change was made; confirm to exit
      setNosavePromptOpen(true);
    else doClosePostConfirm();
  };

  // =============== begin of AddSong ============= //

  if (!savedTS) {
    // before any change, setup saved data to initial song object;
    savedData = Object.assign({}, song);
  }

  useEffect(() => {
    if (dstate.data) {
      // dstate.data is either picked up from savedData if render was
      // triggerred externally by resize
      // or is set from read DB after added/updated
      setSong(dstate.data);
    }
  }, [dstate.data]);

  if (songAdded && dstate.isLoading) {
    return (
      <Dimmer active>
        <Loader size="big" inverted>
          Resyncing song ...
        </Loader>
      </Dimmer>
    );
  }

  if (dstate.error)
    return (
      <DatabaseErrorMsg
        mesg={dstate.error.message}
        exitHdlr={() => closeHandler()}
      />
    );

  return (
    <>
      <PromptBinary
        open={changeSetConfirmOpen}
        text={`New song is not for the set being used.`}
        opt1Text={`Use [${song.language}] set as default`}
        opt2Text={`Stay with [${state.setName}] set`}
        opt1Hdlr={doChangeSet}
        opt2Hdlr={doSameSet}
      />
      <PromptConfirm
        open={nosavePromptOpen}
        text="Song has not been saved. Exit anyway?"
        noHdlr={() => setNosavePromptOpen(false)}
        yesHdlr={doClose}
      />
      <Grid>
        <Grid.Row columns={1}>
          <Grid.Column>
            <Button
              basic
              icon="cancel"
              color={changed ? "pink" : "black"}
              floated="left"
              content="Exit"
              onClick={handleCancel}
            />
            <Button
              basic
              icon="save"
              disabled={!changed}
              color={"blue"}
              floated="left"
              content="Save"
              onClick={handleSave}
            />
            <Button
              basic
              icon="save"
              disabled={!changed}
              color={"blue"}
              floated="left"
              content="Save &amp; Close"
              onClick={handleSaveClose}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <br></br>
      <Form size="large">
        <Form.Group>
          <Form.Field width={9}>
            <b>Title</b>
            <br />
            <Input
              fluid
              value={song.title}
              onChange={(ev, data) => handleChange("title", data.value)}
            />
          </Form.Field>
          <Form.Field width={1}></Form.Field>
          <Form.Field width={2}>
            <b>Language</b>
            <br />
            <Dropdown
              search
              deburr={true}
              selection
              onChange={(ev, data) => handleChange("language", data.value)}
              value={song.language ? song.language : DEFAULT_SET}
              options={state.store.setChoiceOptions
                .filter((e) => e.builtin)
                .map((e, idx) => ({ text: e.text, value: e.value, key: idx }))}
            />
          </Form.Field>
        </Form.Group>
        <Form.Group>
          <Form.Field width={7}>
            <b>Authors</b>
            <br />
            <Input
              fluid
              value={song.authors}
              onChange={(ev, data) => handleChange("authors", data.value)}
            />
          </Form.Field>
          <Form.Field width={2}>
            <b>Key</b>
            <br />
            <Input
              fluid
              value={song.key}
              onChange={(ev, data) => handleChange("key", data.value)}
            />
          </Form.Field>
          <Form.Field width={5}>
            <b>Keywords</b>
            <br />
            <Input
              fluid
              value={song.keywords}
              onChange={(ev, data) => handleChange("keywords", data.value)}
            />
          </Form.Field>
          <Form.Field width={2}>
            <b>Tempo</b>
            <br />
            <Input
              fluid
              value={song.tempo}
              onChange={(ev, data) => handleChange("tempo", data.value)}
            />
          </Form.Field>
        </Form.Group>

        <Form.Field width={16}>
          <b>Song</b>
          <br />
          <TextArea
            style={{
              minHeight: Math.floor(window.innerHeight * 0.6),
              fontSize: "1.18em",
            }}
            value={song.content}
            onChange={(ev, data) => handleChange("content", data.value)}
          />
        </Form.Field>
      </Form>
    </>
  );
}
