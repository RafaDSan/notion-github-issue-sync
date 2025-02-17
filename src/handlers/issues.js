import { createNotionRecord } from '../services/notion.js';

export const handleIssueOpened = async ({ payload }) => {
    console.log(`Received a new issue event for #${payload.issue.number}`);

    try {
        const issueData = {
            title: payload.issue.title,
            state: payload.issue.state,
            number: payload.issue.number,
            html_url: payload.issue.html_url,
            repository: `${payload.repository.owner.login}/${payload.repository.name}`,
            createdAt: payload.issue.created_at,
        };
        
        await createNotionRecord(issueData);
        console.log(`Sucessfully created Notion record for issue #${payload.issue.number}`);
    }   catch (error) {
        console.log(`Error processing issue #${payload.issue.number}`, error);
    }
};