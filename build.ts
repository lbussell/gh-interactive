#!/usr/bin/env bun

import { mkdir, rm } from "node:fs/promises";

const extensionName = "gh-interactive";
const entrypoint = "./index.tsx";
const outputDir = "dist";

type ReleaseTarget = {
	bunTarget: Bun.Build.CompileTarget;
	artifactSuffix: string;
};

const releaseTargets: ReleaseTarget[] = [
	{ bunTarget: "bun-darwin-x64", artifactSuffix: "darwin-amd64" },
	{ bunTarget: "bun-darwin-arm64", artifactSuffix: "darwin-arm64" },
	{ bunTarget: "bun-linux-x64", artifactSuffix: "linux-amd64" },
	{ bunTarget: "bun-linux-arm64", artifactSuffix: "linux-arm64" },
	{ bunTarget: "bun-linux-x64-musl", artifactSuffix: "linux-amd64-musl" },
	{ bunTarget: "bun-linux-arm64-musl", artifactSuffix: "linux-arm64-musl" },
	{ bunTarget: "bun-windows-x64", artifactSuffix: "windows-amd64.exe" },
	{ bunTarget: "bun-windows-arm64", artifactSuffix: "windows-arm64.exe" },
];

const args = Bun.argv.slice(2);
const ci = args.includes("--ci");
const install = args.includes("--install");
const releaseTag = args.findLast((arg) => !arg.startsWith("--")) ?? "";

if (ci && !releaseTag) {
	console.error(`usage: ${Bun.argv[1]} --ci <release-tag>`);
	process.exit(1);
}

async function buildExecutable(outfile: string, releaseTarget?: ReleaseTarget) {
	const compileOptions: Bun.CompileBuildOptions = { outfile };

	// Local builds use the host runtime; release builds pin each target explicitly.
	if (releaseTarget) {
		compileOptions.target = releaseTarget.bunTarget;
	}

	const result = await Bun.build({
		entrypoints: [entrypoint],
		compile: compileOptions,
		// Do not enable bytecode: Ink's layout dependency uses top-level await, which Bun bytecode currently rejects.
		minify: true,
	});

	if (!result.success) {
		for (const log of result.logs) {
			console.error(log);
		}

		process.exit(1);
	}
}

if (ci) {
	await rm(outputDir, { recursive: true, force: true });
	await mkdir(outputDir, { recursive: true });

	for (const releaseTarget of releaseTargets) {
		await buildExecutable(
			`${outputDir}/${extensionName}_${releaseTag}_${releaseTarget.artifactSuffix}`,
			releaseTarget,
		);
	}

	process.exit(0);
}

console.info(`Building ${extensionName}`);
await buildExecutable(extensionName);

if (install) {
	console.info("Removing old installation");
	try {
		await Bun.$`gh extension remove ${extensionName}`;
	} catch {}

	console.info(`Installing ${extensionName}`);
	await Bun.$`gh extension install .`;

	console.info("Success");
}
