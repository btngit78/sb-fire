import React, { useContext, useState, useEffect } from "react";
import {
  Container,
  Dimmer,
  Loader,
  Message,
  Table,
  Icon,
  Button,
  Modal,
  Header,
  Segment,
  Grid,
} from "semantic-ui-react";

import { SongContext, updateOrAddSetToDB } from "../contexts/StoreContext";
import { getRecentAdditions, addSet, updateSet } from "../contexts/StoreAPI";
import { useAuth } from "../contexts/AuthContext";
import { DatabaseErrorMsg } from "./Song";

import moment from "moment";

let savedData = null;
let fetchTS = null;
let didUpdated = false;

export function RecentlyAddedDisplay(props) {
  const closeHandler = props.closeHandler;

  console.log("--- RecentlyAddedDisplay");
  const { hasWritePrivilege } = useAuth();
  const [state, dispatch] = useContext(SongContext);
  const [resyncModalOpen, setResyncModalOpen] = useState(false);
  let inMemDBIsCurrent = false;
  let newCount = 0;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    const tmp = didUpdated;
    didUpdated = false;
    closeHandler(tmp);
  };

  const refetchData = () => {
    // trigger redraw and refetch
    setData(null);
    fetchTS = null;
    fetchData(fetchTS);
  };

  const fetchData = async (ts) => {
    if (fetchTS !== null && ts === fetchTS) {
      // simply use saved data
      setData(savedData);
      return;
    }

    try {
      console.log("Reading [ recent additions ]");
      fetchTS = Date.now();
      setIsLoading(true);
      const res = await getRecentAdditions();
      setData(res);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(fetchTS);
  }, []);

  const handleSelection = (ev) => {
    const id = ev.currentTarget.id;
    const mra = data.songs;
    if (mra && mra.length) {
      // const entry = mra.filter((e) => e.title === name);
      const entry = mra[id];
      const songList = state.store.songSets.get(entry.language);
      const sle = songList.findIndex((e) => e.title === entry.title);
      if (!songList || sle < 0) {
        // either set or song is not in the store,
        // list created is outdated, need to refresh
        setResyncModalOpen(true);
        return;
      }
      dispatch({
        type: "selectSongByTitle",
        payload: { language: entry.language, title: entry.title },
      });
      handleClose();
    }
  };

  const saveToSet = async () => {
    const doSubmit = async () => {
      const songs = [];
      const setName = "Most Recent 20";
      let msg;

      if (!data || !data.songs || !data.songs.length) return;

      data.songs.forEach((e, idx) => {
        if (idx < 20)
          songs.push({
            title: e.title,
            language: e.language,
            toKey: e.key,
            toTempo: e.tempo,
          });
      });

      try {
        // update if set already created before, add it if not
        const fidx = state.store.setChoiceOptions.findIndex(
          (e) => e.text === setName
        );
        const res =
          fidx >= 0
            ? await updateSet(setName, songs)
            : await addSet(setName, songs);

        if (res) {
          msg =
            setName +
            " has been " +
            (fidx >= 0 ? "updated" : "added") +
            " successfully.";

          updateOrAddSetToDB(state, setName, songs, fidx, Date.now());
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

  if (isLoading)
    return (
      <div>
        {/* using br to space apart spinner from title */}
        <Segment>
          <br />
          <br />
          <br />
          <br />
          <br />
        </Segment>
        <Dimmer active>
          <Loader size="big" inverted>
            Fetching updates from database ...
          </Loader>
        </Dimmer>
      </div>
    );

  if (error) {
    return <DatabaseErrorMsg mesg={error.message} />;
  }

  if (!data || !data.songs || !data.songs.length) {
    return (
      <Message icon negative size="big">
        <Icon name="database" />
        <Message.Content>
          Unexpected error condition. Try refesh the app.
        </Message.Content>
      </Message>
    );
  } else savedData = data; // save it for re-use later

  inMemDBIsCurrent =
    moment(state.store.timeInit).diff(data.songs[0].createdAt) > 0;
  for (var i = 0; i < data.songs.length; i++) {
    if (moment(state.store.timeInit).diff(data.songs[i].createdAt) < 0)
      newCount++;
  }

  return (
    <>
      <Container textAlign="left">
        <Grid>
          <Grid.Row columns={1}>
            <Grid.Column width={16}>
              <Button
                basic
                content={inMemDBIsCurrent ? "Refetch query" : "Reload app"}
                icon="redo"
                color="pink"
                onClick={() => {
                  inMemDBIsCurrent ? refetchData() : window.location.reload();
                }}
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
                icon="save"
                color="blue"
                content="Create Recent Top 20 set"
                disabled={!hasWritePrivilege()}
                onClick={hasWritePrivilege() ? saveToSet : null}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row
            style={{ marginTop: "0px", marginBottom: "5px", padding: "3px" }}
          >
            <Grid.Column width={16}>
              {!inMemDBIsCurrent ? (
                <span>
                  {newCount} new song{newCount > 1 ? "s" : ""} have been added
                  since last synced on:{" "}
                  {moment(state.store.timeInit).format("LLL")}
                </span>
              ) : (
                <span>List was created: {moment(fetchTS).fromNow()}</span>
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
      <br />
      <Container style={{ maxHeight: "75vh", overflowY: "scroll" }}>
        <Table striped fixed selectable size="large">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell collapsing width={1}>
                No.
              </Table.HeaderCell>
              <Table.HeaderCell width={2}>Time added</Table.HeaderCell>
              <Table.HeaderCell width={5}>Title</Table.HeaderCell>
              <Table.HeaderCell width={4}>Authors</Table.HeaderCell>
              <Table.HeaderCell width={1}>Language</Table.HeaderCell>
              <Table.HeaderCell width={2}>Keywords</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {data.songs.length
              ? data.songs.map((entry, idx) => (
                  <React.Fragment key={idx}>
                    <Table.Row>
                      <Table.Cell collapsing>{idx + 1}.</Table.Cell>
                      <Table.Cell>
                        {moment(entry.createdAt).fromNow()}
                      </Table.Cell>
                      <Table.Cell>
                        <Button id={idx} icon compact onClick={handleSelection}>
                          <Icon name="play" size="small" />
                        </Button>
                        &nbsp;&nbsp;
                        <span
                          id={idx}
                          style={{ cursor: "pointer" }}
                          onClick={handleSelection}
                        >
                          <b>{entry.title}</b>
                        </span>
                      </Table.Cell>
                      <Table.Cell>{entry.authors}</Table.Cell>
                      <Table.Cell>{entry.language}</Table.Cell>
                      <Table.Cell>{entry.keywords}</Table.Cell>
                    </Table.Row>
                  </React.Fragment>
                ))
              : null}
          </Table.Body>
        </Table>
        <Modal centered={true} size="small" open={resyncModalOpen}>
          <Header
            icon="archive"
            content="Database and directory not in sync!"
            color="orange"
          />
          <Modal.Content>
            <Header size="small">
              The song selected was not found locally. It appears that the
              current directory of song sets and the cloud database is not in
              sync. Some songs may have been added while others deleted.
            </Header>
            <Header size="small">
              Do you want to refesh the app now? (You may reload the app
              directly on this browser's refresh button later, or click
              'Refresh' to reload the directory now.)
            </Header>
          </Modal.Content>
          <Modal.Actions>
            <Button basic color="red" onClick={() => setResyncModalOpen(false)}>
              <Icon name="remove" /> Later
            </Button>
            <Button basic color="blue" onClick={() => window.location.reload()}>
              <Icon name="checkmark" /> Refresh
            </Button>
          </Modal.Actions>
        </Modal>
      </Container>
    </>
  );
}
