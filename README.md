# get-pr-commits

A GitHub Action that get commits in current pull-request

## Usage

```yaml
jobs:
  commits_check_job:
    runs-on: ubuntu-latest
    name: Commits Check
    steps:
      - name: Get PR Commits
        id: "get-pr-commits"
        uses: thislooksfun/get-pr-commits@master
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Get abbreviated PR Commits
        id: "get-pr-commits"
        uses: thislooksfun/get-pr-commits@master
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```
