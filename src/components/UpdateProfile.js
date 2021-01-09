import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useHistory } from "react-router-dom";
import { Form, Button, Grid, Message, Segment } from "semantic-ui-react";
import { LoginformsHeader } from "./Login.js";

export default function UpdateProfile() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { currentUser, updatePassword, updateEmail } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match");
    }

    if (
      // no change
      emailRef.current.value === currentUser.email &&
      passwordRef.current.value === ""
    )
      return true;

    try {
      setError("");
      setLoading(true);
      if (emailRef.current.value !== currentUser.email) {
        await updateEmail(emailRef.current.value);
      }
      if (passwordRef.current.value) {
        await updatePassword(passwordRef.current.value);
      }
      history.push("/");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Grid className="loginforms-container">
      <Grid.Column className="loginforms">
        <LoginformsHeader />
        <p className="loginforms-title">Update profile</p>
        {error && (
          <Message error size="large">
            {error}
          </Message>
        )}
        <Segment>
          <Form
            size="medium"
            style={{ textAlign: "left" }}
            onSubmit={handleSubmit}
          >
            <Form.Field id="email">
              <label>Email</label>
              <input
                type="email"
                ref={emailRef}
                required
                defaultValue={currentUser.email}
              />
            </Form.Field>
            <Form.Field id="password">
              <label>Password</label>
              <input
                type="password"
                ref={passwordRef}
                placeholder="Leave blank to keep the same"
              />
            </Form.Field>
            <Form.Field id="password-confirm">
              <label>Password confirmation</label>
              <input
                type="password"
                ref={passwordConfirmRef}
                placeholder="Leave blank to keep the same"
              />
            </Form.Field>

            <Button primary size="large" fluid disabled={loading} type="submit">
              Update Profile
            </Button>
          </Form>
        </Segment>
        <div style={{ textAlign: "right" }}>
          <Link to="/">Cancel update</Link>
        </div>
      </Grid.Column>
    </Grid>
  );
}
