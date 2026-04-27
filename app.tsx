import { useApp } from "ink";

import { Select } from "./select";

type AppProps = {
  branches: string[];
};

export function App({ branches }: AppProps) {
  const { exit } = useApp();

  return (
    <Select
      items={branches}
      label="Choose a branch with Up/Down, Enter to select, q/Esc to exit."
      emptyMessage="No local git branches found. Press q or Esc to exit."
      onSelect={(branch) => exit(branch)}
      onCancel={() => exit()}
    />
  );
}
