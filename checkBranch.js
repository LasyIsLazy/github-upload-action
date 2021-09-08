/**
 * API: https://docs.github.com/en/rest/reference/repos#get-a-branch
 */
 const axios = require('axios')
 const path = require('path')
 const core = require('@actions/core')
const { connected } = require('process')
 
 async function checkBranch(
   { Authorization, owner, repo, branchName }
 ) {
     
   // load api url from context
   let BASE_URL = process.env.GITHUB_API_URL
   core.debug(`Using API url: ${BASE_URL}`)
   core.debug(`Checking if branch exists with name ${branchName} in repo ${repo}`)
 
   const url =
     BASE_URL +
     path.posix.join(
       `/repos/${owner}/${repo}/branches`
     )
   core.debug(`Request URL: ${url}`)
   // load all branches, since we need the info about the default branch as well
   const res = await axios({
     method: 'get',
     url,
     responseType: 'application/json',
     headers: {
       Authorization,
       'Content-Type': 'application/json'
     }
   })
   .then(({data}) => { 
     // result succesful
     let jsonResult = JSON.stringify(data);
     core.debug(`Succesful API call with result: ${jsonResult}`)
     return { data: data } 
    })
   .catch(err => {
     if (err.toString() !== 'Error: Request failed with status code 404') {
       console.log(err)
     }
     // errors should not happen
     return { data: { } }
   })
   let branches = res.data

   let json = JSON.stringify(branches);
   core.debug(`Branches: ${json}`)

   if (branches == null) {
       core.debug(`Error loading existing branches from API`)
       return null
   }

   // check if the branch name already exists
   let branch = branches.find(function(branch) { return branch.name === branchName })

   if (branch) {
    core.debug(`Branch with name ${branchName} already exists, continuing as normal`)
    return { }
   }
   else {
    console.log(`Need to create a new branch first with name ${branchName}`)
    let defaultBranch = branches[0]
    console.log(`Found default branch to branch of: ${defaultBranch.name} with sha: ${defaultBranch.commit.sha}`)

    let branchCreateUrl = BASE_URL +
      path.posix.join(
        `/repos/${owner}/${repo}/git/refs`
      )
    core.debug(`Request URL to create new branch: ${branchCreateUrl}`)

    return axios({
        method: 'post',
        url: branchCreateUrl,
        responseType: 'application/json',
        headers: {
        Authorization,
        'Content-Type': 'application/json'
        },
        data: {
            ref: `refs/heads/${branchName}`,
            sha: defaultBranch.commit.sha
        }
    }).then(({ data }) => {
        core.debug(`Branch with name ${defaultBranch.name} created`)
        // return non empty object to check on
        console.log(`Created new branch with ref: ${data.ref} based on ${defaultBranch.name}`)        
        return { }
    }).catch(err => {
        core.debug(`Error creatng new branch: ${err}`)
        console.log(`Error creating the branch with name ${branchName} and sha ${defaultBranch.commit.sha}: ${error}`)
        return null
    })
    }
 }
 module.exports = checkBranch
 