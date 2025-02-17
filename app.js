import dotenv from 'dotenv'
import fs from 'fs'
import http from 'http'
import SmeeClient from 'smee-client'
import { Octokit, App } from 'octokit'
import { createNodeMiddleware } from '@octokit/webhooks'
import { Client } from '@notionhq/client'



// Load environment variables from .env file
dotenv.config()

// Set configured values
const appId = process.env.APP_ID
const privateKeyPath = process.env.PRIVATE_KEY_PATH
const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
const secret = process.env.WEBHOOK_SECRET
const enterpriseHostname = process.env.ENTERPRISE_HOSTNAME
const messageForNewPRs = fs.readFileSync('./message.md', 'utf8')

const port = process.env.PORT || 3000
const path = '/api/webhook'

const smee = new SmeeClient({
  source: process.env.WEBHOOK_PROXY_URL,
  target: `http://localhost:${port}${path}`,
  logger: console
})

// Start the Smee client
const events = smee.start()

// When stopping the application, stop the Smee client
process.on('SIGTERM', () => {
  events.close()
  process.exit()
})

// Create an authenticated Notion client to interact with the Notion API
const notion = new Client({ auth: process.env.NOTION_KEY });

// Create an authenticated Octokit client authenticated as a GitHub App to interact with the Github API
// Authenticates as the Github APP in the github api
const app = new App({
  appId,
  privateKey,
  webhooks: {
    secret
  },
  ...(enterpriseHostname && {
    Octokit: Octokit.defaults({
      baseUrl: `https://${enterpriseHostname}/api/v3`
    })
  })
})


// Optional: Get & log the authenticated app's name
const { data } = await app.octokit.request('/app')

// Read more about custom logging: https://github.com/octokit/core.js#logging
app.octokit.log.debug(`Authenticated as '${data.name}'`)

// Function to create a new record in Notion
async function createNotionRecord(issue) {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID
      },
      properties: {
        'Title': {
          title: [
            {
              text: {
                content: issue.title
              }
            }
          ]
        },
        'Status': {
          status: {
            name: issue.state
          }
        },
        'Github Issue Number': {
          number: issue.number
        },
        'Github URL': {
          url: issue.html_url
        },
        'Repository': {
          rich_text: [
            {
              text: {
                content: issue.repository
              }
            }
          ]
        },
        'CreatedAt': {
          date: {
            start: issue.createdAt
          }
        }
      }
    });

    console.log("Sucessfuly created Notion record", response);
    return response;
  } catch (error) {
    if (error.response) {
      console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
    } else {
      console.error(error)
    }
  }
}

// Subscribe to the "pull_request.opened" webhook event
app.webhooks.on('pull_request.opened', async ({ octokit, payload }) => {
  console.log(`Received a pull request event for #${payload.pull_request.number}`)
  try {
    await octokit.rest.issues.createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.pull_request.number,
      body: messageForNewPRs
    })
  } catch (error) {
    if (error.response) {
      console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
    } else {
      console.error(error)
    }
  }
})

app.webhooks.on('issues.opened', async ({ payload }) => {
  console.log(`Received a new issue event for #${payload.issue.number}`);

  try {
    // Prepare issue Data for notion
    const issueData = {
      title: payload.issue.title,
      state: payload.issue.state,
      number: payload.issue.number,
      html_url: payload.issue.html_url,
      repository: `${payload.repository.owner.login}/${payload.repository.name}`,
      createdAt: payload.issue.created_at
    };

    // Create record in Notion
    await createNotionRecord(issueData);

    console.log(`Successfully created Notion record for issue #${payload.issue.number}`);
  } catch(error) {
    console.error(`Error processing issue #${payload.issue.number}`, error);
  }
});

// Optional: Handle errors
app.webhooks.onError((error) => {
  if (error.name === 'AggregateError') {
    // Log Secret verification errors
    console.log(`Error processing request: ${error.event}`)
  } else {
    console.log(error)
  }
})

// Launch a web server to listen for GitHub webhooks

const localWebhookUrl = `http://localhost:${port}${path}`

// See https://github.com/octokit/webhooks.js/#createnodemiddleware for all options
const middleware = createNodeMiddleware(app.webhooks, { path })

http.createServer(middleware).listen(port, () => {
  console.log(`Server is listening for events at: ${localWebhookUrl}`)
  console.log('Press Ctrl + C to quit.')
})
