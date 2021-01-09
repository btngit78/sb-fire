import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useHistory } from "react-router-dom";
import {
  Form,
  Button,
  Grid,
  Segment,
  Header,
  Message,
} from "semantic-ui-react";
import { LoginformsHeader } from "./Login.js";

export default function Signup() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match");
    }

    try {
      setError("");
      setLoading(true);
      await signup(emailRef.current.value, passwordRef.current.value);
      history.push("/");
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  }

  return (
    <Grid className="loginforms-container">
      <Grid.Column className="loginforms">
        <LoginformsHeader />
        <p className="loginforms-title">Sign up for new account</p>
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
              <input type="email" ref={emailRef} required />
            </Form.Field>
            <Form.Field id="password">
              <label>Password</label>
              <input
                type="password"
                ref={passwordRef}
                required
                placeholder="6 characters minimum"
              />
            </Form.Field>
            <Form.Field id="password-confirm">
              <label>Password confirmation</label>
              <input
                type="password"
                ref={passwordConfirmRef}
                required
                placeholder="same as above"
              />
            </Form.Field>
            <Button primary size="large" fluid disabled={loading} type="submit">
              Sign Up
            </Button>
          </Form>
        </Segment>
        <Segment basic>
          <Header size="small">
            Already have an account?&nbsp;&nbsp;
            <Link to="/login">Log In</Link>
          </Header>
        </Segment>
      </Grid.Column>
    </Grid>
  );
}
