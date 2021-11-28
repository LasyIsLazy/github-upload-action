/**
 * API: https://docs.github.com/en/rest/reference/repos#get-a-branch
 */
const core = require('@actions/core')
const github = require('@actions/github')

async function checkBranch({ token, owner, repo, branchName }) {
    const octokit = github.getOctokit(token)

    core.debug(
        `Checking if branch exists with name ${branchName} in repo ${repo}`
    )

    // load all branches, since we need the info about the default branch as well
    const { data: branches } = await octokit.rest.repos
        .listBranches({ owner, repo })
        .catch(({ status, data, message }) => {
            core.error('Error loading existing branches from API')
            core.debug(`status: ${status}`)
            core.error(JSON.stringify(data))
            throw new Error(message)
        })
    core.debug(`Branches: ${JSON.stringify(branches)}`)

    if (!branches || !branches.length) {
        throw new Error('No branches found')
    }

    // check if the branch name already exists
    let branch = branches.find(function (branch) {
        return branch.name === branchName
    })

    if (branch) {
        core.debug(
            `Branch with name ${branchName} already exists, continuing as normal`
        )
        core.debug('✔️ Check branch Done')
        return branch
    } else {
        core.debug(`Need to create a new branch first with name ${branchName}`)
        let defaultBranch = branches[0]
        core.debug(
            `Found default branch to branch of: ${defaultBranch.name} with sha: ${defaultBranch.commit.sha}`
        )

        // Docs: https://octokit.github.io/rest.js/v18#git-create-ref
        const { data } = await octokit.rest.git
            .createRef({
                owner,
                repo,
                ref: `refs/heads/${branchName}`,
                sha: defaultBranch.commit.sha,
            })
            .catch(err => {
                core.error(`Error creatng new branch: ${err}`)
                throw err
            })
        core.debug(
            `Created new branch with ref: ${data.ref} based on ${defaultBranch.name}`
        )
    }
    core.debug('✔️ Check branch Done')
}
module.exports = checkBranch
