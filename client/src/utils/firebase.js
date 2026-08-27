
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: "AIzaSyBrgSuTywULRSgjkaUnXYOptHqyFd73M-g",
  authDomain: "interviewiq-3746a.firebaseapp.com",
  projectId: "interviewiq-3746a",
  storageBucket: "interviewiq-3746a.firebasestorage.app",
  messagingSenderId: "673155097110",
  appId: "1:673155097110:web:ce5be9b1a067273ae1cb37"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider()

export {auth , provider}
