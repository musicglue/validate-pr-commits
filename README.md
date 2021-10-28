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
          # This only keeps the following structure for each commit:
          # { "sha": "<sha>", "commit": {"message": "<commit message>" } }
          # All other information is discarded.
          keep_keypaths: "[[""sha""], [""commit"", ""message""]]"
```
