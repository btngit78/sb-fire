// Copyright 2021 by Nghia Nguyen
//
import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import Signup from "./Signup";
import Home from "./Home";
import Login from "./Login";
import PrivateRoute from "./PrivateRoute";
import ForgotPassword from "./ForgotPassword";
import "../app.css";
import Settings from "./Settings";
import { SongProvider } from "../contexts/StoreContext";

function App() {
  return (
    <div className="app">
      <AuthProvider>
        <SongProvider>
          <Router>
            <Switch>
              <PrivateRoute exact path="/" component={Home} />
              <PrivateRoute exact path="/settings" component={Settings} />
              <Route path="/signup" component={Signup} />
              <Route path="/login" component={Login} />
              <Route path="/forgot-password" component={ForgotPassword} />
            </Switch>
          </Router>
        </SongProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
