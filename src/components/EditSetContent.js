import React, { useEffect, useState, useContext } from "react";

import {
  Dimmer,
  Loader,
  Button,
  List,
  Dropdown,
  Label,
  Divider,
  Checkbox,
  Icon,
  Grid,
  Container,
  // Segment,
} from "semantic-ui-react";

import moment from "moment";

import { DatabaseErrorMsg } from "./Song";

import { SongContext } from "../contexts/StoreContext";
import { getSet, updateSet } from "../contexts/StoreAPI";
import { PromptConfirm } from "./Prompt";

const setInitialState = (appState, name) => {
  const firstSet = [...appState.store.songSets.keys()].sort()[0];

  if (!savedEditorState) {
    // first render, no editing was ever attempted
    return {
      setName: name,
      createdAt: null, // fill in later
      setUse: firstSet,
      setUseList: appState.store.songSets.get(firstSet),
      songStore: appState.store,
      songs: [],
      setInUseMap: [], // indexes of song existed in lang set
      orphanedMap: [], // deleted songs (from lang set)
      changed: false,
    };
  } else return { ...savedEditorState };
};

const saveEditState = (es) => {
  if (!savedEditorState) savedEditorState = Object.assign({}, es);
  else savedEditorState = es;
};

const reorderSet = (es, esm, to, fr) => {
  let len = es.songs.length;
  let songs = [];
  let inUse = [];
  let orphaned = [];

  function mvDown(l) {
    let r = [];
    r = l.slice(0, to + 1);
    r.splice(fr, 1);
    r = r.concat(l[fr]);
    if (to < len - 1) r = r.concat(l.slice(to + 1));
    return r;
  }

  function mvUp(l) {
    let r = [];
    r = l.slice(to);
    r.splice(fr - to, 1);
    r = Array.of(l[fr]).concat(r);
    if (to > 0) r = l.slice(0, to).concat(r);
    return r;
  }

  if (fr === to) return;
  if (fr < to) {
    songs = mvDown(es.songs);
    inUse = mvDown(es.setInUseMap);
    orphaned = mvDown(es.orphanedMap);
  } else if (fr > to) {
    songs = mvUp(es.songs);
    inUse = mvUp(es.setInUseMap);
    orphaned = mvUp(es.orphanedMap);
  }
  saveEditState({
    ...es,
    songs: songs,
    setInUseMap: inUse,
    orphanedMap: orphaned,
    changed: true,
  });
  esm(savedEditorState);
};

const changeLangSet = (es, lang) => {
  const langSet = es.songStore.songSets.get(lang);
  const inUse = [];
  const orphaned = [];

  es.songs.forEach((e, idx) => {
    const fidx = langSet.findIndex((s) => s.title === e.title);
    inUse.push(fidx);
    // map of song no longer existed in lang set
    orphaned.push(fidx < 0 && e.language === lang);
  });

  savedEditorState = {
    ...savedEditorState,
    setUse: lang,
    setUseList: langSet,
    setInUseMap: inUse,
    orphanedMap: orphaned,
  };

  return {
    ...es,
    setUse: lang,
    setUseList: langSet,
    setInUseMap: inUse,
    orphanedMap: orphaned,
  };
};

const LangSetItem = ({ idx, inUse, item, addHdlr, delHdlr }) => {
  return (
    <li>
      &nbsp;&nbsp;&nbsp;
      <Checkbox
        checked={inUse}
        id={"cbox" + idx}
        label={item.title}
        onClick={(e, obj) => {
          inUse ? delHdlr(idx) : addHdlr(idx);
        }}
      />
    </li>
  );
};

const LangSetList = ({ es, esm }) => {
  const addHdlr = (idx) => {
    saveEditState({
      ...es,
      songs: es.songs.concat({
        title: es.setUseList[idx].title,
        language: es.setUse,
        toKey: es.setUseList[idx].key,
        toTempo: es.setUseList[idx].tempo,
      }),
      setInUseMap: [...es.setInUseMap, idx],
      orphanedMap: [...es.orphanedMap, false],
      changed: true,
    });
    esm(savedEditorState);
  };

  const delHdlr = (idx) => {
    // obj.checked = false; -- default behavior
    const fidx = es.setInUseMap.indexOf(idx);
    const inUse = es.setInUseMap;
    const orphaned = es.orphanedMap;

    if (fidx >= 0) {
      // song index removed from map
      inUse.splice(fidx, 1);
      orphaned.splice(fidx, 1);
    } else console.log("!!Strange: ", idx, " not found in set");

    saveEditState({
      ...es,
      songs: es.songs.filter((e, ei) => ei !== fidx),
      setInUseMap: inUse,
      orphanedMap: orphaned,
      changed: true,
    });
    esm(savedEditorState);
  };

  return (
    <ol>
      {es.setUseList.map((e, idx) => (
        <LangSetItem
          key={idx}
          idx={idx}
          inUse={es.setInUseMap.indexOf(idx) >= 0}
          item={e}
          addHdlr={addHdlr}
          delHdlr={delHdlr}
        />
      ))}
    </ol>
  );
};

