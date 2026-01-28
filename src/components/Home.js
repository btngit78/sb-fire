// Copyright 2019 by Nghia Nguyen
//
import React, { useState, useRef, useEffect, useContext } from "react";
import {
  Sidebar,
  Divider,
  Menu,
  Icon,
  Dropdown,
  List,
  Button,
  Label,
  Checkbox,
  Modal,
} from "semantic-ui-react";
import SongDisplay from "./Song";
import { RecentlyAddedDisplay } from "./Recents";
import { SearchDisplay } from "./SearchByAuthor";
import { EditSongDisplay } from "./EditSong";
import { AddSongDisplay } from "./AddSong";
import { SetSelect } from "./SetSelect";
import { EditSet } from "./EditSet";
import { EditSetContent } from "./EditSetContent";
// import Settings from "./Settings";
import { useHistory } from "react-router-dom";
import { PromptModal, PromptConfirm, PromptForSetModal } from "./Prompt";

import { setStyle } from "../lib/styling";
import { MIN_WIDTH, PREF_WIDTH } from "../lib/utils";
import "../app.css";

import {
  SongContext,
  updateUserSetDB,
  deleteEntryInStore,
  addNewSetToDB,
  // SongProvider,
} from "../contexts/StoreContext";
import {
  deleteSong,
  addSet,
  updateSetField,
  DEFAULT_SET,
} from "../contexts/StoreAPI";
import { useAuth } from "../contexts/AuthContext";

function getKeyForSelectControl(actualKey) {
  if (!actualKey) return "C"; // default
  return actualKey;
}

// set side effects from window width change
// return the width
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setStyle();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });
  return width;
}

