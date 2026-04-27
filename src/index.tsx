import { join } from "node:path";
import { render } from "ink";
import simpleGit from "simple-git";
import { App } from "./app";
import { loadConfig } from "./config";
import { CacheDirContext } from "./context/cacheContext";
import { ConfigContext } from "./context/configContext";
import { GitContext } from "./context/gitContext";
import { getRepoName } from "./git";

try {
	const config = await loadConfig();
	const git = simpleGit();
	const repoName = await getRepoName(git);
	const cacheDir = join(config.worktreeDirectory, repoName);

	const { waitUntilExit } = render(
		<ConfigContext value={config}>
			<GitContext value={git}>
				<CacheDirContext value={cacheDir}>
					<App />
				</CacheDirContext>
			</GitContext>
		</ConfigContext>,
		{
			stdout: process.stderr,
		},
	);

	const output = await waitUntilExit();
	if (typeof output === "string") {
		process.stdout.write(`${output}\n`);
	}
} catch (error) {
	process.stderr.write(
		`gh-interactive failed: ${error instanceof Error ? error.message : String(error)}\n`,
	);
	process.exit(1);
}
