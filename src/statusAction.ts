import { formatError } from "./util";

/**
 * Runs an async action with status feedback. Sets a progress message
 * before the action, a success message on completion (if the action
 * returns a string), and an error message if the action throws.
 *
 * Errors are swallowed into UI state — callers will not see a rejected
 * promise. This matches the TUI pattern where failures are shown
 * inline rather than propagated.
 */
export async function withStatus(
	setStatus: (s: string | null) => void,
	progressMsg: string,
	// biome-ignore lint/suspicious/noConfusingVoidType: TypeScript requires void (not undefined) to accept async functions with no return
	fn: () => Promise<string | void>,
): Promise<void> {
	setStatus(progressMsg);
	try {
		const result = await fn();
		if (result !== undefined) {
			setStatus(result);
		}
	} catch (err) {
		setStatus(`Error: ${formatError(err)}`);
	}
}
