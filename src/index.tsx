import { join } from "node:path";
import { render } from "ink";
import simpleGit from "simple-git";
import { App } from "./app";
import { loadConfig } from "./config";
import { CacheDirContext } from "./context/cacheContext";
import { ConfigContext } from "./context/configContext";
import { GitContext } from "./context/gitContext";
import { GitHubContext } from "./context/gitHubContext";
import { ShortcutProvider } from "./context/shortcutContext";
import { handleExitAction, isExitAction } from "./exitAction";
import { getRepoName } from "./git";
import { createOctokit, getRepoSlug } from "./gitHub";

try {
	const config = await loadConfig();
	const git = simpleGit();
	const repoName = await getRepoName(git);
	const cacheDir = join(config.worktreeDirectory, repoName);
	const octokit = await createOctokit();
	const { owner, repo } = await getRepoSlug();

	const { waitUntilExit } = render(
		<ConfigContext value={config}>
			<GitContext value={git}>
				<GitHubContext value={{ octokit, owner, repo }}>
					<CacheDirContext value={cacheDir}>
						<ShortcutProvider>
							<App />
						</ShortcutProvider>
					</CacheDirContext>
				</GitHubContext>
			</GitContext>
		</ConfigContext>,
		{
			stdout: process.stderr,
		},
	);

	const output = await waitUntilExit();
	if (isExitAction(output)) {
		await handleExitAction(output);
	} else if (typeof output === "string") {
		process.stdout.write(`${output}\n`);
	}
} catch (error) {
	process.stderr.write(
		`gh-interactive failed: ${error instanceof Error ? error.message : String(error)}\n`,
	);
	process.exit(1);
}
