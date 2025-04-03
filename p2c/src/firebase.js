import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";  

// ✅ Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvFph4_3LA5id1KauwBqrA-ID8GrmTuLU",
    authDomain: "p2c-focusflow.firebaseapp.com",
    projectId: "p2c-focusflow",
    storageBucket: "p2c-focusflow.firebasestorage.app",
    messagingSenderId: "705942357830",
    appId: "1:705942357830:web:1d5ab679ea2cb848034747",
    measurementId: "G-JQ31Q4HTC9"
  };
// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);  

// ✅ Get User ID (Now returns email instead of UID)
export const getUserID = () => {
  return auth.currentUser ? auth.currentUser.email : null;
};

// ✅ Ensure user exists in Firestore (Create a profile if missing)
export const ensureUserProfile = async (user) => {
  if (!user) return;

  const userRef = doc(db, "users", user.email); // 🔥 Using email as userId
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.log("🆕 Creating user profile...");
    await setDoc(userRef, {
      email: user.email,
      topics: [], // ✅ Empty topics initially
      isAdmin: false, // 🔥 Default to non-admin
    });
  }
};

// ✅ Monitor Auth State & Create Profile if Missing
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await ensureUserProfile(user);
  }
});

export { auth, db, storage };
