import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// RN-04: valida se o usuário tem 16 anos ou mais
export function validateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 16;
}

// RF-01 — Cadastro com e-mail e senha
export async function registerWithEmail({ name, email, password, birthDate }) {
  // RN-04
  if (!validateAge(birthDate)) {
    throw new Error("Você precisa ter pelo menos 16 anos para criar uma conta.");
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Atualiza o displayName
  await updateProfile(user, { displayName: name });

  // Salva dados adicionais no Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name,
    email,
    birthDate,
    createdAt: serverTimestamp(),
    onboardingCompleted: false,
  });

  return user;
}

// RF-02 — Login com e-mail e senha
export async function loginWithEmail({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// Login / Cadastro com Google
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;

  // Cria documento no Firestore apenas se for novo usuário
  const userRef = doc(db, "users", user.uid);
  await setDoc(
    userRef,
    {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      createdAt: serverTimestamp(),
    },
    { merge: true } // merge: true evita sobrescrever dados existentes
  );

  return user;
}

// Logout
export async function logout() {
  await signOut(auth);
}
