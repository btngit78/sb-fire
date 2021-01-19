import React, { useState } from "react";
import { Container, Card, Button, Message } from "semantic-ui-react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useHistory } from "react-router-dom";

export default function Dashboard() {
  const [error, setError] = useState("");
  const { currentUser, logout } = useAuth();
  const history = useHistory();

  async function handleLogout() {
    setError("");

    try {
      await logout();
      history.push("/login");
    } catch {
      setError("Failed to log out");
    }
  }

  return (
    <Container className="app-content-notop">
      <Card>
        <Card.Content>
          <Card.Header>Profile</Card.Header>
          <Card.Meta>
            <span className="date">Joined in 2015</span>
          </Card.Meta>
        </Card.Content>
        <Card.Content>
          <Card.Description>
            <p style={{ fontSize: "15px" }}>
              Email: <b>{currentUser.email}</b>
              <br />
              <br />
              <Link to="/update-profile">Update Profile</Link>
            </p>
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          {error && <Message error>{error}</Message>}
          <Button basic color="blue" onClick={handleLogout}>
            Log Out
          </Button>
        </Card.Content>
      </Card>
    </Container>
  );
}
