import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import "../styles/Header.css"; // Ensure this file exists
import { FaUserCircle } from "react-icons/fa";

const Header = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="header">
      <div className="logo">
        <Link to="/feed">P2C-FocusFlow</Link>
      </div>
      <div className="profile">
        {user ? (
          <Link to="/profile">
            <img
              src={user.photoURL || "https://robohash.org/${user.email}.png?size=100x100"} // Fallback if no profile picture
              alt="Profile"
              className="profile-pic"
            />
          </Link>
        ) : (
          <FaUserCircle size={32} className="default-profile" />
        )}
      </div>
    </header>
  );
};

export default Header;
