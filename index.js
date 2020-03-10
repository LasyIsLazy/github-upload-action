const fs = require('fs')
const path = require('path')
const upload = require('./upload.js')
const core = require('@actions/core')
const inputPath = core.getInput('file-path')
const inputRemoteDir = core.getInput('remote-dir')
const inputUsername = core.getInput('username')
const inputRepo = core.getInput('repo')
core.debug('inputPath: ' + inputPath)
core.debug('inputRemoteDir: ' + inputRemoteDir)
core.debug('inputUsername: ' + inputUsername)
core.debug('inputRepo: ' + inputRepo)
if (!fs.existsSync(inputPath)) {
  core.setFailed(`filePath doesn't exist: ${inputPath}`)
  return
}

function getAllFilePaths(curPath, paths = []) {
  const dir = fs.readdirSync(curPath)
  dir.forEach(item => {
    const itemPath = path.join(curPath, item)
    const stat = fs.lstatSync(itemPath)
    if (stat.isDirectory()) {
      getAllFilePaths(itemPath, paths)
    } else {
      paths.push(itemPath)
    }
  })
  return paths
}

const filePaths = getAllFilePaths(inputPath)

async function uploadAll() {
  for (let index = 0; index < filePaths.length; index++) {
    const curPath = filePaths[index]
    const remotePath = path.join(
      // `remotePath` can not start with `/`
      inputRemoteDir.replace(/^\//, ''),
      path.relative(inputPath, curPath)
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
        remotePath
      })
    } catch (error) {
      core.setFailed(error)
    }
  }
}

uploadAll()
