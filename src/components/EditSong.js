import React, { useState, useContext } from "react";
import {
  Dimmer,
  Loader,
  Button,
  TextArea,
  Grid,
  Input,
  Form,
  Message,
} from "semantic-ui-react";
import { DatabaseErrorMsg } from "./Song";
import { generateTextFormatForCurrentState } from "./SongBody";

import { SongContext } from "../contexts/StoreContext";
import { getSong, updateSong } from "../contexts/StoreAPI";
import { PromptConfirm } from "./Prompt";
import { errorInSongFields } from "../lib/utils";

export function EditSongDisplay({ closeHandler }) {
  console.log("--- EditSongDisplay");

  const [state, dispatch] = useContext(SongContext);
  // the fields below are not alterable; song must be deleted to add anew
  // const songId = state.songId;
  const title = state.songName;
  // const songLanguage = state.songLanguage;

  const [alreadyModified, setAlreadyMod] = useState(
    ((!state.noChords || state.songKey !== "") && state.chordOff) ||
      state.songKey !== state.songToKey
  );
  // modifiable fields
  const [authors, setAuthors] = useState(state.songAuthors);
  const [key, setKey] = useState(
    alreadyModified ? (state.chordOff ? "" : state.songToKey) : state.songKey
  );
  const [keywords, setKeywords] = useState(state.songKeywords);
  const [tempo, setTempo] = useState(state.songTempo);
  // effected fields from transpose or chordoff
  const [content, setContent] = useState(
    alreadyModified
      ? generateTextFormatForCurrentState(state)
      : state.songContent
  );

  // edit states tracking
  const [changed, setChanged] = useState(alreadyModified);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [nosavePromptOpen, setNosavePromptOpen] = useState(false);

  const doClose = () => {
    closeHandler();
  };

  const handleCancel = () => {
    if (changed)
      // change was made; confirm to exit
      setNosavePromptOpen(true);
    else doClose();
  };

  const handleSave = () => {
    if (changed) doUpdate();
  };

  const handleSaveClose = () => {
    if (changed) {
      doUpdate().then((done) => {
        if (done) doClose();
      });
    }
  };

  const handleChange = (CB, val) => {
    CB(val);
    setChanged(true);
  };

  const doUpdate = async () => {
    let done = false;

    if (changed) {
      const data = {
        title: title,
        // id: songId,                no longer instrinsic property of song record
        // language: songLanguage,    not updateable; only thru addition
        authors: authors.trim(),
        key: key.trim(),
        keywords: keywords.trim(),
        tempo: tempo ? parseInt(tempo, 10) : 0,
        content: content,
      };
      let errmsg = errorInSongFields(data);
      if (errmsg !== null) {
        alert(errmsg);
        return done;
      }

      try {
        setIsLoading(true);
        if (await updateSong(data)) {
          // console.log("update successful: ", { data });
          setAlreadyMod(false); // no longer true since it's now saved
          setChanged(false);

          // update store, read from DB to get updated timestamp and verify values
          const rec = await getSong(title);
          // console.log("Enter: ", { data }, " Recall: ", { rec });
          if (
            data.authors !== rec.authors ||
            data.key !== rec.key ||
            data.keywords !== rec.keywords ||
            data.content !== rec.content ||
            data.tempo !== rec.tempo
          )
            console.log("=== recall not same as written ===");
          rec.title = title;

          dispatch({ type: "syncAfterEdit", payload: rec });
          done = true;
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
      return done;
    }
  };

  if (isLoading) {
    return (
      <Dimmer active>
        <Loader size="big" inverted>
          Resyncing song ...
        </Loader>
      </Dimmer>
    );
  }

  if (error)
    return (
      <DatabaseErrorMsg mesg={error.message} exitHdlr={() => closeHandler()} />
    );

  return (
    <>
      <PromptConfirm
        open={nosavePromptOpen}
        text="Changes have not been saved.&nbsp;&nbsp;Exit anyway?"
        noHdlr={() => setNosavePromptOpen(false)}
        yesHdlr={doClose}
      />

      {alreadyModified ? (
        <Message info>
          <Message.Header>Preset modified content!</Message.Header>
          <p>
            The song content shown below reflects either a condition where all
            chords have been removed or transposed to the key selected. If this
            is not what's desired, simply go back and reset to the condition
            desired and enter edit mode again.
          </p>
        </Message>
      ) : null}
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
          <Form.Field width={7}>
            <b>Authors</b>
            <br />
            <Input
              fluid
              value={authors}
              onChange={(ev, data) => handleChange(setAuthors, data.value)}
            />
          </Form.Field>
          <Form.Field width={2}>
            <b>Key</b>
            <br />
            <Input
              fluid
              value={key}
              onChange={(ev, data) => handleChange(setKey, data.value)}
            />
          </Form.Field>
          <Form.Field width={5}>
            <b>Keywords</b>
            <br />
            <Input
              fluid
              value={keywords}
              onChange={(ev, data) => handleChange(setKeywords, data.value)}
            />
          </Form.Field>
          <Form.Field width={2}>
            <b>Tempo</b>
            <br />
            <Input
              fluid
              value={tempo}
              onChange={(ev, data) => handleChange(setTempo, data.value)}
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
            value={content}
            onChange={(ev, data) => handleChange(setContent, data.value)}
          />
        </Form.Field>
      </Form>
    </>
  );
}
