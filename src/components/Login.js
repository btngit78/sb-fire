import React, { useEffect, useRef, useState } from "react";
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
  Icon,
} from "semantic-ui-react";

export function LoginformsHeader() {
  return (
    // style must be applied here; using className will get overridden
    <Header
      size="large"
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
  const { login, googleLogin, currentUser } = useAuth();
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const history = useHistory();

  useEffect(() => {
    if (currentUser) {
      history.push("/");
    }
  });

  async function doLogin(loginMode) {
    try {
      setError("");
      setWaiting(true);
      if (loginMode === "email") {
        await login(emailRef.current.value, passwordRef.current.value);
      } else if (loginMode === "google") {
        await googleLogin();
      }
      // const cred = res.credential;
      // const token = cred.accessToken;
      // const user = res.user;
      // console.log("Res: ", res, " Tkn: ", token, " User: ", user);
    } catch (e) {
      setError(e.message);
      setWaiting(false);
    }
  }

  if (currentUser && !waiting) {
    // logged in but not routed to home page yet
    console.log("logged in but not routed yet! - user:", currentUser);
    return <></>;
  }

  console.log("--- Login");

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
            size="large"
            style={{ textAlign: "left" }}
            onSubmit={(e) => {
              e.preventDefault();
              doLogin("email");
            }}
          >
            <Form.Field id="email">
              <label>Email</label>
              <input type="email" ref={emailRef} required />
            </Form.Field>
            <Form.Field id="password">
              <label>Password</label>
              <input type="password" ref={passwordRef} required />
            </Form.Field>
            <Button primary size="large" fluid disabled={waiting} type="submit">
              Login
            </Button>
          </Form>
          <br />
          <Button
            size="large"
            color="red"
            fluid
            disabled={waiting}
            onClick={(e) => {
              e.preventDefault();
              doLogin("google");
            }}
          >
            <Icon name="google" />
            Sign in with Google
          </Button>
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
