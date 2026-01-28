import React, { useContext } from "react";
import {
  Button,
  Container,
  Table,
  Menu,
  Label,
  Icon,
  Grid,
} from "semantic-ui-react";

import {
  SongContext,
  totalSongsInStore,
  totalUserSetCount,
  averageSetSize,
} from "../contexts/StoreContext";
import { getWidth, PREF_WIDTH } from "../lib/utils";

export function SetSelect(props) {
  const closeHandler = props.closeHandler;
  const [state, dispatch] = useContext(SongContext);
  const len = state.store.setChoiceOptions.length;
  const twoCol = len > 10 && getWidth() >= PREF_WIDTH;
  const half = Math.round(len / 2);
  const c1 = state.store.setChoiceOptions.slice(0, twoCol ? half : len);
  const c2 = twoCol ? state.store.setChoiceOptions.slice(half) : null;
  let c0 = [];

  const SetItem = ({ entry, state }) => {
    return (
      <Menu borderless vertical>
        <Menu.Item
          color="blue"
          name={entry.value}
          active={entry.value === state.setName}
          onClick={(ev, obj) => {
            if (!state.store.songChoiceOptions[entry.value].length) return;
            dispatch({ type: "selectSet", payload: obj.name });
            closeHandler();
          }}
        >
          <Label
            color={
              entry.builtin
                ? "teal"
                : state.store.songChoiceOptions[entry.value] &&
                  state.store.songChoiceOptions[entry.value].length
                ? "orange"
                : "grey"
            }
          >
            {state.store.songChoiceOptions[entry.value].length}
          </Label>
          {entry.value}
          {entry.value === state.setName ? (
            <>
              &nbsp;&nbsp;&nbsp;
              <Icon name="music" />
            </>
          ) : null}
        </Menu.Item>
      </Menu>
    );
  };

  const OneColumn = ({ list }) => {
    return list.map((entry, idx) => (
      <React.Fragment key={idx}>
        <Table.Row>
          <Table.Cell>
            {idx + 1}.{!entry.builtin ? <span>&nbsp;&nbsp;(user)</span> : null}
          </Table.Cell>
          <Table.Cell>
            <SetItem entry={entry} state={state} />
          </Table.Cell>
        </Table.Row>
      </React.Fragment>
    ));
  };

  const TwoColumn = ({ list }) => {
    const depth = list.length;

    return list.map((a, ai) => (
      <React.Fragment key={ai}>
        <Table.Row>
          <Table.Cell>
            {ai + 1}.{!a[0].builtin ? <span>&nbsp;&nbsp;(user)</span> : null}
          </Table.Cell>
          <Table.Cell>
            <SetItem entry={a[0]} state={state} />
          </Table.Cell>
          {a[1] ? (
            <>
              <Table.Cell>
                {depth + ai + 1}.
                {!a[1].builtin ? <span>&nbsp;&nbsp;(user)</span> : null}
              </Table.Cell>
              <Table.Cell>
                <SetItem entry={a[1]} state={state} />
              </Table.Cell>
            </>
          ) : (
            <>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </>
          )}
        </Table.Row>
      </React.Fragment>
    ));
  };

  console.log("--- SetSelect");

  // create 1 or 2 dimension matrices for display
  if (!twoCol) c0 = c1;
  else {
    let o1, o2;
    for (let i = 0; i < half; i++) {
      o1 = c1[i];
      if (i < c2.length) o2 = c2[i];
      else o2 = null;
      c0.push([o1, o2]);
    }
  }

  return (
    <>
      <Container textAlign="left">
        <Grid>
          <Grid.Row columns={2}>
            <Grid.Column size={2}>
              <Button
                basic
                icon="checkmark"
                color="green"
                floated="left"
                content="Close screen"
                onClick={() => closeHandler()}
              />
            </Grid.Column>
            <Grid.Column size={14} textAlign="right">
              <span>
                Total songs in all languages: {totalSongsInStore(state)}
              </span>
              <br />
              <span>
                Total user sets: {totalUserSetCount(state)}
                .&nbsp;&nbsp;&nbsp;Average songs per set:{" "}
                {averageSetSize(state)}.
              </span>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
      <br />
      <Container style={{ maxHeight: "78vh", overflowY: "scroll" }}>
        <Table size="large">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell width={2}>No.</Table.HeaderCell>
              <Table.HeaderCell>Set name</Table.HeaderCell>
              {twoCol ? (
                <>
                  <Table.HeaderCell width={2}>No.</Table.HeaderCell>
                  <Table.HeaderCell>Set name</Table.HeaderCell>
                </>
              ) : null}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {!twoCol ? <OneColumn list={c0} /> : <TwoColumn list={c0} />}
          </Table.Body>
        </Table>
      </Container>
    </>
  );
}
