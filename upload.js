const github = require('@actions/github')
const core = require('@actions/core')
const fs = require('fs').promises

async function upload(
    localPath,
    { token, remotePath, owner, repo, commitMessage, branchName }
) {
    core.debug(
        `upload params:${JSON.stringify({
            token,
            remotePath,
            owner,
            repo,
            commitMessage,
            branchName,
        })}`
    )
    const octokit = github.getOctokit(token)

    // Get SHA
    let sha = ''
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: remotePath,
            ref: branchName,
        })
        sha = data.sha
        core.debug('getContent done')
        core.debug(JSON.stringify(data))
    } catch (error) {
        core.debug('getContent catch')
        core.debug(JSON.stringify(error.data))
        if (error.status === 404) {
            // 404 means remote repository does not have this file, so we do not need SHA
            core.debug('sha does not exist')
            sha = ''
        } else {
            const { status, message } = error
            core.error(`getContent failed. status: ${status}, message: ${message}`)
            throw new Error(message)
        }
    }

    // Get file base64 content
    const file = await fs.readFile(localPath, { encoding: 'base64' })
    core.debug(`file base64: ${file}`)

    // Create or update file
    try {
        const { data } = await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: remotePath,
            message: commitMessage,
            content: file,
            branch: branchName,
            sha,
        })
        core.debug('createOrUpdateFileContents done')
        core.debug(JSON.stringify(data))
        if (data.content.sha === sha) {
            // Won't create a new commit
            core.debug('Same file content, SHA does not changed')
        }
    } catch ({ status, message, response }) {
        core.error(
            `createOrUpdateFileContents Failed. status: ${status}, message: ${message}`
        )
        core.debug(JSON.stringify(response))
        throw new Error(message)
    }
    core.debug(`✔️ Upload ${localPath} Done`)

}

module.exports = upload
