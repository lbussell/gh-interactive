# gh-interactive

GitHub CLI extension that is entirely TUI driven

## Installation

```console
gh extension install lbussell/gh-interactive
```

## Usage

Run the extension:

```console
gh interactive
```

Optionally, set up a useful alias to get to it faster:

```console
gh alias set i interactive
gh i
```

## Developer guide

### Prerequisites

- [GitHub CLI](https://cli.github.com/)
- [bun](https://bun.com/docs/installation)

### Development

To install development dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```
