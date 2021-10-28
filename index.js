const core = require("@actions/core");
const github = require("@actions/github");

const validEvent = ["pull_request", "pull_request_target"];

const keypathError =
  "keep_keypaths must be a non-empty array of non-empty arrays of strings or numbers";

function copyKeypath(source, dest, keypath) {
  const key = keypath[0];
  if (!["string", "number"].includes(typeof key)) {
    throw new Error(keypathError);
  }

  if (!(key in source)) return dest;

  const newDest = Object.assign({}, dest);
  if (keypath.length > 1) {
    if (typeof source[key] !== "object") return dest;
    if (!(key in newDest)) {
      const newVal = copyKeypath(source[key], {}, keypath.slice(1));
      if (Object.entries(newVal).length === 0) return dest;
      newDest[key] = newVal;
    } else {
      newDest[key] = copyKeypath(source[key], newDest[key], keypath.slice(1));
    }
  } else {
    newDest[key] = source[key];
  }

  return newDest;
}

function onlyKeepKeypaths(raw_keypaths) {
  const keypaths = JSON.parse(raw_keypaths);
  if (!Array.isArray(keypaths) || keypaths.length === 0) {
    throw new Error(keypathError);
  }

  return commit => {
    let out = {};

    for (const keypath of keypaths) {
      if (!Array.isArray(keypath) || keypath.length === 0) {
        throw new Error(keypathError);
      }

      out = copyKeypath(commit, out, keypath);
    }

    return out;
  };
}

async function main() {
  try {
    const {
      eventName,
      payload: { repository: repo, pull_request: pr },
    } = github.context;

    if (validEvent.indexOf(eventName) < 0) {
      core.error(`Invalid event: ${eventName}`);
      return;
    }

    const token = core.getInput("token");
    const keep_keypaths = core.getInput("keep_keypaths");
    const octokit = new github.GitHub(token);

    const commits = await octokit.pulls.listCommits({
      owner: repo.owner.login,
      repo: repo.name,
      pull_number: pr.number,
    }).data;

    if (keep_keypaths) {
      commits = commits.map(onlyKeepKeypaths(keep_keypaths));
    }

    core.setOutput("commits", JSON.stringify(commits));
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
