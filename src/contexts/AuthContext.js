import React, { useContext, useState, useEffect } from "react";
import firebase from "firebase/app";
import { auth } from "../firebase";

export const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [email, setEmail] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userId, setUserId] = useState(null);

  function signup(email, password) {
    return auth.createUserWithEmailAndPassword(email, password);
  }

  function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  }

  function logout() {
    setCurrentUser(null);
    setIsAdmin(false);
    setIsPremium(false);
    setEmail(null);
    setUserId(null);
    setUserName(null);
    return auth.signOut();
  }

  function resetPassword(email) {
    return auth.sendPasswordResetEmail(email);
  }

  function updateEmail(email) {
    return currentUser.updateEmail(email);
  }

  function updatePassword(password) {
    return currentUser.updatePassword(password);
  }

  function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();

    return auth.signInWithPopup(provider);
  }

  function hasWritePrivilege(uid) {
    return isAdmin || (isPremium && uid === userId);
  }

  function isLoggedIn() {
    return currentUser !== null;
  }

  function userStateChange(cb) {
    return auth.onAuthStateChanged(cb);
  }

  const value = {
    currentUser,
    isAdmin,
    isPremium,
    email,
    userName,
    userId,
    isLoggedIn,
    login,
    signup,
    logout,
    resetPassword,
    updateEmail,
    updatePassword,
    googleLogin,
    hasWritePrivilege,
    userStateChange,
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);

      if (auth.currentUser) {
        auth.currentUser
          .getIdTokenResult()
          .then((idTokenResult) => {
            console.log(" claims: ", idTokenResult.claims);
            setIsAdmin(!!idTokenResult.claims.admin);
            setIsPremium(!!idTokenResult.claims.premium);
            setEmail(idTokenResult.claims.email ?? null);
            setUserName(idTokenResult.claims.name ?? null);
            setUserId(idTokenResult.claims.user_id ?? null);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
