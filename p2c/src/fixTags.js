const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, updateDoc } = require("firebase/firestore");

// 🔥 Initialize Firebase (Replace with your config)
const firebaseConfig = {
    apiKey: "AIzaSyBvFph4_3LA5id1KauwBqrA-ID8GrmTuLU",
    authDomain: "p2c-focusflow.firebaseapp.com",
    projectId: "p2c-focusflow",
    storageBucket: "p2c-focusflow.firebasestorage.app",
    messagingSenderId: "705942357830",
    appId: "1:705942357830:web:1d5ab679ea2cb848034747",
    measurementId: "G-JQ31Q4HTC9"
  };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const fixTagsAdminField = async () => {
  try {
    console.log("🔄 Fetching tags...");
    const tagsSnapshot = await getDocs(collection(db, "tags"));

    for (const tagDoc of tagsSnapshot.docs) {
      const tagData = tagDoc.data();

      // ✅ If "admins" field is missing, fix it
      if (!tagData.admins || !Array.isArray(tagData.admins)) {
        console.log(`🔧 Fixing tag: ${tagData.name}`);

        const updatedAdmins = [tagData.createdBy || "unknown@user.com"]; // Default to createdBy

        await updateDoc(doc(db, "tags", tagDoc.id), {
          admins: updatedAdmins,
        });

        console.log(`✅ Fixed tag: ${tagData.name}`);
      }
    }

    console.log("🎉 All missing admin fields have been fixed!");
  } catch (error) {
    console.error("🔥 Error fixing admin fields:", error);
  }
};

// Run the function
fixTagsAdminField();
