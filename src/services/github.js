import { App } from 'octokit'
import { appId, privateKey, secret } from '../config/env.js'

// Creates the GithubApp Instance
export const githubApp = new App({
  appId,
  privateKey,
  webhooks: { secret }
})

// Initialize the GithubApp and get the authenticated Octokit instance
export const getAuthenticatedOctokit = async () => {
  try {
    // Get the first installation
    const installation = await githubApp.octokit.request('GET /app/installations', {
      headers: {
        'x-github-api-version': '2022-11-28'
      }
    })

    if (!installation.data || installation.data.length === 0) {
      throw new Error('No installations found for this Github APP')
    }

    // Create an installation access token
    const installationId = installation.data[0].id
    const octokit = await githubApp.getInstallationOctokit(installationId)

    return octokit
  } catch (error) {
    console.error('Error getting authenticated Octokit instance', error)
    throw error
  }
}

export const fetchInstalledRepositories = async () => {
  try {
    const octokit = await getAuthenticatedOctokit(0)
    const response = await octokit.rest.apps.listReposAccessibleToInstallation()
    return response.data.repositories
  } catch (error) {
    console.error('Error fetching installed repositories', error)
    throw error
  }
}

export const fetchIssues = async (owner, repo) => {
  try {
    const octokit = await getAuthenticatedOctokit()
    const response = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: 'all'
    })
    
    // Filter out pull requests by only keeping items that don't have a pull_request property
    const issuesOnly = response.data.filter(item => !item.pull_request)
    return issuesOnly
  } catch (error) {
    console.error('Error fetching issues:', error)
    throw error
  }
}
