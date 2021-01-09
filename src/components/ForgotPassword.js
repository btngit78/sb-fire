import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Form,
  Button,
  Grid,
  Segment,
  Header,
  Message,
} from "semantic-ui-react";
import { LoginformsHeader } from "./Login.js";

export default function ForgotPassword() {
  const emailRef = useRef();
  const { resetPassword } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setMessage("");
      setError("");
      setLoading(true);
      await resetPassword(emailRef.current.value);
      setMessage("Check your email inbox for further instructions");
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  }

  return (
    <Grid className="loginforms-container">
      <Grid.Column className="loginforms">
        <LoginformsHeader />
        <p className="loginforms-title">Reset your password</p>
        {error && (
          <Message error size="large">
            {error}
          </Message>
        )}
        {message && (
          <Message success size="large">
            {message}
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
            <Button primary size="large" fluid disabled={loading} type="submit">
              Reset Password
            </Button>
          </Form>
        </Segment>
        <Segment basic>
          <Header size="small">
            Ready to login again?&nbsp;<Link to="/login">Login</Link>
          </Header>
        </Segment>
      </Grid.Column>
    </Grid>
  );
}
