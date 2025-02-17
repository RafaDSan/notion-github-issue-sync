import { Client } from '@notionhq/client';
import { notionKey, notionDatabaseId } from '../config/env.js'

const notion = new Client({ auth: notionKey });

export const createNotionRecord = async (issue) => {
    try {
        const response = await notion.pages.create({
            parent: { database_id: notionDatabaseId },
            properties: {
                'Title': {
                    title: [{ text: { content: issue.title } }],
                },
                'Status': {
                    status: { name: issue.state },
                },
                'Github Issue Number': {
                    number: issue.number,
                },
                'Github URL': {
                    url: issue.html_url,
                },
                'Repository': {
                    rich_text: [{ text: { content: issue.repository } }],
                },
                'CreatedAt': {
                    date: {start: issue.createdAt},
                },
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
};