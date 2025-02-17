import { App } from 'octokit';
import { appId, privateKey, secret } from '../config/env.js'

export const githubApp = new App({
    appId,
    privateKey,
    webhooks: { secret },
});

export const initializeGithubApp = async () => {
    const { data } = await githubApp.octokit.request('/app');
    github.octokit.log.debug(`Authenticated as '${data.name}'`);
    return githubApp;
}