function Home() {
  const width = useWindowWidth();
  const { isAdmin, isPremium, email, userId, hasWritePrivilege, logout } =
    useAuth();
  const [state, dispatch] = useContext(SongContext);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [setSelectModalOpen, setSetSelectModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [updatesModalOpen, setUpdatesModalOpen] = useState(false);
  const [editSongModalOpen, setEditSongModalOpen] = useState(false);
  const [addSongModalOpen, setAddSongModalOpen] = useState(false);
  const [editSetModalOpen, setEditSetModalOpen] = useState(false);
  const [editSetContentModalOpen, setEditSetContentModalOpen] = useState(false);
  const [setNameToEdit, setSetNameToEdit] = useState("");
  const [setContentUpdated, setSetContentUpdated] = useState(false);
  const [promptForSetModalOpen, setPromptForSetModalOpen] = useState(false);
  const [defaultFavSet, setDefaultFavSet] = useState("");
  const [delConfirmOpen, setDelConfirmOpen] = useState(false);
  const history = useHistory();

  console.log("--- Home");
  setStyle();

  const modalWidthPercent = (pct) => {
    // default 90% width for smaller than a tablet
    if (width <= PREF_WIDTH) return pct ? pct.toString() + "%" : "90%";

    return (
      Math.max(
        pct
          ? pct
          : Math.floor((PREF_WIDTH * 100 + (width - PREF_WIDTH) * 30) / width)
      ).toString() + "%"
    );
  };

  const handleSidebarVisible = (e, obj) => {
    setSidebarVisible(true);
  };

  const handleSidebarHide = (e, obj) => {
    setSidebarVisible(false);
  };

  const handleUpKey = (currentKey) => {
    let minor = currentKey.endsWith("m");
    if (minor) currentKey = currentKey.split("m")[0];

    if (currentKey.length === 1) {
      //  no sharp or flat
      currentKey =
        currentKey === "E" ? "F" : currentKey === "B" ? "C" : currentKey + "#";
    } else {
      // sharp and flat
      currentKey =
        currentKey.charAt(1) === "b"
          ? currentKey.charAt(0)
          : currentKey.charAt(0) === "G"
          ? "A"
          : String.fromCharCode(currentKey.charCodeAt(0) + 1);
    }
    return currentKey + (minor ? "m" : "");
  };

  const handleDownKey = (currentKey) => {
    let minor = currentKey.endsWith("m");
    if (minor) currentKey = currentKey.split("m")[0];

    if (currentKey.length === 1) {
      //  no sharp or flat
      currentKey =
        currentKey === "C" ? "B" : currentKey === "F" ? "E" : currentKey + "b";
    } else {
      // sharp and flat
      currentKey =
        currentKey.charAt(1) === "#"
          ? currentKey.charAt(0)
          : currentKey.charAt(0) === "A"
          ? "G"
          : String.fromCharCode(currentKey.charCodeAt(0) - 1);
    }
    return currentKey + (minor ? "m" : "");
  };

  const handleImport = (e, obj) => {
    alert("will do import later");
    handleSidebarHide();
  };

  // const handleSettings = (e, obj) => {
  //   alert("will do settings later");;
  //   handleSidebarHide();
  // };

  const handleLogout = (e, obj) => {
    logout();
    handleSidebarHide();
  };

  const handleSet = (e, obj) => {
    setSetSelectModalOpen(true);
    handleSidebarHide();
  };

  const SetSelectModal = () => {
    console.log("--- SetSelectModal");
    const handleClose = () => {
      setSetSelectModalOpen(false);
    };

    return (
      <Modal
        open={setSelectModalOpen}
        centered={false}
        style={{ width: modalWidthPercent(), maxHeight: "95vh" }}
      >
        <Modal.Header style={{ backgroundColor: "#cbe6d9" }}>
          Select song set
        </Modal.Header>
        <Modal.Content
          style={{
            textAlign: "center",
          }}
        >
          <SetSelect closeHandler={handleClose} />
        </Modal.Content>
      </Modal>
    );
  };

  const handleSearch = (e, obj) => {
    setSearchModalOpen(true);
    handleSidebarHide();
  };

  const SearchModal = () => {
    console.log("--- SearchModal");
    const handleClose = (didUpdate) => {
      setSearchModalOpen(false);
      setSetContentUpdated(didUpdate);
    };

    return (
      <Modal
        open={searchModalOpen}
        onClose={handleClose}
        centered={false}
        closeOnEscape={false}
        closeOnDimmerClick={false}
        style={{ width: modalWidthPercent(), maxHeight: "95vh" }}
      >
        <Modal.Header style={{ backgroundColor: "#cbe6d9" }}>
          Search for songs by author
        </Modal.Header>
        <Modal.Content style={{ textAlign: "center", minHeight: "50vh" }}>
          <SearchDisplay closeHandler={handleClose} />
        </Modal.Content>
      </Modal>
    );
  };

  const handleUpdates = (e, obj) => {
    setUpdatesModalOpen(true);
    handleSidebarHide();
  };

  const UpdatesModal = () => {
    console.log("--- UpdatesModal");

    const handleClose = (didUpdate) => {
      setUpdatesModalOpen(false);
      setSetContentUpdated(didUpdate);
    };

    return (
      <Modal
        open={updatesModalOpen}
        onClose={handleClose}
        centered={false}
        closeOnEscape={false}
        closeOnDimmerClick={false}
        style={{ width: modalWidthPercent(), maxHeight: "95vh" }}
      >
        <Modal.Header style={{ backgroundColor: "#cbe6d9" }}>
          50 Most Recently Added Songs
        </Modal.Header>
        <Modal.Content style={{ textAlign: "center" }}>
          <RecentlyAddedDisplay closeHandler={handleClose} />
        </Modal.Content>
      </Modal>
    );
  };

  const handleEditSong = (e, obj) => {
    if (!hasWritePrivilege(userId)) {
      alert("This feature is not available for user.");
    } else {
      setEditSongModalOpen(true);
    }
    handleSidebarHide();
  };

  const EditSongModal = () => {
    console.log("--- EditSongModal");
    const [state] = useContext(SongContext);

    const handleClose = (hadUpdated) => {
      setEditSongModalOpen(false);
    };

    return (
      <Modal
        open={editSongModalOpen}
        // onClose={handleClose}
        centered={false}
        closeOnEscape={false}
        closeOnDimmerClick={false}
        style={{ width: modalWidthPercent() }}
      >
        <Modal.Header style={{ backgroundColor: "#cbe6d9" }}>
          Edit Song:&nbsp;&nbsp;&nbsp;{state.songName}
        </Modal.Header>
        <Modal.Content style={{ textAlign: "left" }}>
          <EditSongDisplay closeHandler={handleClose} />
        </Modal.Content>
      </Modal>
    );
  };

  const handleAddSong = (e, obj) => {
    if (!hasWritePrivilege(userId)) {
      alert("This feature is not available for user.");
    } else {
      setAddSongModalOpen(true);
    }
    handleSidebarHide();
  };

  const AddSongModal = () => {
    console.log("--- AddSongModal");

    const handleClose = () => {
      setAddSongModalOpen(false);
    };

    return (
      <Modal
        open={addSongModalOpen}
        centered={false}
        closeOnEscape={false}
        closeOnDimmerClick={false}
        style={{ width: modalWidthPercent() }}
      >
        <Modal.Header style={{ backgroundColor: "#cbe6d9" }}>
          Add a New Song
        </Modal.Header>
        <Modal.Content style={{ textAlign: "left" }}>
          <AddSongDisplay closeHandler={handleClose} />
        </Modal.Content>
      </Modal>
    );
  };

  const handleEditSet = (e, obj) => {
    if (!hasWritePrivilege(userId)) {
      alert("This feature is not available for user.");
    } else {
      setEditSetModalOpen(true);
    }
    handleSidebarHide();
  };

  const EditSetModal = () => {
    console.log("--- EditSetModal");
    // const [state] = useContext(SongContext);

    const handleClose = () => {
      setEditSetModalOpen(false);
    };

    const handleEditSetContent = (setName) => {
      setEditSetModalOpen(false);
      setSetNameToEdit(setName);
      if (hasWritePrivilege(userId)) setEditSetContentModalOpen(true);
    };

    return (
      <Modal
        open={editSetModalOpen}
        centered={false}
        closeOnEscape={false}
        closeOnDimmerClick={false}
        style={{ width: modalWidthPercent(), maxHeight: "95vh" }}
      >
        <Modal.Header style={{ backgroundColor: "#cbe6d9" }}>
          Edit/Delete Sets
        </Modal.Header>
        <Modal.Content style={{ textAlign: "left" }}>
          <EditSet
            closeHandler={handleClose}
            editHandler={handleEditSetContent}
            hadUpdated={setContentUpdated}
          />
        </Modal.Content>
      </Modal>
    );
  };

  const handleDeleteSong = () => {
    if (!hasWritePrivilege(userId)) {
      alert("This feature is not available for user.");
      return;
    }
    handleSidebarHide();
    setDelConfirmOpen(true);
  };

  const EditSetContentModal = () => {
    console.log("--- EditSetContentModal");

    const handleClose = (didUpdate) => {
      setEditSetContentModalOpen(false);
      setEditSetModalOpen(true); // return to all sets editor
      setSetContentUpdated(didUpdate);
    };

    return (
      <Modal
        open={editSetContentModalOpen}
        onClose={handleClose}
        centered={false}
        closeOnEscape={false}
        closeOnDimmerClick={false}
        style={{ width: modalWidthPercent(), maxHeight: "95vh" }}
      >
        <Modal.Header style={{ backgroundColor: "#cbe6d9" }}>
          Edit Set Content
        </Modal.Header>
        <Modal.Content style={{ textAlign: "left" }}>
          <EditSetContent closeHandler={handleClose} setName={setNameToEdit} />
        </Modal.Content>
      </Modal>
    );
  };

  const handleSettings = (e, obj) => {
    history.push("/settings");
  };

  const SidebarMain = () => {
    const [state, dispatch] = useContext(SongContext);

    const onlyOwnerOrAdmin = () => {
      return isAdmin || (isPremium && userId === state.songUserId);
    };

    const doDelete = async () => {
      setDelConfirmOpen(false);
      try {
        const ok = await deleteSong(state.songName);
        if (ok) {
          deleteEntryInStore(state, state.songName);
          dispatch({ type: "selectSet", payload: state.setName });
        }
      } catch (err) {
        alert("Error in deleting song.\n" + err.message);
      }
    };

    return (
      <>
        {setSelectModalOpen ? <SetSelectModal /> : null}
        {searchModalOpen ? <SearchModal /> : null}
        {updatesModalOpen ? <UpdatesModal /> : null}
        {hasWritePrivilege(userId) && editSongModalOpen ? (
          <EditSongModal />
        ) : null}
        {hasWritePrivilege(userId) && addSongModalOpen ? (
          <AddSongModal />
        ) : null}
        {hasWritePrivilege(userId) && editSetModalOpen ? (
          <EditSetModal />
        ) : null}
        {hasWritePrivilege(userId) && editSetContentModalOpen ? (
          <EditSetContentModal />
        ) : null}
        {promptForSetModalOpen ? <FavPromptModal /> : null}
        <PromptConfirm
          open={delConfirmOpen}
          text={`Confirm yes to delete "${state.songName}"`}
          noHdlr={() => {
            setDelConfirmOpen(false);
          }}
          yesHdlr={doDelete}
        />
        <Sidebar
          as={Menu}
          animation="overlay"
          icon="labeled"
          onHide={handleSidebarHide}
          vertical
          visible={sidebarVisible}
          width="thin"
          size="large"
        >
          <Menu.Item onClick={handleSet}>
            <Icon name="folder open outline" /> Set Selection
          </Menu.Item>
          <Menu.Item onClick={handleSearch}>
            <Icon name="search" /> Search by Authors
          </Menu.Item>
          <Menu.Item onClick={handleUpdates}>
            <Icon name="list alternate outline" /> Recently Added
          </Menu.Item>
          <Menu.Item onClick={handleEditSet}>
            <Icon name="copy outline" disabled={!hasWritePrivilege(userId)} />{" "}
            Edit/Manage Sets
          </Menu.Item>
          <Menu.Item onClick={onlyOwnerOrAdmin() ? handleEditSong : null}>
            <Icon name="edit" disabled={!onlyOwnerOrAdmin()} /> Edit Song
          </Menu.Item>
          <Menu.Item onClick={onlyOwnerOrAdmin() ? handleDeleteSong : null}>
            <Icon
              name="trash alternate outline"
              disabled={!onlyOwnerOrAdmin()}
            />{" "}
            Delete Song
          </Menu.Item>
          <Menu.Item onClick={hasWritePrivilege(userId) ? handleAddSong : null}>
            <Icon
              name="file alternate outline"
              disabled={!hasWritePrivilege(userId)}
            />{" "}
            Add New Song
          </Menu.Item>
          <Menu.Item onClick={handleImport}>
            <Icon name="cloud upload" disabled={!hasWritePrivilege(userId)} />{" "}
            Upload files
          </Menu.Item>
          <Menu.Item onClick={handleSettings}>
            <Icon name="setting" /> Settings
          </Menu.Item>
          <Menu.Item
            onClick={() => {
              handleLogout();
              dispatch({ type: "storeReset", payload: null });
            }}
          >
            <Icon name="log out" /> Logout
            <br />
            <br />
            <span style={{ fontSize: "0.85em", fontStyle: "italic" }}>
              {email}
            </span>
            <br />
            {isPremium ? <span style={{ color: "red" }}> Premium </span> : null}
            {isAdmin ? <span style={{ color: "blue" }}> Admin </span> : null}
          </Menu.Item>
        </Sidebar>
      </>
    );
  };

  const PreviousSelect = () => {
    const [state, dispatch] = useContext(SongContext);
    const first = !state.songSetIndex;

    return (
      <List.Item
        as="a"
        disabled={first}
        onClick={(ev, obj) => {
          dispatch({ type: "selectSong", payload: state.songSetIndex - 1 });
        }}
      >
        <div style={{ marginTop: "-5px", marginLeft: "-8px" }}>
          {/* <Icon size="big" name="arrow alternate circle up outline" /> */}
          <Icon size="big" name="caret up" color={first ? "grey" : "blue"} />
        </div>
      </List.Item>
    );
  };

  const NextSelect = () => {
    const [state, dispatch] = useContext(SongContext);
    const last =
      state.songSetIndex ===
      state.store.songChoiceOptions[state.setName].length - 1;

    return (
      <List.Item
        as="a"
        disabled={last}
        onClick={(ev, obj) => {
          dispatch({ type: "selectSong", payload: state.songSetIndex + 1 });
        }}
      >
        <div style={{ marginTop: "-5px", marginLeft: "-22px" }}>
          {/* <Icon size="big" name="arrow alternate circle down outline" /> */}
          <Icon size="big" name="caret down" color={last ? "grey" : "blue"} />
        </div>
      </List.Item>
    );
  };

  const SongChoiceItem = () => {
    const [state, dispatch] = useContext(SongContext);
    // select array must contain only text and value field
    const modOpts = state.setName
      ? state.store.songChoiceOptions[state.setName].map((e) => ({
          text: e.text,
          value: e.value,
        }))
      : [];

    return (
      <List.Item style={{ marginLeft: "4px" }}>
        <List.Content>
          {width <= MIN_WIDTH ? null : (
            <Label color="green" size="large">
              Song:
            </Label>
          )}
          <Dropdown
            search
            deburr={true}
            selection
            onChange={(ev, obj) => {
              dispatch({ type: "selectSong", payload: obj.value });
            }}
            value={state.songSetIndex}
            options={modOpts}
          />
        </List.Content>
      </List.Item>
    );
  };

  const SongKeySelect = () => {
    const [state, dispatch] = useContext(SongContext);

    const selectionKeys = [
      { key: 0, text: "C", value: "C" },
      { key: 1, text: "C#", value: "C#" },
      { key: 2, text: "Db", value: "Db" },
      { key: 3, text: "D", value: "D" },
      { key: 4, text: "D#", value: "D#" },
      { key: 5, text: "Eb", value: "Eb" },
      { key: 6, text: "E", value: "E" },
      { key: 7, text: "F", value: "F" },
      { key: 8, text: "F#", value: "F#" },
      { key: 9, text: "Gb", value: "Gb" },
      { key: 10, text: "G", value: "G" },
      { key: 11, text: "G#", value: "G#" },
      { key: 12, text: "Ab", value: "Ab" },
      { key: 13, text: "A", value: "A" },
      { key: 14, text: "A#", value: "A#" },
      { key: 15, text: "Bb", value: "Bb" },
      { key: 16, text: "B", value: "B" },
    ];

    if (state.chordOff || state.realSongSetIndex < 0) return <></>;

    // add minor to major values
    if (state.songKey[state.songKey.length - 1] === "m")
      selectionKeys.forEach((e) => {
        e.text = e.text + "m";
        e.value = e.value + "m";
      });

    // mark default key only if display is transposed key
    if (state.songKey !== state.songToKey) {
      selectionKeys.forEach((e) => {
        if (e.text === state.songKey) {
          e.text = "[" + e.text + "]";
        }
      });
    }

    return (
      <List.Item>
        <List.Content>
          <b>Key: </b>
          <Dropdown
            disabled={!state.songKey}
            selection
            compact
            scrolling
            onChange={(ev, obj) =>
              dispatch({ type: "selectKey", payload: obj.value })
            }
            value={getKeyForSelectControl(state.songToKey)}
            options={selectionKeys}
          />
          <KeyIncrementChoice />
        </List.Content>
      </List.Item>
    );
  };

  const KeyIncrementChoice = () => {
    const [state, dispatch] = useContext(SongContext);

    if (state.chordOff) return null;

    return (
      <>
        &nbsp;
        <Button
          disabled={!state.songKey}
          basic
          size="tiny"
          icon="plus"
          onClick={() =>
            dispatch({
              type: "selectKey",
              payload: handleUpKey(state.songToKey),
            })
          }
        />
        <Button
          disabled={!state.songKey}
          basic
          size="tiny"
          icon="minus"
          onClick={() =>
            dispatch({
              type: "selectKey",
              payload: handleDownKey(state.songToKey),
            })
          }
        />
      </>
    );
  };

  const ChordOffOption = () => {
    const [state, dispatch] = useContext(SongContext);

    return (
      <List.Item>
        <List.Content verticalAlign="middle">
          <Checkbox
            label="Hide chords"
            name="chordOffOpt"
            // toggle
            onClick={() =>
              dispatch({ type: "chordOff", payload: !state.chordOff })
            }
            defaultChecked={state.chordOff}
          />
        </List.Content>
      </List.Item>
    );
  };

  const FavPromptModal = () => {
    const [state] = useContext(SongContext);
    let userSet = [];
    const [dftSet, setDftSet] = useState(defaultFavSet);
    const orgSet = defaultFavSet;
    // const [promptOpen, setPromptOpen] = useState(false);
    const resSetName = useRef("");

    const doClose = () => {
      setPromptForSetModalOpen(false);
    };

    const handleError = (err) => {
      setDefaultFavSet(orgSet); // restore prev set name
      alert(err.message);
      doClose();
    };

    const handleFavChange = (val) => {
      if (!!val) {
        setDftSet(val);
      }
    };

    const handleFavSave = async () => {
      const fidx = userSet.findIndex((e) => e.value === dftSet);
      const fav = {
        title: state.songName,
        language: state.songLanguage,
        toKey: state.songToKey,
        toTempo: state.songTempo,
      };

      if (fidx < 0) {
        // name is new, add first !! this can't work yet since semanticUI component fails to handle addition
        try {
          isPremium ? await addSet(dftSet, [], userId) : await addSet(dftSet);
        } catch (err) {
          handleError(err);
          return;
        }
      }

      // set already exists, add song to list
      try {
        await updateSetField(dftSet, "songs", fav);
      } catch (err) {
        handleError(err);
      }

      // update in-mem db
      updateUserSetDB(
        state,
        dftSet,
        fav,
        fidx < 0,
        Date.now(),
        isPremium ? userId : null
      );
      setDefaultFavSet(dftSet);
      doClose();
    };

    const doPromptClose = () => {
      if (resSetName.current) resSetName.current.value = "";
      setPromptForSetModalOpen(false);
    };

    const doPromptSubmit = async () => {
      setPromptForSetModalOpen(false);

      const doSubmit = async () => {
        const songs = [
          {
            title: state.songName,
            language: state.songLanguage,
            toKey: state.songToKey,
            toTempo: state.songTempo,
          },
        ];
        const setName = resSetName.current.value;
        let msg;

        // should verify setname validity
        try {
          if (await addSet(setName, songs, isPremium ? userId : null)) {
            msg = `"${state.songName}" has been added to set "${setName}" successfully.`;
            addNewSetToDB(
              state,
              setName,
              songs,
              Date.now(),
              isPremium ? userId : null
            );
          }
        } catch (err) {
          msg = err.message;
        }
        return msg;
      };

      const msg = await doSubmit();
      alert(msg);
    };

    // ============================================== //
    // filter set differently per admin/premium/visitor to create select list
    userSet = state.store.userSets.sets;
    if (isPremium) {
      userSet = userSet.filter((e) => e.userId === userId);
    }
    userSet = userSet.map((e, idx) => ({
      text: e.title,
      value: e.title,
      key: idx,
    }));

    if (!userSet.length) {
      // user has no favorite set yet, prompt to add first one
      return (
        <PromptModal
          open={promptForSetModalOpen}
          inputRef={resSetName}
          fieldLabel="First favorite set name:"
          closeHdlr={doPromptClose}
          submitHdlr={doPromptSubmit}
        />
      );
    }

    // set default set if there's one
    if (!dftSet && userSet.length) setDftSet(userSet[0].value);

    // select from existing sets to add
    return (
      <PromptForSetModal
        open={promptForSetModalOpen}
        selects={userSet}
        defaultVal={dftSet}
        changeCB={handleFavChange}
        closeHdlr={doClose}
        submitHdlr={handleFavSave}
      />
    );
  };

  const FavoriteSave = () => {
    return (
      <List.Item>
        <Button
          icon
          compact
          style={{ backgroundColor: "#cbe6d9" }}
          onClick={() => setPromptForSetModalOpen(true)}
        >
          <Icon name="star" size="large" color="yellow" />
        </Button>
      </List.Item>
    );
  };

  if (!userId || !state.store.timeInit) {
    console.log("user not logged in or DB not ready", userId);
    return null;
  }

  if (!state.setName || !state.songName) {
    console.log("Empty db?: ", state);
    dispatch({ type: "selectSet", payload: DEFAULT_SET });
    return null;
  }

  return (
    <Sidebar.Pushable>
      <div className="home">
        <SidebarMain />
        <Sidebar.Pusher dimmed={sidebarVisible}>
          {width >= PREF_WIDTH ? (
            <List horizontal size="medium">
              <List.Item>
                <Button icon onClick={handleSidebarVisible}>
                  <Icon name="sidebar" />
                </Button>
              </List.Item>
              <SongChoiceItem />
              <PreviousSelect />
              <NextSelect />
              <SongKeySelect />
              <ChordOffOption />
              {hasWritePrivilege(userId) ? <FavoriteSave /> : null}
            </List>
          ) : (
            <>
              <List
                horizontal
                size="tiny"
                style={{ marginTop: 0, marginBottom: 3 }}
              >
                <List.Item>
                  <Button icon onClick={handleSidebarVisible}>
                    <Icon name="sidebar" />
                  </Button>
                </List.Item>
                <SongChoiceItem />
                <PreviousSelect />
                <NextSelect />
              </List>
              <List
                horizontal
                size="mini"
                style={{ marginTop: 0, marginBottom: 0 }}
              >
                <SongKeySelect />
                <ChordOffOption />
                {hasWritePrivilege(userId) ? <FavoriteSave /> : null}
              </List>
            </>
          )}
          <Divider style={{ marginTop: 5, marginBottom: 0 }} />
          <SongDisplay />
        </Sidebar.Pusher>
      </div>
    </Sidebar.Pushable>
  );
}

export default Home;
