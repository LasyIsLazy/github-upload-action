/**
 * API: https://developer.github.com/v3/repos/contents
 */
const axios = require('axios')
const path = require('path')
const core = require('@actions/core')

async function upload(
  base64Content,
  { Authorization, remotePath, username, repo, commitMessage, branchName }
) {
    
  // load api url from context
  let BASE_URL = process.env.GITHUB_API_URL
  core.debug(`Using API url: ${BASE_URL}`)

  const url =
    BASE_URL +
    path.posix.join(
      `/repos/${username}/${repo}/contents`,
      // GitHub API will decode the remotePath
      encodeURIComponent(remotePath)
    )
  core.debug(`Request URL: ${url}`)
  // if content exists
  const res = await axios({
    method: 'get',
    url,
    responseType: 'application/json',
    headers: {
      Authorization,
      'Content-Type': 'application/json'
    }
  }).catch(err => {
    if (err.toString() !== 'Error: Request failed with status code 404') {
      console.log(err)
    }
    // 404 means remote repository does not have this file, so we do not need SHA
    return { data: { sha: '' } }
  })
  const sha = (res.data && res.data.sha) || ''
  core.debug(`Get SHA: ${sha}`)

  return axios({
    method: 'put',
    url,
    responseType: 'application/json',
    headers: {
      Authorization,
      'Content-Type': 'application/json'
    },
    data: {
      message: commitMessage,
      sha,
      content: base64Content,
      branch: branchName
    }
  }).then(({ data }) => {
    const { path, sha: currentSha } = data.content
    /**
     * - sha: remote file's SHA
     * - currentSha: uploaded file's SHA
     * Can be use to identify if they are same file
     */
    return {
      uploadPath: path,
      sha,
      currentSha
    }
  })
}
module.exports = upload
