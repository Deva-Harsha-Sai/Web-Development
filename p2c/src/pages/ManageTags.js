import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/ManageTags.css";

const ManageTags = () => {
  const [availableTags, setAvailableTags] = useState([]); // All tags from Firestore
  const [filteredTags, setFilteredTags] = useState([]); // Filtered tags based on search
  const [selectedTags, setSelectedTags] = useState([]); // Tags selected by the user
  const [newTag, setNewTag] = useState(""); // New tag input
  const [searchTerm, setSearchTerm] = useState(""); // Search input
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchTags();
    fetchUserTags();
  }, [user, navigate]);

  // ✅ Fetch all available tags from Firestore
  const fetchTags = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "tags"));
      const tagsList = querySnapshot.docs.map((doc) => doc.id);
      setAvailableTags(tagsList);
      setFilteredTags(tagsList); // Initialize filtered list
    } catch (error) {
      console.error("🔥 Error fetching tags:", error);
    }
  };

  // ✅ Fetch user's selected tags
  const fetchUserTags = async () => {
    try {
      const userRef = doc(db, "users", user.email);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setSelectedTags(userSnap.data().tags || []);
      }
    } catch (error) {
      console.error("🔥 Error fetching user tags:", error);
    }
  };

  // ✅ Toggle Tag Selection (User can select up to 3)
  const toggleTagSelection = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    } else {
      alert("⚠️ You can select up to 3 tags only!");
    }
  };

  // ✅ Create a new tag in Firestore (with admins field)
  const handleCreateTag = async () => {
    if (!newTag.trim()) return;
    const tagId = newTag.trim().toLowerCase(); // Make tag ID lowercase for consistency

    if (availableTags.includes(tagId)) {
      alert("⚠️ Tag already exists!");
      return;
    }

    try {
      const tagRef = doc(db, "tags", tagId); // Use tag name as document ID
      await setDoc(tagRef, {
        name: tagId,
        createdBy: user.email,
        createdAt: new Date(),
        admins: [user.email], // ✅ Ensure the creator is an admin
      });

      setAvailableTags([...availableTags, tagId]); // Update UI
      setFilteredTags([...filteredTags, tagId]); // Update search results
      setSelectedTags([...selectedTags, tagId]); // Add to user selection
      setNewTag(""); // Clear input
    } catch (error) {
      console.error("🔥 Error creating tag:", error);
    }
  };

  // ✅ Save selected tags to Firestore
  const handleSaveTags = async () => {
    try {
      const userRef = doc(db, "users", user.email);
      await updateDoc(userRef, { tags: selectedTags });

      alert("✅ Tags updated successfully!");
      navigate("/profile"); // Redirect to profile
    } catch (error) {
      console.error("🔥 Error saving tags:", error);
    }
  };

  // ✅ Search Filter
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTags(availableTags);
    } else {
      setFilteredTags(
        availableTags.filter((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, availableTags]);

  return (
    <div className="tags-container">
      <h2>🏷️ Manage Your Tags</h2>

      {/* ✅ Search Box */}
      <input
        type="text"
        placeholder="🔍 Search tags..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-box"
      />

      {/* ✅ Scrollable Tag List */}
      <div className="tag-list">
        {filteredTags.length > 0 ? (
          filteredTags.map((tag) => (
            <span
              key={tag}
              className={`tag ${selectedTags.includes(tag) ? "selected" : ""}`}
              onClick={() => toggleTagSelection(tag)}
            >
              {tag}
            </span>
          ))
        ) : (
          <p>No matching tags found.</p>
        )}
      </div>

      {/* ✅ Create New Tag */}
      <div className="create-tag">
        <input
          type="text"
          placeholder="➕ Create a new tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <button className="add-tag-btn" onClick={handleCreateTag}>
          Add Tag
        </button>
      </div>

      {/* ✅ Save Button */}
      <button className="save-btn" onClick={handleSaveTags}>
        Save Tags
      </button>
    </div>
  );
};

export default ManageTags;
