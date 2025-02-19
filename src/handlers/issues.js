import { createNotionRecord, getValidStatus, updateStatus } from '../services/notion.js';

export const handleIssueOpened = async ({ payload }) => {
    console.log('Processing opened issue:', {
        number: payload.issue.number,
        title: payload.issue.title,
        state: payload.issue.state,
        assignee: payload.issue.assignee?.login
    });

    if (payload.issue.assignee && payload.issue.assignee.login === "RafaDSan") {
        try {
            const status = getValidStatus(payload.issue.state);

            const issueData = {
                title: payload.issue.title,
                state: status,
                number: payload.issue.number,
                html_url: payload.issue.html_url,
                repository: `${payload.repository.owner.login}/${payload.repository.name}`,
                createdAt: payload.issue.created_at,
            };
            
            const result = await createNotionRecord(issueData);
            console.log('Notion record created:', {
                issueNumber: payload.issue.number,
                notionPageId: result.id
            });
        } catch (error) {
            console.error('Error in handleIssueOpened:', {
                issueNumber: payload.issue.number,
                error: error.message,
                stack: error.stack
            });
        }
    } else {
        console.log('Issue not assigned to RafaDSan:', payload.issue.number);
    }
};

export const handleIssueUpdated = async ({ payload }) => {
    console.log('Processing updated issue:', {
        number: payload.issue.number,
        title: payload.issue.title,
        state: payload.issue.state,
        changes: payload.changes,
        assignee: payload.issue.assignee?.login
    });

    if (payload.issue.assignee && payload.issue.assignee.login === "RafaDSan") {
        try {
            const issueData = {
                title: payload.issue.title,
                state: payload.issue.state,
                number: payload.issue.number,
                html_url: payload.issue.html_url,
                repository: `${payload.repository.owner.login}/${payload.repository.name}`,
                createdAt: payload.issue.created_at,
            };

            const result = await updateStatus(issueData);
            console.log('Notion record updated:', {
                issueNumber: payload.issue.number,
                notionPageId: result.id,
                newState: payload.issue.state
            });
        } catch (error) {
            console.error('Error in handleIssueUpdated:', {
                issueNumber: payload.issue.number,
                error: error.message,
                stack: error.stack
            });
        }
    }
};

export const handleIssueStateChanged = async ({ payload }) => {
    console.log('Processing state change:', {
        number: payload.issue.number,
        oldState: payload.changes?.state?.from,
        newState: payload.issue.state,
        assignee: payload.issue.assignee?.login
    });

    if (payload.issue.assignee && payload.issue.assignee.login === "RafaDSan") {
        try {
            const issueData = {
                title: payload.issue.title,
                state: payload.issue.state,
                number: payload.issue.number,
                html_url: payload.issue.html_url,
                repository: `${payload.repository.owner.login}/${payload.repository.name}`,
                createdAt: payload.issue.created_at,
            };

            const result = await updateStatus(issueData);

            if (result) {
                console.log('Notion record state updated:', {
                    issueNumber: payload.issue.number,
                    notionPageId: result.id,
                    oldState: payload.changes?.state?.from,
                    newState: payload.issue.state
                });
            } else {
                console.log(`No existing record found for issue #${payload.issue.number}`);
            }
        } catch (error) {
            console.error('Error in handleIssueStateChanged:', {
                issueNumber: payload.issue.number,
                error: error.message,
                stack: error.stack
            });
        }
    }
};