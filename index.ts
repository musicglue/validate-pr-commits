import * as core from "@actions/core";
import * as github from "@actions/github";

const validEvent = new Set(["pull_request", "pull_request_target"]);
const ccFormat = /^(chore|docs|feat|fix|refactor|style|test)(\([^)]+\))?: .+$/;
const maxSubjectLen = 75;

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
    const octokit = github.getOctokit(token);

    const { data: commits } = await octokit.rest.pulls.listCommits({
      owner: repo.owner.login,
      repo: repo.name,
      pull_number: pr.number,
    });

    let pass = true;

    // Using .forEach instead of .some/.all so that all commits are validated in one go, instead of
    // making it a game of whack-a-mole
    commits.forEach(({ commit: { message }, sha }) => {
      const subjectLine = message.split("\n").pop();

      if (subjectLine == null) {
        pass = false;
        core.error(`empty subject line for "${sha}"`);
        return;
      }

      if (subjectLine.length > maxSubjectLen) {
        pass = false;
        core.error(
          `subject line too long (${subjectLine.length}>${maxSubjectLen}) for commit "${sha}"`
        );
      }

      if (!ccFormat.test(subjectLine)) {
        pass = false;
        core.error(
          `subject line doesn't follow commit conventions for commit "${sha}"`
        );
      }
    });

    if (!pass) {
      core.setFailed(
        `one or more commits are in conflict with commit conventions`
      );
    }
  } catch (error) {
    core.setFailed((error as Error).message);
  }
})();
