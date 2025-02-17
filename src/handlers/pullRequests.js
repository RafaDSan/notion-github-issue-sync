export const handlePullRequestOpened = async ({ octokit, payload }) => {
    console.log(`Received a pull request event for #${payload.pull_request.number}`);

    try {
        await octokit.rest.issues.createComment({
            owner: payload.repository.owner.loginm,
            repo: payload.repository.name,
            issue_number: payload.pull_request.number,
            body: "test message",
        });
    } catch (error) {
        console.error(`Error! Status: ${error.response.status}. Message: ${error.response.message}`);
    }
};