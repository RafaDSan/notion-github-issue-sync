import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

export const appId = process.env.APP_ID;
export const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, 'utf8');
export const secret = process.env.WEBHOOK_SECRET;
export const notionKey = process.env.NOTION_KEY;
export const notionDatabaseId = process.env.NOTION_DATABASE_ID;
export const webhookProxyUrl = process.env.WEBHOOK_PROXY_URL;
export const port = process.env.PORT || 3000;
export const path = '/api/webhook';
export const githubToken = process.env.GITHUB_TOKEN;
