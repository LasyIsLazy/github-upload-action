const fs = require('fs')
const path = require('path')
const upload = require('./upload.js')
const core = require('@actions/core')
const inputPath = core.getInput('file-path')
const inputRemoteDir = core.getInput('remote-dir')
const inputUsername = core.getInput('username')
const inputRepo = core.getInput('repo')
const commitMessage = core.getInput('commit-message')
core.debug('Input path: ' + inputPath)
core.debug('Input remoteDir: ' + inputRemoteDir)
core.debug('Input username: ' + inputUsername)
core.debug('Input repo: ' + inputRepo)
core.debug('Input commitMessage: ' + commitMessage)
if (!fs.existsSync(inputPath)) {
  core.setFailed(`filePath doesn't exist: ${inputPath}`)
  return
}
const isInputPathDir = fs.lstatSync(inputPath).isDirectory()
const localDir = isInputPathDir ? inputPath : ''

function getAllFilePaths(curDir) {
  function search(curPath, paths = []) {
    const dir = fs.readdirSync(curPath)
    dir.forEach(item => {
      const itemPath = path.join(curPath, item)
      const stat = fs.lstatSync(itemPath)
      if (stat.isDirectory()) {
        search(itemPath, paths)
      } else {
        paths.push(itemPath)
      }
    })
    return paths
  }
  return search(curDir)
}

const filePaths = isInputPathDir ? getAllFilePaths(inputPath) : [inputPath]
core.debug(`filePaths: ${filePaths}`)

async function uploadAll() {
  for (let index = 0; index < filePaths.length; index++) {
    const curPath = filePaths[index]
    const remotePath = path.join(
      // `remotePath` can not start with `/`
      inputRemoteDir.replace(/^\//, ''),
      path.relative(localDir, curPath)
    )
    console.log(`Upload ${curPath} to ${remotePath}`)
    const base64Cotent = fs.readFileSync(curPath, {
      encoding: 'base64'
    })
    try {
      await upload(base64Cotent, {
        Authorization: `Bearer ${core.getInput('access-token')}`,
        username: inputUsername,
        repo: inputRepo,
        commitMessage,
        remotePath
      })
    } catch (error) {
      core.setFailed(error)
    }
  }
}

uploadAll()
