import { Client } from '@notionhq/client'
import { notionKey, notionDatabaseId } from '../config/env.js'

const notion = new Client({ auth: notionKey })

const statusMapping = {
  open: 'Open',
  closed: 'Done',
  reopened: 'Open'
}

// This function checks if an issue already exists in the Notion database
// by searching for matching GitHub Issue Number and Repository
async function findExistingRecord (issueNumber, repository) {
  try {
    const response = await notion.databases.query({
      database_id: notionDatabaseId,
      filter: {
        and: [
          {
            property: 'Github Issue Number',
            number: {
              equals: issueNumber
            }
          },
          {
            property: 'Repository',
            rich_text: {
              equals: repository
            }
          }
        ]
      }
    })

    return response.results.length > 0 ? response.results[0] : null
  } catch (error) {
    console.error('Error checking for existing record', error)
    throw error
  }
}

// function to update the status of an existing record if the state has changes
export const updateStatus = async (issue) => {
  try {
    const existingRecord = await findExistingRecord(issue.number, issue.repository)

    if (!existingRecord) {
      console.log(`No record found for issue #${issue.number}. Cannot update status.`)
      return null
    }

    const pageId = existingRecord.id

    // Get the valid status for the current state
    const status = await getValidStatus(issue.state)

    console.log('Updating record:', {
      issueNumber: issue.number,
      status,
      closedAt: issue.date === 'closed' ? issue.closedAt : null
    })

    const updateProperties = {
      Status: {
        status: { name: status }
      }
    }

    if (issue.state === 'closed' && issue.closedAt) {
      updateProperties.ClosedAt = {
        date: {
          start: issue.closedAt
        }
      }
    }

    // Perform the update with the page_id
    const response = await notion.pages.update({
      page_id: pageId,
      properties: updateProperties
    })

    console.log(`Updated status for issue #${issue.number} to: ${status}`)
    return response
  } catch (error) {
    console.error(`Error updating existing record for issue #${issue.number}:`, error)
    throw error
  }
}

export const getValidStatus = async (githubState) => {
  try {
    const database = await notion.databases.retrieve({
      database_id: notionDatabaseId
    })

    const statusProperty = database.properties.Status
    if (!statusProperty || statusProperty.type !== 'status') {
      throw new Error('Status property not found or is not of type "status"')
    }

    const validStatuses = statusProperty.status.options.map(option => option.name)
    const mappedStatus = statusMapping[githubState]
    console.log('validStatuses: ', validStatuses)
    console.log('mappedStatus: ', mappedStatus)

    if (!validStatuses.includes(mappedStatus)) {
      console.warn(`Warning: Status "${mappedStatus}" not found in Notion database. Valid options are ${validStatuses.join(', ')}`)
      return validStatuses[0]
    }

    return mappedStatus
  } catch (error) {
    console.error('Error validating status:', error)
    return 'Not started'
  }
}
// async function getValidStatus(githubState) {
//     try {
//         const database = await notion.databases.retrieve({
//             database_id: notionDatabaseId
//         });

//         const statusProperty = database.properties['Status'];
//         if (!statusProperty || statusProperty.type !== 'status') {
//             throw new Error ('Status property not found or is not of type "status"');
//         }

//         const validStatuses = statusProperty.status.options.map(option => option.name);
//         const mappedStatus = statusMapping[githubState];
//         console.log("validStatuses: ", validStatuses);
//         console.log("mappedStatus: ", mappedStatus)

//         if (!validStatuses.includes(mappedStatus)) {
//             console.warn(`Warning: Status "${mappedStatus}" not found in Notion database. Valid options are ${validStatuses.join(', ')}`)
//             return validStatuses[0];
//         }

//         return mappedStatus;
//     } catch (error) {
//         console.error('Error validating status:', error);
//         return 'Not started';
//     }
// }

export const createNotionRecord = async (issue) => {
  try {
    // Check if record alrerady exists
    const existingRecord = await findExistingRecord(issue.number, issue.repository)

    if (existingRecord) {
      console.log(`Record already exists for issue #${issue.number} in ${issue.repository}. Skipping creation.`)
      return {
        status: 'skipped',
        message: 'Record already exists',
        existingRecord
      }
    }

    // If no existing record, create a new one
    const status = await getValidStatus(issue.state)

    const properties = {
      Title: {
        title: [{ text: { content: issue.title } }]
      },
      Status: {
        status: { name: status }
      },
      'Github Issue Number': {
        number: issue.number
      },
      'Github URL': {
        url: issue.html_url
      },
      Repository: {
        rich_text: [{ text: { content: issue.repository } }]
      },
      CreatedAt: {
        date: { start: issue.createdAt }
      }
    }

    // Add ClosedAt if the issue is already closed when created
    if (issue.state === 'closed' && issue.closedAt) {
      properties.ClosedAt = {
        date: { start: issue.closedAt }
      }
    }

    const response = await notion.pages.create({
      parent: { database_id: notionDatabaseId },
      properties
    })

    console.log(`Created new Notion record for issue #${issue.number} with status ${status}`)
    return response
  } catch (error) {
    console.error(`Error handling Notion record for issue #${issue.number}`, error)
    throw error
  }
}
