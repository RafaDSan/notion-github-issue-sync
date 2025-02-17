import { createNodeMiddleware } from '@octokit/webhooks';
import { githubApp } from './services/github.js';
import { handleIssueOpened } from './handlers/issues.js';
import { handlePullRequestOpened } from './handlers/pullRequests.js';

export const initializeApp = async () => {
  const app = await githubApp;

  // Subscribe to events
  app.webhooks.on('issues.opened', handleIssueOpened);
  app.webhooks.on('pull_request.opened', handlePullRequestOpened);

  // Handle errors
  app.webhooks.onError((error) => {
    if (error.name === 'AggregateError') {
      console.log(`Error processing request: ${error.event}`);
    } else {
      console.log(error);
    }
  });

  return createNodeMiddleware(app.webhooks, { path: '/api/webhook' });
};