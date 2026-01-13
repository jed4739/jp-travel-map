import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAuqaMkm062wE76Ee7qw810tygZy888RBg",
    authDomain: "jp-travel-map.firebaseapp.com",
    projectId: "jp-travel-map",
    storageBucket: "jp-travel-map.firebasestorage.app",
    messagingSenderId: "10304501802",
    appId: "1:10304501802:web:b5960573010e5379aaab53",
    measurementId: "G-BEW4VFTPDR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();