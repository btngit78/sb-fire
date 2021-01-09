import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useHistory } from "react-router-dom";
import {
  Grid,
  Form,
  Button,
  Header,
  Image,
  Message,
  Segment,
} from "semantic-ui-react";

export function LoginformsHeader() {
  return (
    <Header
      as="h2"
      style={{ fontFamily: "Alice", color: "#980c3adb" }}
      textAlign="center"
    >
      <Image src="/favicon.ico" />
      My Song Book
    </Header>
  );
}

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
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
        <p className="loginforms-title">Login to your account</p>
        {error && (
          <Message error size="large">
            Email address not found or invalid password
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
              <input type="password" ref={passwordRef} required />
            </Form.Field>
            <Button primary size="large" fluid disabled={loading} type="submit">
              Login
            </Button>
          </Form>
        </Segment>
        <Segment basic>
          <Header size="small" floated="left">
            <Link to="/forgot-password">Forgot Password?</Link>
          </Header>
          <Header size="small" floated="right">
            New to us?&nbsp;<Link to="/signup">Sign Up</Link>
          </Header>
        </Segment>
      </Grid.Column>
    </Grid>
  );
}
