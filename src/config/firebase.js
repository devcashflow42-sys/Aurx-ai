import admin from 'firebase-admin';

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch {
  console.error('[Firebase] FIREBASE_SERVICE_ACCOUNT no es JSON válido. Revisa tu archivo .env');
  process.exit(1);
}

if (!process.env.FIREBASE_DB_URL) {
  console.error('[Firebase] FIREBASE_DB_URL no está definido en .env');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL,
});

export const db   = admin.database();
export const auth = admin.auth();
