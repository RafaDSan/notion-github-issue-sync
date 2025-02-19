import { createNotionRecord, updateStatus } from '../services/notion.js'

export const handleIssueOpened = async ({ payload }) => {
  console.log('Processing opened issue:', {
    number: payload.issue.number,
    title: payload.issue.title,
    state: payload.issue.state,
    assignee: payload.issue.assignee?.login
  })

  if (payload.issue.assignee && payload.issue.assignee.login === 'RafaDSan') {
    try {
      const issueData = {
        title: payload.issue.title,
        state: payload.issue.state,
        number: payload.issue.number,
        html_url: payload.issue.html_url,
        repository: `${payload.repository.owner.login}/${payload.repository.name}`,
        createdAt: payload.issue.created_at
      }

      const result = await createNotionRecord(issueData)
      console.log('Notion record created:', {
        issueNumber: payload.issue.number,
        notionPageId: result.id
      })
    } catch (error) {
      console.error('Error in handleIssueOpened:', {
        issueNumber: payload.issue.number,
        error: error.message,
        stack: error.stack
      })
    }
  } else {
    console.log('Issue not assigned to RafaDSan:', payload.issue.number)
  }
}

export const handleIssueStateChanged = async ({ payload }) => {
  console.log('Processing state change:', {
    number: payload.issue.number,
    oldState: payload.changes?.state?.from,
    newState: payload.issue.state,
    assignee: payload.issue.assignee?.login,
    closedAt: payload.issue.closed_at
  })

  if (payload.issue.assignee && payload.issue.assignee.login === 'RafaDSan') {
    try {
      const issueData = {
        title: payload.issue.title,
        state: payload.issue.state,
        number: payload.issue.number,
        html_url: payload.issue.html_url,
        repository: `${payload.repository.owner.login}/${payload.repository.name}`,
        createdAt: payload.issue.created_at,
        closedAt: payload.issue.closed_at
      }

      const result = await updateStatus(issueData)

      if (result) {
        console.log('Notion record state updated:', {
          issueNumber: payload.issue.number,
          notionPageId: result.id,
          oldState: payload.changes?.state?.from,
          newState: payload.issue.state,
          closedAt: payload.issue.closed_at
        })
      } else {
        console.log(`No existing record found for issue #${payload.issue.number}`)
      }
    } catch (error) {
      console.error('Error in handleIssueStateChanged:', {
        issueNumber: payload.issue.number,
        error: error.message,
        stack: error.stack
      })
    }
  }
}
