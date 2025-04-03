import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import "../styles/Sidebar.css";
import { FaHome, FaTags, FaShieldAlt } from "react-icons/fa";

const Sidebar = ({ theme }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      const q = query(collection(db, "tags"), where("admins", "array-contains", user.email));
      const querySnapshot = await getDocs(q);

      setIsAdmin(!querySnapshot.empty); // If user is admin of any tag, set true
    };

    checkAdminStatus();
  }, [user]);

  return (
    <div className={`sidebar ${theme}`}>
      <NavLink to="/" className="nav-item">
        <FaHome className="icon" /> Home
      </NavLink>
      <NavLink to="/tags" className="nav-item">
        <FaTags className="icon" /> Tags
      </NavLink>

      {/* Show Admin Zone only if user is an admin */}
      {isAdmin && (
        <NavLink to="/admin-zone" className="nav-item">
          <FaShieldAlt className="icon" /> Admin Zone
        </NavLink>
      )}
    </div>
  );
};

export default Sidebar;