const SetItem = ({ idx, inUse, orphaned, title, delHdlr, es, esm }) => {
  const itemStyle = {
    border: "1px solid",
    borderRadius: "5px",
    borderColor: "#80808099",
    paddingLeft: "10px",
    paddingRight: "10px",
    cursor: "pointer",
  };
  // const yellow = "#f7f71c78";

  const allowDrop = (ev) => {
    ev.preventDefault();
  };

  const drag = (ev) => {
    ev.dataTransfer.setData("text", idx);
  };

  const drop = (ev) => {
    ev.preventDefault();
    const from = ev.dataTransfer.getData("text");
    reorderSet(es, esm, idx, from);
  };

  return (
    <div onDrop={drop} onDragOver={allowDrop} style={{ padding: "2px" }}>
      <Icon
        name="delete"
        link={true}
        onClick={() => {
          delHdlr(idx);
        }}
      />
      {idx + 1}
      &nbsp;&nbsp;&nbsp;
      {inUse ? (
        <span
          draggable="true"
          onDragStart={drag}
          style={{ ...itemStyle, backgroundColor: "#f7f71c78" }}
        >
          {title}
        </span>
      ) : orphaned ? (
        <span
          draggable="true"
          onDragStart={drag}
          style={{ ...itemStyle, backgroundColor: "pink" }}
        >
          {title}
        </span>
      ) : (
        <span draggable="true" onDragStart={drag} style={{ ...itemStyle }}>
          {title}
        </span>
      )}
    </div>
  );
};

const SetList = ({ es, esm }) => {
  const delHdlr = (idx) => {
    const inUse = es.setInUseMap;
    const orphaned = es.orphanedMap;
    inUse.splice(idx, 1);
    orphaned.splice(idx, 1);

    saveEditState({
      ...es,
      songs: es.songs.filter((e, ei) => idx !== ei),
      setInUseMap: inUse,
      orphanedMap: orphaned,
      changed: true,
    });
    esm(savedEditorState);
  };

  return es.songs
    ? es.songs.map((e, idx) => (
        <SetItem
          key={idx}
          idx={idx}
          inUse={es.setInUseMap[idx] >= 0}
          orphaned={es.orphanedMap[idx]}
          title={e.title}
          delHdlr={delHdlr}
          es={es}
          esm={esm}
        />
      ))
    : null;
};

const SetChoices = ({ es, esm, base }) => {
  return (
    <List.Item>
      <List.Content>
        <Label color="green" size="large">
          Language set:
        </Label>
        <Dropdown
          search
          deburr
          selection
          onChange={(ev, obj) => {
            saveEditState(changeLangSet(es, obj.value));
            esm(savedEditorState);
          }}
          value={es.setUse}
          options={base}
        />
      </List.Content>
    </List.Item>
  );
};

let fetchTS = null; // set once editor started up, reset when it must close
let didUpdated = false; // set once a change is made by editor, reset only before close
let savedData = null;
let savedEditorState = null;

