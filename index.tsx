import { render } from "ink";
import simpleGit from "simple-git";
import { App } from "./app";
import { loadConfig } from "./config";
import { ConfigContext } from "./config-context";
import { GitContext } from "./git-context";

try {
	const config = await loadConfig();
	const git = simpleGit();
	const { waitUntilExit } = render(
		<GitContext value={git}>
			<ConfigContext value={config}>
				<App />
			</ConfigContext>
		</GitContext>,
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
