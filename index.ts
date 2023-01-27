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
    const maxSubjectLen = parseFloat(core.getInput("maxSubjectLine"));
    const octokit = github.getOctokit(token);

    if (Number.isNaN(maxSubjectLen)) {
      throw new Error(`Invalid maxSubjectLine: "${maxSubjectLen}"`);
    }

    core.debug(`maxSubjectLine=${maxSubjectLen}`);

    const { data: commits } = await octokit.rest.pulls.listCommits({
      owner: repo.owner.login,
      repo: repo.name,
      pull_number: pr.number,
    });

    // Using .forEach instead of .some/.all so that all commits are validated in one go, instead of
    // making it a game of whack-a-mole
    commits.forEach(({ commit: { message }, sha }) => {
      // discard the extended message, we only care about the subject line
      const subjectLine = message.split("\n\n").shift()!.replace(/\n/g, "");

      core.debug(`checking: "${subjectLine}"`);

      if (subjectLine.length > maxSubjectLen) {
        core.error(`error: length sha=${sha} subject="${subjectLine}"`);
      }

      if (!ccFormat.test(subjectLine)) {
        core.error(`error: format sha=${sha} subject="${subjectLine}"`);
      }
    });
  } catch (error) {
    core.setFailed((error as Error).message);
  }
})();
