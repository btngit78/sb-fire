import React, { useContext, useState, useRef } from "react";
import { Container, Table, Icon, Button, Dropdown } from "semantic-ui-react";

import { SongContext, addNewSetToDB } from "../contexts/StoreContext";
import { addSet } from "../contexts/StoreAPI";
import { useAuth } from "../contexts/AuthContext";
import { PromptModal } from "./Prompt";

let didUpdated = false;

export function SearchDisplay(props) {
  const closeHandler = props.closeHandler;

  console.log("--- SearchDisplay");
  const { isPremium, userId, hasWritePrivilege } = useAuth();
  const [state, dispatch] = useContext(SongContext);
  const [authChoices, setAuthChoices] = useState(
    state.store.lastAuthorsSelected ? state.store.lastAuthorsSelected : []
  );
  const [authorSearchRes, setAuthorSearchRes] = useState([]);
  const [reInitRes, setReInitRes] = useState(
    authChoices != null && !authorSearchRes.length
  );
  const [selClose, setSelClose] = useState(true);
  const [authorSelOptions] = useState(() => {
    // TBD: should handle cases where songList in store is updated via other queries
    const opts = [];
    for (let entry of state.store.authorsOptions.keys()) {
      opts.push({
        key: entry.toLocaleLowerCase(),
        value: entry,
        text: entry,
      });
    }
    opts.sort((a, b) => a.text.localeCompare(b.text));
    return opts;
  });
  const resSetName = useRef();
  const [promptOpen, setPromptOpen] = useState(false);
  let cumIdx = 0;

  const handleClose = () => {
    const tmp = didUpdated;
    didUpdated = false;
    closeHandler(tmp);
  };

  const handleSongChoice = (ev) => {
    ev.preventDefault();
    let ss = ev.currentTarget.id.split("-");

    dispatch({
      type: "selectSongByTitle",
      payload: { language: ss[0], title: ss[1] },
    });
    handleClose();
  };

  const handleReset = () => {
    setAuthChoices([]);
    setAuthorSearchRes([]);
    state.store.lastAuthorsSelected = null;
  };

  const handleSearch = () => {
    const apl = new Map();
    const tempRes = [];

    // build author list per language
    authChoices.forEach((auth) => {
      const lang = state.store.authorsOptions.get(auth);
      if (!apl.has(lang)) {
        apl.set(lang, [auth]);
      } else {
        const cur = apl.get(lang);
        apl.set(lang, [...cur, auth]);
      }
    });

    // search songlist for matching author(s)
    apl.forEach((values, key) => {
      let searchRegExp = new RegExp(values.join("|"), "i");
      const songList = state.store.songSets.get(key);
      let res = songList
        .filter((se) => se.authors.match(searchRegExp))
        .sort((a, b) => a.authors.localeCompare(b.authors));
      tempRes.push(res);
    });
    // console.log(tempRes);
    setAuthorSearchRes(tempRes);
    setSelClose(true);
    state.store.lastAuthorsSelected = authChoices;
  };

  const doPromptClose = () => {
    if (resSetName.current) resSetName.current.value = "";
    setPromptOpen(false);
  };

  const doPromptSubmit = async () => {
    setPromptOpen(false);

    const doSubmit = async () => {
      const songs = [];
      const setName = resSetName.current.value;
      let msg;

      authorSearchRes.flat().forEach((e) =>
        songs.push({
          title: e.title,
          language: e.language,
          toKey: e.key,
          toTempo: e.tempo,
        })
      );

      // should verify setname validity
      try {
        if (await addSet(setName, songs, isPremium ? userId : null)) {
          msg = setName + " has been added successfully.";
          addNewSetToDB(
            state,
            setName,
            songs,
            Date.now(),
            isPremium ? userId : null
          );
          didUpdated = true;
        }
      } catch (err) {
        msg = err.message;
      }
      return msg;
    };

    const msg = await doSubmit();
    alert(msg);
  };

  const saveToSet = () => {
    setPromptOpen(true);
    // submit enter or click ok will do the save
  };

  // =================== start of searchDisplay ================== //
  if (reInitRes) {
    // rebuild last search once if author choices was indeed saved
    handleSearch();
    setReInitRes(false);
  }

  return (
    <Container textAlign="left">
      <PromptModal
        open={promptOpen}
        inputRef={resSetName}
        fieldLabel="New set name:"
        closeHdlr={doPromptClose}
        submitHdlr={doPromptSubmit}
      />
      <Container>
        <Button
          basic
          icon="cancel"
          color="black"
          content="Reset"
          onClick={handleReset}
        />
        <Button
          basic
          icon="checkmark"
          color="green"
          content="Close screen"
          onClick={handleClose}
        />
        <Button
          basic
          icon="list ol"
          color="blue"
          disabled={!authChoices.length}
          content="Show results"
          onClick={handleSearch}
        />
        <Button
          basic
          icon="save"
          disabled={!hasWritePrivilege(userId) || !authorSearchRes.length}
          color="blue"
          content="Save result to a set"
          onClick={
            !hasWritePrivilege(userId) || !authorSearchRes.length
              ? null
              : saveToSet
          }
        />
      </Container>

      <br />

      <Dropdown
        deburr
        placeholder="(select on or more authors from this list to search)"
        onClick={() => setSelClose(false)}
        fluid
        search
        multiple
        selection
        open={!selClose}
        value={authChoices}
        options={authorSelOptions}
        onChange={(ev, data) => {
          if (ev.type === "keydown" && ev.key === "Enter") {
            handleSearch();
          } else setAuthChoices(data.value);
        }}
      />
      <br />
      <Container style={{ maxHeight: "70vh", overflowY: "scroll" }}>
        <Table striped fixed selectable size="large">
          <Table.Header>
            {authorSearchRes.length ? (
              <Table.Row>
                <Table.HeaderCell collapsing width={2}>
                  No.
                </Table.HeaderCell>
                <Table.HeaderCell width={4}>Authors</Table.HeaderCell>
                <Table.HeaderCell>Title</Table.HeaderCell>
                <Table.HeaderCell width={4}>Keywords</Table.HeaderCell>
              </Table.Row>
            ) : (
              <Table.Row>
                <Table.HeaderCell>(Result will be shown here)</Table.HeaderCell>
              </Table.Row>
            )}
          </Table.Header>

          <Table.Body>
            {authorSearchRes.length
              ? authorSearchRes.map((langlist, lindex, asr) => {
                  if (lindex > 0) cumIdx = cumIdx + asr[lindex - 1].length;
                  return langlist.map((entry, index) => (
                    <React.Fragment key={entry.idx}>
                      <Table.Row>
                        <Table.Cell collapsing>
                          {index + 1 + cumIdx}.
                        </Table.Cell>
                        <Table.Cell>{entry.authors}</Table.Cell>
                        <Table.Cell>
                          <Button
                            id={entry.language + "-" + entry.title}
                            icon
                            compact
                            onClick={handleSongChoice}
                          >
                            <Icon name="play" size="small" />
                          </Button>
                          &nbsp;&nbsp;
                          <span
                            id={entry.language + "-" + entry.title}
                            // data-lang={entry.language}   -- can't use data-; apparently not supported by react
                            // data-song={entry.title}
                            style={{ cursor: "pointer" }}
                            onClick={handleSongChoice}
                          >
                            <b>{entry.title}</b>
                          </span>
                        </Table.Cell>
                        <Table.Cell>{entry.keywords}</Table.Cell>
                      </Table.Row>
                    </React.Fragment>
                  ));
                })
              : null}
          </Table.Body>
        </Table>
      </Container>
    </Container>
  );
}
