const fs = require('fs')
const path = require('path')
const upload = require('./upload.js')
const core = require('@actions/core')
const checkBranch = require('./checkBranch.js')
const inputPath = core.getInput('file-path')
const inputRemoteDir = core.getInput('remote-dir')
const inputOwner = core.getInput('owner')
const inputRepo = core.getInput('repo')
const commitMessage = core.getInput('commit-message')
const branchName = core.getInput('branch-name')
const token = core.getInput('access-token')
core.debug('Input path: ' + inputPath)
core.debug('Input remoteDir: ' + inputRemoteDir)
core.debug('Input owner: ' + inputOwner)
core.debug('Input repo: ' + inputRepo)
core.debug('Input commitMessage: ' + commitMessage)
core.debug('Input branchName: ' + branchName)

if (!fs.existsSync(inputPath)) {
    core.setFailed(`filePath doesn't exist: ${inputPath}`)
    return
}

if (inputRepo.indexOf('/') !== -1) {
    core.setFailed(
        'inputRepo cannot contain any slashes use the owner parameter to indicate the owner'
    )
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
    try {
        await checkBranch({
            token,
            owner: inputOwner,
            repo: inputRepo,
            branchName,
        })
    } catch (error) {
        core.setFailed(`checkBranch failed: ${error}`)
        return
    }

    for (let index = 0; index < filePaths.length; index++) {
        const curPath = filePaths[index]
        const remotePath = path.join(
            // `remotePath` can not start with `/`
            inputRemoteDir.replace(/^\//, ''),
            path.relative(localDir, curPath)
        )
        core.debug(
            `Upload ${curPath} to ${remotePath} on branch ${branchName} for repository ${inputRepo}`
        )
        try {
            await upload(curPath, {
                token,
                owner: inputOwner,
                repo: inputRepo,
                commitMessage,
                remotePath,
                branchName,
            })
        } catch (error) {
            core.setFailed(`Upload ${curPath} failed: ${error}`)
            return
        }
    }
}

uploadAll()
