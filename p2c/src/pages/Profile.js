import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css"; // ✅ Import styles

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      const userRef = doc(db, "users", user.email);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      } else {
        navigate("/profile"); // ✅ New user → Stay on Profile page
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  if (!userData) return <h2>Loading Profile...</h2>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <img 
          src={`https://robohash.org/${user.email}.png?size=150x150`} 
          alt="Profile" 
          className="profile-pic"
        />
        <h2>{user.email.split("@")[0]}</h2> {/* ✅ Extracts name from email */}
        <p>{user.email}</p>

        <h3>Interests</h3>
        {userData.tags.length > 0 ? (
          <div className="tag-container">
            {userData.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        ) : (
          <p className="no-tags">No tags selected</p>
        )}

        <button onClick={() => navigate("/manage-tags")}>Manage Tags</button>

        {/* ✅ If the user has tags, suggest going to feed */}
        {userData.tags.length > 0 && (
          <button onClick={() => navigate("/feed")} className="go-to-feed">
            Go to Feed
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;
