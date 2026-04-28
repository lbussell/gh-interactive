export type ExitAction =
	| { type: "print"; value: string }
	| { type: "exec"; command: string[]; cwd?: string };

export async function handleExitAction(action: ExitAction): Promise<never> {
	if (action.type === "print") {
		process.stdout.write(`${action.value}\n`);
		process.exit(0);
	}

	const proc = Bun.spawn(action.command, {
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
		cwd: action.cwd,
	});
	const exitCode = await proc.exited;
	process.exit(exitCode);
}

export function isExitAction(value: unknown): value is ExitAction {
	return (
		value !== null &&
		typeof value === "object" &&
		"type" in value &&
		((value as ExitAction).type === "print" ||
			(value as ExitAction).type === "exec")
	);
}
