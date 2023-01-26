import * as core from "@actions/core";
import * as github from "@actions/github";

const validEvent = new Set(["pull_request", "pull_request_target"]);
const ccFormat = /^(chore|docs|feat|fix|refactor|style|test)(\([^)]+\))?: .+$/;

!(async function main() {
  try {
    const {
      eventName,
      payload: { repository: repo, pull_request: pr },
    } = github.context;

    if (repo == null || pr == null) {
      core.debug(`repo is null=${repo == null}, pr is null==${pr == null}`);
      throw new Error("Repo or PR is undefined");
    }

    if (!validEvent.has(eventName)) {
      throw new Error(`Unsupported event: "${eventName}"`);
    }

    const token = core.getInput("token");
    const maxSubjectLen = parseFloat(core.getInput("maxSubjectLen"));
    const warnOnly = core.getInput("warnOnly") == "true";
    const octokit = github.getOctokit(token);

    if (Number.isNaN(maxSubjectLen)) {
      throw new Error(`Invalid maxSubjectLen: "${maxSubjectLen}"`);
    }

    const { data: commits } = await octokit.rest.pulls.listCommits({
      owner: repo.owner.login,
      repo: repo.name,
      pull_number: pr.number,
    });

    let pass = true;

    const validationErr = warnOnly
      ? core.warning.bind(core)
      : core.error.bind(core);

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
        validationErr(
          `subject line too long (${subjectLine.length}>${maxSubjectLen}) for commit "${sha}"`
        );
      }

      if (!ccFormat.test(subjectLine)) {
        pass = false;
        validationErr(
          `subject line doesn't follow commit conventions for commit "${sha}"`
        );
      }
    });

    if (!pass && !warnOnly) {
      core.setFailed(
        `one or more commits are in conflict with commit conventions`
      );
    }
  } catch (error) {
    core.setFailed((error as Error).message);
  }
})();
