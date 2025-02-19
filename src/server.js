import SmeeClient from 'smee-client';
import http from 'http';
import { createNotionRecord } from './services/notion.js'
import { fetchIssues, fetchInstalledRepositories } from './services/github.js';
import { filterIssuesByAssignee } from './utils/issueUtils.js';
import { initializeApp } from './app.js';
import { port, path, webhookProxyUrl } from './config/env.js';

const populateNotionDatabase = async () => {
  try {
    // Fetch repositories where the app is installed
    const repositories = await fetchInstalledRepositories();

    // Iterate over each repository
    for (const repo of repositories) {
      const owner  = repo.owner.login;
      const repoName = repo.name;

      console.log(`Fetching issues for repository: ${owner}\${repoName}`);

      // Fetch issues for the repository
      const issues = await fetchIssues(owner, repoName);

      // Filter issues assigned to RafaDSan
      const issuesForRafaDSan = filterIssuesByAssignee(issues, 'RafaDSan');  

      // Create notion records for each issue
      for (const issue of issuesForRafaDSan) {
        const issueData = {
          title: issue.title,
          state: issue.state,
          number: issue.number,
          html_url: issue.html_url,
          repository: `${owner}/${repoName}`,
          createdAt: issue.created_at,
        };

        await createNotionRecord(issueData);
      }
    }

    console.log('Notion database populated with existing issues from all repositories');
  } catch (error) {
    console.error('Error populating Notion database');
  }
};

// Populate notion database when the server starts
populateNotionDatabase();

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