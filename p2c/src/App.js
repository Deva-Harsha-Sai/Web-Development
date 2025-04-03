import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import AuthPage from "./pages/AuthPage";
import Profile from "./pages/Profile";
import ManageTags from "./pages/ManageTags";
import Feed from "./components/Feed";
import TagsPage from "./pages/TagsPage";
import AdminZone from "./pages/AdminZone";
import "./App.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark"); // ✅ Default to dark mode

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.body.className = theme === "dark" ? "dark-mode" : "";
    localStorage.setItem("theme", theme);
  }, [theme]);

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      {user && <Header toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} theme={theme} />}
      {user && <Sidebar theme={theme} />}
      <div className="main-content">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/feed" /> : <AuthPage />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
          <Route path="/manage-tags" element={user ? <ManageTags /> : <Navigate to="/" />} />
          <Route path="/feed" element={user ? <Feed /> : <Navigate to="/" />} />
          <Route path="/tags" element={user ? <TagsPage /> : <Navigate to="/" />} />
          <Route path="/admin-zone/:tagId" element={user ? <AdminZone /> : <Navigate to="/" />} /> {/* ✅ Fixed Route */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
