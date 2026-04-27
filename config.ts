import { homedir } from "node:os";
import { join } from "node:path";

const ConfigFileName = "config.json";
const DefaultConfigDir = join(homedir(), ".config", "gh-interactive");
const DefaultWorktreeDirectory = join(homedir(), "w/");

type JsonObject = {
	[key: string]: unknown;
};

export type Config = {
	worktreeDirectory: string;
};

function expandHome(path: string) {
	if (path === "~") {
		return homedir();
	}

	if (path.startsWith("~/")) {
		return join(homedir(), path.slice(2));
	}

	return path;
}

function readJsonObject(value: unknown): JsonObject {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${ConfigFileName} must contain a JSON object.`);
	}

	return value as JsonObject;
}

function parseConfig(config: JsonObject): Partial<Config> {
	const { worktreeDirectory } = config;

	if (worktreeDirectory === undefined) {
		return {};
	}

	if (typeof worktreeDirectory !== "string") {
		throw new Error(`${ConfigFileName} worktreeDirectory must be a string.`);
	}

	return {
		worktreeDirectory,
	};
}

function isFileNotFoundError(error: unknown) {
	return (
		error !== null &&
		typeof error === "object" &&
		"code" in error &&
		error.code === "ENOENT"
	);
}

export async function loadConfig(env = process.env): Promise<Config> {
	const configDir = expandHome(
		env.GH_INTERACTIVE_CONFIG_DIR ?? DefaultConfigDir,
	);
	const configFile = Bun.file(join(configDir, ConfigFileName));

	let configFileJson: unknown;

	try {
		configFileJson = await configFile.json();
	} catch (error) {
		if (isFileNotFoundError(error)) {
			return {
				worktreeDirectory: DefaultWorktreeDirectory,
			};
		}

		throw error;
	}

	const configObject = readJsonObject(configFileJson);
	const config = parseConfig(configObject);

	if (config.worktreeDirectory === undefined) {
		return {
			worktreeDirectory: DefaultWorktreeDirectory,
		};
	}

	return {
		worktreeDirectory: expandHome(config.worktreeDirectory),
	};
}
