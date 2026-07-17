import dotenv from 'dotenv';
dotenv.config();
import { listAccounts } from './services/instapilot.js';

async function run() {
  const user = { userId: 'c4ce9261-3b4b-4898-9aa8-97a5d673eafa' };
  const accounts = await listAccounts(user);
  console.log('List of accounts for Shwet:', accounts);
}
run().catch(console.error);
