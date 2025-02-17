import http from 'http';
import SmeeClient from 'smee-client';
import { initializeApp } from './app.js';
import { port, path, webhookProxyUrl } from './config/env.js';

const startServer = async () => {
  const middleware = await initializeApp();

  const smee = new SmeeClient({
    source: webhookProxyUrl,
    target: `http://localhost:${port}${path}`,
    logger: console,
  });

  smee.start();

  http.createServer(middleware).listen(port, () => {
    console.log(`Server is listening for events at: http://localhost:${port}${path}`);
    console.log('Press Ctrl + C to quit.');
  });
};

startServer();