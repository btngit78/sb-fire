import React, { useState, useContext } from "react";

import {
  Dimmer,
  Loader,
  Button,
  Input,
  Table,
  Header,
  Grid,
  Divider,
  Container,
  Icon,
} from "semantic-ui-react";

import moment from "moment";

import { DatabaseErrorMsg } from "./Song";

import { SongContext, populateUserSetsDB } from "../contexts/StoreContext";
import {
  addSet,
  deleteSet,
  getAllSets,
  DEFAULT_SET,
} from "../contexts/StoreAPI";

import { useAuth } from "../contexts/AuthContext";

export function EditSet({ closeHandler, editHandler, hadUpdated }) {
  const [state, dispatch] = useContext(SongContext);
  const [data, setData] = useState(state.store.userSets);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newSet, setNewSet] = useState("");
  const [curDeleted, setCurDeleted] = useState(null);
  const [reloaded, setReloaded] = useState(!hadUpdated);
  const { isPremium, userId, hasWritePrivilege } = useAuth();
  const [editSetname, setEditSetname] = useState("");

  const handleClose = () => {
    if (curDeleted) {
      alert(
        `The set named "${curDeleted}" in use was deleted.
The "${DEFAULT_SET}" language set will be selected as the default.`
      );
      dispatch({ type: "selectSet", payload: DEFAULT_SET });
    }
    closeHandler();
  };

  const reloadData = async (ts) => {
    try {
      console.log("Reading [ all sets ]");
      setIsLoading(true);
      const res = await getAllSets();
      setData(res);
      populateUserSetsDB(res, state);

      // reload needed only because setEditor signaled changes;
      // dispatch if song selected was deleted user set
      if (editSetname && editSetname === state.setName) {
        if (
          state.store.songChoiceOptions[editSetname].findIndex(
            (e) => e.text === state.songName
          ) < 0
        ) {
          // song was removed from selected set, select set to default to first song in set
          dispatch({ type: "selectSet", payload: editSetname });
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (newSet === null || !newSet.length) return;

    try {
      isPremium ? await addSet(newSet, [], userId) : addSet(newSet);
    } catch (err) {
      alert(err.message);
    } finally {
      setNewSet("");
      reloadData();
    }
  };

  const handleEdit = (title) => {
    setEditSetname(title);
    editHandler(title);
  };

  const handleDelete = async (title) => {
    if (!title) return;

    try {
      await deleteSet(title);
    } catch (err) {
      alert(err.message);
    } finally {
      setCurDeleted(title === state.setName ? title : null);
      reloadData();
    }
  };

  console.log("--- EditSet");

  if (!reloaded) {
    reloadData();
    setReloaded(true);
  }

  if (isLoading) {
    return (
      <Dimmer active>
        <Loader size="big" inverted>
          Resyncing sets ...
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
      <Container>
        <Grid>
          <Grid.Row>
            <Grid.Column width={4}>
              <Button
                basic
                icon="checkmark"
                color="green"
                content="Close screen"
                floated="left"
                onClick={handleClose}
              />
            </Grid.Column>
            <Grid.Column width={8}>
              <Input
                fluid
                value={newSet}
                placeholder="(enter new set name)"
                onChange={(ev, data) => {
                  setNewSet(data.value);
                }}
              />
              &nbsp;Use any characters except for double quotes ("") or single
              quotes ('').
            </Grid.Column>
            <Grid.Column width={4}>
              <Button
                basic
                size="small"
                color="blue"
                floated="left"
                content="Add new set"
                onClick={handleAdd}
              />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
      <br />
      <Container style={{ maxHeight: "70vh", overflowY: "scroll" }}>
        {data && data.sets.length ? (
          <Table fixed selectable size="large">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell width={4}></Table.HeaderCell>
                <Table.HeaderCell>Name </Table.HeaderCell>
                <Table.HeaderCell width={2}>Song count</Table.HeaderCell>
                <Table.HeaderCell width={4}>Last updated</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {data.sets.map((entry, idx) => (
                <React.Fragment key={idx}>
                  <Table.Row>
                    <Table.Cell textAlign="center">
                      <Button
                        basic
                        size="tiny"
                        color="red"
                        disabled={!hasWritePrivilege(entry.userId)}
                        onClick={
                          hasWritePrivilege(entry.userId)
                            ? () => handleDelete(entry.title)
                            : null
                        }
                      >
                        Delete
                      </Button>
                      <Button
                        basic
                        size="tiny"
                        color="blue"
                        disabled={!hasWritePrivilege(entry.userId)}
                        onClick={
                          hasWritePrivilege(entry.userId)
                            ? () => handleEdit(entry.title)
                            : null
                        }
                      >
                        Edit
                      </Button>
                    </Table.Cell>
                    <Table.Cell>
                      {entry.songs?.length ? (
                        <span
                          className="set-name-style"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            dispatch({
                              type: "selectSet",
                              payload: entry.title,
                            });
                            closeHandler();
                          }}
                        >
                          {entry.title}&nbsp;&nbsp;&nbsp;
                          {entry.title === state.setName ? (
                            <Icon name="music" />
                          ) : null}
                        </span>
                      ) : (
                        <span className="set-name-style">{entry.title}</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>{entry.songs?.length}</Table.Cell>
                    <Table.Cell>{moment(entry.updatedAt).fromNow()}</Table.Cell>
                  </Table.Row>
                </React.Fragment>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <>
            <Divider />
            <Header size="small" textAlign="center">
              No song set has been created yet.
            </Header>
          </>
        )}
      </Container>
    </>
  );
}
