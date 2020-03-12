# github-upload-action
Upload files to GitHub repository

## Usage Example

```yaml
name: Upload to GitHub
on:
  push:
    branches:
      - master
jobs:
  upload_job:
    runs-on: ubuntu-latest
    name: Upload
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        # Setup node first
      - name: Setup node
        uses: actions/setup-node@v1
      - name: Upload to GitHub
        uses: LasyIsLazy/github-upload-action@v0.0.1
        with:
          access-token: ${{ secrets.ACCESS_TOKEN }}
          file-path: localPath
          username: LasyIsLazy
          repo: githubRepo
          remote-dir: remoteDir
 
```

## requirements

1. This action runs on`Node.js`, you must setup `Node.js`, see Usage Example.
2. This action should have access to your GitHub repository. Strongly recommend store it in secrets. [Create a personal access token](https://help.github.com/cn/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) with the `repo` permission. [Create a secret](https://help.github.com/cn/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) named `ACCESS_TOKEN` in your repository and copy access token to the secret value.

## options

| key          | required | example                     | description                                                  |
| ------------ | -------- | --------------------------- | ------------------------------------------------------------ |
| access-token | ✔        | ${{ secrets.ACCESS_TOKEN }} | Token access to repository.                                  |
| file-path    | ✔        | localDir/localPath          | Local file path/directory.                                   |
| username     | ✔        | LasyIsLazy                  | GitHub username.                                             |
| repo         | ✔        | my-repository               | Repository name.                                             |
| remote-dir   |          | remoteDir/remotePath        | Remote repository file path/directory(will be created if not exist). Default: The root of the repository. |

