import React from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Grid,
  Icon,
  Divider,
  Dropdown,
  Label,
} from "semantic-ui-react";

export function PromptModal({
  open,
  inputRef,
  fieldLabel,
  closeHdlr,
  submitHdlr,
}) {
  return (
    <Modal
      // onClose={() => setPromptOpen(false)}
      onOpen={() => inputRef.current.focus()} // should work per doc, but doesn't
      open={open}
      size="tiny"
      centered={false}
    >
      <Modal.Header style={{ backgroundColor: "#cbe6d9" }}>
        My Songbook
      </Modal.Header>
      <Modal.Content style={{ textAlign: "center" }}>
        <Form
          onSubmit={(ev, data) => {
            submitHdlr();
          }}
        >
          <Form.Field inline>
            <Label color="green" size="large">
              {fieldLabel}
            </Label>
            <Input
              ref={inputRef}
              onChange={(ev, obj) => {
                inputRef.current.value = obj.value;
              }}
            />
          </Form.Field>
        </Form>
        <Divider />
        <Button
          basic
          icon="cancel"
          content="Cancel"
          color="black"
          onClick={closeHdlr}
        />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <Button
          basic
          icon="checkmark"
          content="OK"
          color="green"
          onClick={submitHdlr}
        />
      </Modal.Content>
    </Modal>
  );
}

export function PromptBinaryCancelModal({
  open,
  opt1Text,
  opt2Text,
  colors,
  icons,
  opt1Hdlr,
  opt2Hdlr,
  cancelHdlr,
}) {
  return (
    <Modal
      closeOnEscape={false}
      closeOnDimmerClick={false}
      open={open}
      size="small"
      centered={false}
    >
      <Modal.Header style={{ backgroundColor: "#cbe6d9" }}>
        My Songbook
      </Modal.Header>
      <Modal.Content>
        <Grid>
          <Grid.Row textAlign="center">
            <Grid.Column width={4}>
              <Button basic icon color={colors[0]} onClick={opt1Hdlr}>
                {icons ? <Icon name={icons[0]} /> : null}
                &nbsp;&nbsp;&nbsp;{opt1Text}
              </Button>
            </Grid.Column>
            <Grid.Column width={8}>
              <Button basic icon color={colors[1]} onClick={opt2Hdlr}>
                {icons ? <Icon name={icons[1]} /> : null}
                &nbsp;&nbsp;&nbsp;{opt2Text}
              </Button>
            </Grid.Column>
            <Grid.Column width={4}>
              <Button basic icon color="black" onClick={cancelHdlr}>
                <Icon name="cancel" />
                &nbsp;&nbsp;&nbsp;Cancel
              </Button>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Modal.Content>
    </Modal>
  );
}

export function PromptConfirm({
  open = false,
  text = "Are you sure?",
  noText = "No",
  yesText = "Yes",
  noHdlr,
  yesHdlr,
}) {
  const len = noText.length + yesText.length;

  return (
    <Modal
      open={open}
      size={len > 15 ? "small" : len > 10 ? "tiny" : "mini"}
      centered={false}
    >
      <Modal.Header style={{ backgroundColor: "#d2f3e1" }}>
        My Songbook
      </Modal.Header>
      <Modal.Content style={{ textAlign: "center" }}>
        <span>{text}</span>
        <Divider />
        <Button basic color="black" onClick={noHdlr}>
          <Icon name="cancel" />
          {noText}
        </Button>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <Button basic color="green" onClick={yesHdlr}>
          <Icon name="checkmark" />
          {yesText}
        </Button>
      </Modal.Content>
    </Modal>
  );
}

export function PromptBinary({
  open = false,
  text = "Choose either option",
  opt1Text = "No",
  opt2Text = "Yes",
  opt1Hdlr,
  opt2Hdlr,
}) {
  const len = opt1Text.length + opt2Text.length;

  return (
    <Modal
      open={open}
      size={len > 15 ? "small" : len > 10 ? "tiny" : "mini"}
      closeOnEscape={false}
      closeOnDimmerClick={false}
      centered={false}
    >
      <Modal.Header style={{ backgroundColor: "#d2f3e1" }}>
        My Songbook
      </Modal.Header>
      <Modal.Content style={{ textAlign: "center" }}>
        <span>{text}</span>
        <Divider />
        <Button basic color="blue" onClick={opt1Hdlr}>
          {opt1Text}
        </Button>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <Button basic color="green" onClick={opt2Hdlr}>
          {opt2Text}
        </Button>
      </Modal.Content>
    </Modal>
  );
}

export function PromptForSetModal({
  open,
  selects,
  defaultVal,
  changeCB,
  closeHdlr,
  submitHdlr,
}) {
  let choice = defaultVal;

  return (
    <Modal open={open} size="tiny" centered={false}>
      <Modal.Header style={{ backgroundColor: "#cbe6d9" }}>
        My Songbook
      </Modal.Header>
      <Modal.Content style={{ textAlign: "center" }}>
        <span>Select a favorite set to add.</span>
        <br />
        <br />
        <Form
          onSubmit={(ev, data) => {
            submitHdlr();
          }}
        >
          <Label color="green" size="large">
            User Sets:
          </Label>
          <Dropdown
            search
            deburr={true}
            selection
            onChange={(ev, obj) => {
              choice = obj.value;
              changeCB(obj.value);
            }}
            value={choice}
            options={selects}
          />
        </Form>
        <Divider />
        <Button
          basic
          icon="cancel"
          content="Cancel"
          color="black"
          onClick={closeHdlr}
        />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <Button
          basic
          icon="checkmark"
          content="OK"
          color="green"
          onClick={submitHdlr}
        />
      </Modal.Content>
    </Modal>
  );
}
