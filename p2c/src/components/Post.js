import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  doc,
  updateDoc,
  increment,
  collection,
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import "../styles/Post.css";
import { format } from "timeago.js";

const flaggedKeywords = ["advertisement", "irrelevant", "fake"];

const Post = ({ post, isAdmin }) => {
  const [likes, setLikes] = useState(post.likes || 0);
  const [userLiked, setUserLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const user = auth.currentUser;
  const isOwner = user && post.userId === user.email;
  
  const timePassed = post.createdAt
    ? format(new Date(post.createdAt.seconds * 1000))
    : "Unknown time";

  useEffect(() => {
    if (!post.id) return;
    fetchLikes();
    fetchComments();
  }, [post.id]);

  const fetchLikes = async () => {
    const postRef = doc(db, "posts", post.id);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      setLikes(postSnap.data().likes || 0);
    }
  };

  useEffect(() => {
    if (!post.id || !user) return;

    const checkLikeStatus = async () => {
      const likeRef = doc(db, "posts", post.id, "likes", user.email);
      const likeSnap = await getDoc(likeRef);
      setUserLiked(likeSnap.exists());
    };

    checkLikeStatus();
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user) return alert("⚠️ Login to like posts!");

    const postRef = doc(db, "posts", post.id);

    if (userLiked) {
      await updateDoc(postRef, { likes: increment(-1) });
      setLikes((prev) => prev - 1);
      setUserLiked(false);
    } else {
      await updateDoc(postRef, { likes: increment(1) });
      setLikes((prev) => prev + 1);
      setUserLiked(true);
    }
  };

  const fetchComments = async () => {
    if (!post.id) return;

    const commentQuery = query(
      collection(db, "posts", post.id, "comments"),
      orderBy("createdAt", "desc")
    );

    const commentSnapshot = await getDocs(commentQuery);
    const fetchedComments = commentSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setComments(fetchedComments);
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return alert("⚠️ Enter a valid comment!");

    const commentRef = collection(db, "posts", post.id, "comments");
    const newCommentObj = {
      userId: user.email,
      text: newComment.toLowerCase(),
      createdAt: new Date(),
    };

    await addDoc(commentRef, newCommentObj);
    setNewComment("");

    setComments((prev) => [newCommentObj, ...prev]);
    checkForFlagging([...comments, newCommentObj]);
  };

  const checkForFlagging = async (updatedComments) => {
    const totalComments = updatedComments.length;
    if (totalComments < 4) return;

    const flaggedCount = updatedComments.filter((comment) =>
      flaggedKeywords.some((keyword) => comment.text.includes(keyword))
    ).length;

    if (flaggedCount > totalComments / 2) {
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, { flagged: true });
    }
  };

  const handleDeletePost = async () => {
    if (!isAdmin && !isOwner)
      return alert("⚠️ Only post owners or admins can delete posts.");
    try {
      await deleteDoc(doc(db, "posts", post.id));
      alert("✅ Post deleted!");
    } catch (error) {
      console.error("🔥 Error deleting post:", error.message);
    }
  };

  const renderMedia = () => {
    if (!post.fileUrl) return null;

    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(post.fileUrl);
    const isVideo = /\.(mp4|webm|ogg)$/i.test(post.fileUrl);
    const isPdf = /\.pdf$/i.test(post.fileUrl);

    if (isImage) {
      return <img src={post.fileUrl} alt="Post media" className="post-media" />;
    } else if (isVideo) {
      return (
        <video className="post-media" controls>
          <source src={post.fileUrl} type="video/mp4" />
        </video>
      );
    } else if (isPdf) {
      return (
        <a href={post.fileUrl} target="_blank" className="post-link">
          📄 View PDF
        </a>
      );
    }
    return null;
  };

  return (
    <div className="post">
      <p className="post-meta">
        <strong>{post.userId}</strong> · {timePassed}
      </p>
      <h3 className="post-title">{post.title}</h3>
      <p className="post-type">Type: {post.type}</p>
      {renderMedia()}
      <p className="post-content">{post.content}</p>

      <div className="post-actions">
        <button onClick={handleLike} className={userLiked ? "liked" : ""}>
          {userLiked ? "❤️ Liked" : "🤍 Like"} {likes}
        </button>

        <button onClick={toggleComments}>
          {showComments ? "⬆️ Hide Comments" : "⬇️ Show Comments"}
        </button>

        {(isAdmin || isOwner) && (
          <button onClick={handleDeletePost} className="delete-btn">
            🗑️ Delete
          </button>
        )}
      </div>

      {showComments && (
        <div className="comments">
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button onClick={handleComment}>💬</button>

          <div className="comment-section">
            {comments.length === 0 ? (
              <p>No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <p key={comment.id}>
                  <strong>{comment.userId}:</strong> {comment.text}
                </p>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
