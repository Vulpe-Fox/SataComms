// This script sets the admin login back to the login in .env. It also removes all locks.
// 1. Stop the server.
// 2. Type npm run reset-login.
// 3. Start the server.
import { readJson, writeJson } from '../server/store.js';
import { hashPassword, DEFAULT_USER, defaultPassword } from '../server/auth.js';

const auth = readJson('auth.json', () => ({}));
const password = defaultPassword();
auth.username = DEFAULT_USER;
auth.passwordHash = await hashPassword(password);
auth.isDefault = true;
auth.lockedUntil = 0;
auth.reset = null;
writeJson('auth.json', auth);
console.log(`The script set the login to ${DEFAULT_USER} / ${process.env.ADMIN_PASSWORD ? "the ADMIN_PASSWORD in .env" : password}. Start the server again.`);
