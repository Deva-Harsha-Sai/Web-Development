import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/AuthPage.css"; // ✅ Import styles

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          navigate("/feed"); // Existing user -> Redirect to Feed
        } else {
          navigate("/profile"); // New user -> Redirect to Profile
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleAuth = async () => {
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.email;

        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, { email, tags: [], role: "user" });
        }

        alert("Signup successful! Redirecting...");
        navigate("/profile");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/feed");
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isSignUp ? "Create an Account" : "Welcome Back!"}</h2>
        <input 
          type="email" 
          placeholder="Enter your email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Enter your password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button onClick={handleAuth}>
          {isSignUp ? "Sign Up" : "Login"}
        </button>
        <p onClick={() => setIsSignUp(!isSignUp)} className="toggle-text">
          {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign Up"}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
