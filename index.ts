import React from "react";
import { render } from "ink";
import { App } from "./app";

try {
  const { waitUntilExit } = render(React.createElement(App), {
    stdout: process.stderr,
  });
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
