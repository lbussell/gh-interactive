import { render } from "ink";
import { App } from "./app";
import { loadConfig } from "./config";
import { ConfigContext } from "./config-context";

try {
	const config = await loadConfig();
	const { waitUntilExit } = render(
		<ConfigContext value={config}>
			<App />
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
