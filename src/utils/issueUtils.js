export const filterIssuesByAssignee = (issues, assigneeLogin) => {
  return issues.filter((issue) => {
    return issue.assignee && issue.assignee.login === assigneeLogin
  })
}
