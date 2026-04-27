import React from "react";
import { render } from "ink";

import { App } from "./app";

async function getBranches() {
  const output = await Bun.$`git branch --format='%(refname:short)'`.text();

  return output
    .split("\n")
    .map((branch) => branch.trim())
    .filter((branch) => branch.length > 0);
}

try {
  const branches = await getBranches();
  const { waitUntilExit } = render(React.createElement(App, { branches }), {
    stdout: process.stderr,
  });
  const selectedBranch = await waitUntilExit();

  if (typeof selectedBranch === "string") {
    process.stdout.write(`${selectedBranch}\n`);
  }
} catch (error) {
  process.stderr.write(
    `Failed to list git branches: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}
