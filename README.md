# validate-pr-commits

A GitHub Action that validates commit subjects in the current PR

## Usage

```yaml
jobs:
  commits_check_job:
    runs-on: ubuntu-latest
    name: Commits Check
    steps:
      - name: Validate PR commits
        id: "validate-pr-commits"
        uses: musicglue/validate-pr-commits@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```
