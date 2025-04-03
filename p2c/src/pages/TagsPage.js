import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Post from "../components/Post";
import "../styles/TagsPage.css";

const TagsPage = () => {
  const [userTags, setUserTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [posts, setPosts] = useState([]);
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", type: "Query", file: null });
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchUserTags();
  }, [user]);

  const fetchUserTags = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.email);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setUserTags(userSnap.data().tags || []);
    } catch (error) {
      console.error("🔥 Error fetching user tags:", error.message);
    }
  };

  const fetchTagPosts = async (tag) => {
    setSelectedTag(tag);
    setLoadingPosts(true);
    setPosts([]);
    setFlaggedPosts([]);

    try {
      const postsQuery = query(
        collection(db, "posts"),
        where("tag", "==", tag),
        where("flagged", "==", false),
        orderBy("createdAt", "desc")
      );

      const flaggedQuery = query(
        collection(db, "posts"),
        where("tag", "==", tag),
        where("flagged", "==", true),
        orderBy("createdAt", "desc")
      );

      const [postSnapshots, flaggedSnapshots] = await Promise.all([
        getDocs(postsQuery),
        getDocs(flaggedQuery),
      ]);

      setPosts(postSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setFlaggedPosts(flaggedSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const tagRef = doc(db, "tags", tag);
      const tagSnap = await getDoc(tagRef);
      setIsAdmin(tagSnap.exists() && tagSnap.data().admins?.includes(user.email));
    } catch (error) {
      console.error("🔥 Error fetching posts:", error.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  // ✅ Delete Post (Users can delete their posts, Admins can delete any)
  const handleDeletePost = async (postId, postUserId) => {
    if (!user) return alert("⚠️ You must be logged in to delete posts.");
    const isOwner = user.email === postUserId;

    if (!isOwner && !isAdmin) {
      return alert("⚠️ You can only delete your own posts.");
    }

    try {
      await deleteDoc(doc(db, "posts", postId));
      alert("✅ Post deleted successfully!");
      fetchTagPosts(selectedTag);
    } catch (error) {
      console.error("🔥 Error deleting post:", error.message);
    }
  };

  return (
    <div className="tags-container">
      <h2>Your Tags</h2>
      <div className="tags-list">
        {userTags.map((tag) => (
          <button
            key={tag}
            className={selectedTag === tag ? "active-tag" : ""}
            onClick={() => fetchTagPosts(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {selectedTag && (
        <div className="tag-section">
          <h3>{selectedTag} Posts</h3>

          {isAdmin && (
            <button className="admin-zone-btn" onClick={() => navigate(`/admin-zone/${selectedTag}`)}>
              ⚠️ Admin Zone (Flagged Posts)
            </button>
          )}

          {loadingPosts ? <p>Loading posts...</p> : (
            <div className="posts-list">
              {posts.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  isAdmin={isAdmin}
                  handleDeletePost={() => handleDeletePost(post.id, post.userId)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagsPage;
