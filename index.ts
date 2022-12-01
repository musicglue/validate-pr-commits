import * as core from "@actions/core";
import * as github from "@actions/github";

const validEvent = new Set(["pull_request", "pull_request_target"]);

!(async function main() {
  try {
    const {
      eventName,
      payload: { repository: repo, pull_request: pr },
    } = github.context;

    if (repo == null || pr == null) {
      throw new Error("Repo or PR is undefined");
    }

    if (validEvent.has(eventName)) {
      throw new Error(`Unsupported event: "${eventName}"`);
    }

    const token = core.getInput("token");
    const octokit = new github.GitHub(token);

    const { data: commits } = await octokit.pulls.listCommits({
      owner: repo.owner.login,
      repo: repo.name,
      pull_number: pr.number,
    });

    core.setOutput(
      "commits",
      JSON.stringify(
        commits.map(({ commit: { message }, sha }) => ({
          commit: { message },
          sha,
        }))
      )
    );
  } catch (error) {
    core.setFailed((error as Error).message);
  }
})();