export function EditSetContent({ closeHandler, setName }) {
  const [state] = useContext(SongContext);
  const [editorState, setEditorState] = useState(
    setInitialState(state, setName)
  );
  const [dstate, setDstate] = useState({
    data: fetchTS ? savedData : null,
    isLoading: fetchTS ? false : true,
    error: null,
  });
  const [nosavePromptOpen, setNosavePromptOpen] = useState(false);

  let bset = state.store.setChoiceOptions
    .filter((e) => e.builtin)
    .map((e, idx) => ({ text: e.text, value: e.value, key: idx }));

  const handleClose = () => {
    const tmp = didUpdated;

    fetchTS = null;
    savedData = null;
    didUpdated = false;
    savedEditorState = null;
    closeHandler(tmp); // didUpdated if true signals to set editor that changes were made
    // and set editor need to refesh when it returns.
  };

  const handleSave = async () => {
    if (!editorState.changed) return;

    try {
      await doUpdate();
      await doRefresh();
      saveEditState({ ...editorState, changed: false });
      setEditorState(savedEditorState);
    } catch (err) {
      throw err;
    }
  };

  const handleSaveClose = async () => {
    if (!editorState.changed) return;

    try {
      await doUpdate();
      setEditorState({ ...editorState, changed: false }); // actually, useless op here since we're closing
      handleClose();
    } catch (err) {
      throw err;
    }
  };

  const doUpdate = async () => {
    try {
      await updateSet(setName, editorState.songs);
      didUpdated = true;
    } catch (err) {
      throw err;
    }
  };

  const doRefresh = async () => {
    try {
      setDstate({ data: null, isLoading: true, error: null });
      const res = await getSet(setName);
      setDstate({ data: res, isLoading: false, error: null });
      savedData = res;
      fetchTS = Date.now();
      // console.log("Read set after update: ", res);
    } catch (err) {
      throw err;
    }
  };

  const handleClearAll = () => {
    saveEditState({
      ...editorState,
      songs: [],
      setInUseMap: [],
      changed: true,
    });
    setEditorState(savedEditorState);
  };

  useEffect(() => {
    // this will be called on start as well as window resize so we optimize
    // for min i/o and state's maintenance across internal & external changes
    if (!fetchTS) {
      getSet(setName)
        .then((res) => {
          setDstate({ data: res, isLoading: false, error: null });
          fetchTS = Date.now();
          savedData = res;
        })
        .catch((err) =>
          setDstate({ data: null, isLoading: false, error: err })
        );
    } else {
      // data should already been init with savedData at start of function
      // restore edit state from saved copy
      setEditorState(savedEditorState);
    }
  }, [setName]);

  console.log("--- EditSetContent");

  if (dstate.isLoading) {
    return (
      <Dimmer active>
        <Loader size="big" inverted>
          Reading/updating set content ...
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

  if (dstate.data) {
    if (!editorState.createdAt) {
      // editor state needs initializing
      editorState.songs = dstate.data.songs;
      editorState.createdAt = dstate.data.createdAt;

      editorState.songs?.forEach((e, idx) => {
        editorState.setInUseMap.push(
          editorState.setUseList.findIndex((s) => s.title === e.title)
        );
      });
      saveEditState(editorState);
    }
  }

  return (
    <>
      <PromptConfirm
        open={nosavePromptOpen}
        text="Changes to set have not been saved.  Exit anyway?"
        noHdlr={() => setNosavePromptOpen(false)}
        yesHdlr={handleClose}
      />
      <Grid>
        <Grid.Row>
          <Grid.Column width={12}>
            <Button
              basic
              icon="cancel"
              color={editorState.changed ? "pink" : "black"}
              // floated="left"
              content="Exit"
              onClick={() =>
                editorState.changed ? setNosavePromptOpen(true) : handleClose()
              }
            />
            <Button
              basic
              icon="save"
              disabled={!editorState.changed}
              color={"blue"}
              // floated="left"
              content="Save"
              onClick={handleSave}
            />
            <Button
              basic
              icon="save"
              disabled={!editorState.changed}
              color={"blue"}
              // floated="left"
              content="Save &amp; Close"
              onClick={handleSaveClose}
            />
          </Grid.Column>
          <Grid.Column width={4} textAlign="right">
            First created on: <br />
            {moment(editorState.createdAt).format("ll")}
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <br></br>

      <Grid columns={2}>
        <Grid.Row style={{ marginBottom: 0, paddingBottom: 2 }}>
          <Grid.Column stretched width={8}>
            <SetChoices es={editorState} esm={setEditorState} base={bset} />
          </Grid.Column>
          <Grid.Column width={8}>
            <Label color="green" size="large">
              Set:{" "}
            </Label>
            <span className="set-name-style">
              &nbsp;&nbsp;{editorState.setName}&nbsp;&nbsp;
            </span>
            <Button
              basic
              floated="right"
              color="red"
              disabled={!editorState.songs?.length}
              onClick={handleClearAll}
            >
              Clear all songs
            </Button>
          </Grid.Column>
        </Grid.Row>
        <Divider style={{ marginBottom: -5, paddingBottom: 0 }} />
        <Grid.Row>
          <Grid.Column stretched width={8}>
            <Container style={{ height: "70vh", overflowY: "scroll" }}>
              <LangSetList es={editorState} esm={setEditorState} />
            </Container>
          </Grid.Column>
          <Grid.Column>
            <Container style={{ height: "70vh", overflowY: "scroll" }}>
              <SetList es={editorState} esm={setEditorState} />
            </Container>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  );
}
