import { createNodeMiddleware } from '@octokit/webhooks'
import { githubApp } from './services/github.js'
import { handleIssueOpened, handleIssueStateChanged } from './handlers/issues.js'

export const initializeApp = async () => {
  const app = await githubApp

  // Debug logging for webhook registration
  console.log('Registering webhook handlers...')

  // Subscribe to events
  app.webhooks.on('issues', async ({ payload }) => {
    if (payload.action === 'opened') {
      await handleIssueOpened({ payload })
    } else if (payload.action === 'closed') {
      await handleIssueStateChanged({ payload })
    } else if (payload.action === 'reopened') {
      await handleIssueStateChanged({ payload })
    }
  })

  // Error handling
  app.webhooks.onError((error) => {
    console.error('Webhook error details:', {
      name: error.name,
      message: error.message,
      event: error.event?.name,
      action: error.event?.payload?.action
    })
  })

  // Log all incoming webhook events for debugging
  app.webhooks.onAny(({ id, name, payload }) => {
    console.log('Webhook event received:', {
      id,
      name,
      action: payload.action,
      issueNumber: payload.issue?.number
    })
  })

  return createNodeMiddleware(app.webhooks, { path: '/api/webhook' })
}
