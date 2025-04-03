import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import "../styles/AdminZone.css";

const AdminZone = () => {
  const { tagId } = useParams(); // ✅ Extracts tagId from URL
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]); // List of users in the tag
  const [showUserList, setShowUserList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return navigate("/");

    const checkAdminStatus = async () => {
      try {
        const tagRef = doc(db, "tags", tagId);
        const tagSnap = await getDoc(tagRef);

        if (tagSnap.exists()) {
          const tagData = tagSnap.data();
          setAdmins(tagData.admins || []);

          if (tagData.admins?.includes(user.email)) {
            setIsAdmin(true);
            fetchUsers();
            fetchFlaggedPosts(); // ✅ Fetch posts only if user is an admin
          } else {
            alert("⚠️ You are not an admin of this tag.");
            navigate("/tags");
          }
        } else {
          alert("⚠️ This tag does not exist.");
          navigate("/tags");
        }
      } catch (error) {
        console.error("🔥 Error checking admin status:", error.message);
      }
    };

    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "users"), where("tags", "array-contains", tagId));
        const querySnapshot = await getDocs(q);
        setUsers(querySnapshot.docs.map((doc) => doc.data().email));
      } catch (error) {
        console.error("🔥 Error fetching users:", error.message);
      }
    };

    const fetchFlaggedPosts = async () => {
      try {
        const q = query(collection(db, "posts"), where("tag", "==", tagId), where("flagged", "==", true));
        const querySnapshot = await getDocs(q);
        setFlaggedPosts(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("🔥 Error fetching flagged posts:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [tagId, user, navigate]);

  // ✅ Approve a flagged post (removes flag)
  const approvePost = async (postId) => {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { flagged: false });
      setFlaggedPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("🔥 Error approving post:", error.message);
    }
  };

  // ✅ Delete a flagged post
  const deletePost = async (postId) => {
    try {
      const postRef = doc(db, "posts", postId);
      await deleteDoc(postRef);
      setFlaggedPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("🔥 Error deleting post:", error.message);
    }
  };

  // ✅ Promote a user to admin
  const promoteToAdmin = async (email) => {
    const tagRef = doc(db, "tags", tagId);
    try {
      await updateDoc(tagRef, { admins: arrayUnion(email) });
      setAdmins([...admins, email]);
      alert(`${email} is now an admin of ${tagId}! 🎉`);
    } catch (error) {
      console.error("🔥 Error promoting admin:", error.message);
    }
  };

  // ✅ Remove (demote) an admin
  const removeAdmin = async (adminEmail) => {
    if (adminEmail === user.email) {
      return alert("⚠️ You cannot remove yourself as an admin.");
    }

    const tagRef = doc(db, "tags", tagId);
    try {
      await updateDoc(tagRef, { admins: arrayRemove(adminEmail) });
      setAdmins(admins.filter((admin) => admin !== adminEmail));
      alert(`${adminEmail} has been removed as an admin from ${tagId}.`);
    } catch (error) {
      console.error("🔥 Error removing admin:", error.message);
    }
  };

  if (isLoading) return <p>Loading flagged posts...</p>;
  if (!isAdmin) return null; // ✅ Prevents rendering if not an admin

  return (
    <div className="admin-zone">
      <h2>🚨 Flagged Posts for {tagId}</h2>
      {flaggedPosts.length === 0 ? (
        <p>No flagged posts.</p>
      ) : (
        flaggedPosts.map((post) => (
          <div key={post.id} className="flagged-post">
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <div className="admin-actions">
              <button className="approve-btn" onClick={() => approvePost(post.id)}>✅ Approve</button>
              <button className="delete-btn" onClick={() => deletePost(post.id)}>❌ Delete</button>
            </div>
          </div>
        ))
      )}

      <h2>🏆 Manage Admins</h2>
      <button className="promote-btn" onClick={() => setShowUserList(!showUserList)}>
        {showUserList ? "Cancel" : "Promote"}
      </button>

      {showUserList && (
        <div className="user-list">
          <h3>Users in {tagId}:</h3>
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <ul>
              {users
                .filter((email) => !admins.includes(email)) // Show only non-admin users
                .map((email) => (
                  <li key={email}>
                    {email}{" "}
                    <button className="promote-btn" onClick={() => promoteToAdmin(email)}>👑 Promote</button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      <h3>Current Admins:</h3>
      <ul>
        {admins.map((admin) => (
          <li key={admin}>
            {admin}{" "}
            {admin !== user.email && (
              <button className="demote-btn" onClick={() => removeAdmin(admin)}>❌ Remove</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminZone;
