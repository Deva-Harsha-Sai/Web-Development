import React, { useState, useEffect, useRef, useCallback } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc } from "firebase/firestore";
import Post from "../components/Post";
import "../styles/Feed.css";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastPost, setLastPost] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const user = auth.currentUser;
  const seenPostIds = useRef(new Set()); // ✅ Tracks unique posts

  // ✅ Fetch user's selected tags
  const fetchUserTags = async () => {
    if (!user) return [];
    try {
      const userRef = doc(db, "users", user.email);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? userSnap.data().tags || [] : [];
    } catch (error) {
      console.error("Error fetching user tags:", error);
      return [];
    }
  };

  // ✅ Fetch posts based on user tags
  const fetchPosts = async (startAfterDoc = null) => {
    if (!user) return;
    setLoading(true);
    const userTags = await fetchUserTags();
    if (userTags.length === 0) {
      setLoading(false);
      setHasMore(false);
      return;
    }

    try {
      let postQuery = query(
        collection(db, "posts"),
        where("tag", "in", userTags), // Fetch posts matching user's tags
        where("flagged", "==", false), // Ensure flagged posts are hidden
        orderBy("createdAt", "desc"),
        limit(5) // Load in batches of 5
      );

      if (startAfterDoc) {
        postQuery = query(postQuery, startAfter(startAfterDoc));
      }

      const postSnapshots = await getDocs(postQuery);
      const newPosts = postSnapshots.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((post) => !seenPostIds.current.has(post.id)); // ✅ Remove duplicates

      newPosts.forEach((post) => seenPostIds.current.add(post.id)); // ✅ Track new posts

      setPosts((prev) => [...prev, ...newPosts]);
      setLastPost(postSnapshots.docs[postSnapshots.docs.length - 1]);
      setHasMore(postSnapshots.docs.length === 5);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Infinite scrolling observer
  const lastPostRef = useCallback(
    (node) => {
      if (loading || !hasMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchPosts(lastPost);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="feed-container">
      <h2>Your Feed</h2>
      {posts.length === 0 && !loading && <p>No posts available. Try following more topics!</p>}
      {posts.map((post, index) => (
        <div key={post.id} ref={index === posts.length - 1 ? lastPostRef : null}>
          <Post post={post} />
        </div>
      ))}
      {loading && <p>Loading...</p>}
      {!hasMore && <p>No more posts to show</p>}
    </div>
  );
};

export default Feed;
