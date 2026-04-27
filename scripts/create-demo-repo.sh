#!/usr/bin/env bash
# Creates a torture-test git repo with 1000 branches and 100 worktrees
# to exercise gh-interactive's UI at scale.
set -euo pipefail

REPO_DIR="${1:-/tmp/gh-interactive-demo}"
NUM_BRANCHES=1000
NUM_WORKTREES=100

if [ -d "$REPO_DIR" ]; then
	echo "Removing existing demo repo at $REPO_DIR"
	rm -rf "$REPO_DIR"
fi

echo "Creating demo repo at $REPO_DIR"
mkdir -p "$REPO_DIR"
cd "$REPO_DIR"
git init

# Initial commit
echo "# Demo Repo" > README.md
git add README.md
git commit -m "initial commit"

# Random name generators
prefixes=("feature" "bugfix" "release" "hotfix" "experiment" "chore" "docs" "refactor" "perf" "test" "ci" "build" "style" "revert")
words=("auth" "api" "dashboard" "search" "cache" "worker" "queue" "config" "deploy" "monitor" "logging" "billing" "payment" "user" "admin" "settings" "profile" "upload" "export" "import" "sync" "migration" "schema" "index" "router" "handler" "middleware" "session" "token" "webhook" "cron" "batch" "stream" "socket" "proxy" "gateway" "service" "client" "server" "model" "view" "controller" "store" "reducer" "hook" "context" "provider" "layout" "theme" "i18n" "a11y" "seo" "analytics" "metrics" "alert" "notification" "email" "sms" "push" "oauth" "saml" "ldap" "rbac" "acl" "audit" "backup" "restore" "archive" "purge" "ttl" "rate-limit" "circuit-breaker" "retry" "timeout" "fallback" "canary" "rollback" "blue-green" "shadow" "feature-flag" "ab-test" "dark-mode" "responsive" "mobile" "desktop" "tablet" "pwa" "wasm" "ssr" "csr" "isr" "edge" "cdn" "dns" "ssl" "cors" "csrf" "xss" "sqli" "sanitize" "validate" "transform" "serialize" "compress" "encrypt" "decrypt" "hash" "sign" "verify")

random_word() {
	echo "${words[$((RANDOM % ${#words[@]}))]}"
}

random_prefix() {
	echo "${prefixes[$((RANDOM % ${#prefixes[@]}))]}"
}

random_branch_name() {
	local depth=$(( (RANDOM % 3) + 1 ))
	local name
	name="$(random_prefix)/$(random_word)"
	for _ in $(seq 2 "$depth"); do
		name="$name-$(random_word)"
	done
	# Append a short random suffix to guarantee uniqueness
	echo "$name-$1"
}

echo "Creating $NUM_BRANCHES branches..."
branch_names=()
for i in $(seq 1 "$NUM_BRANCHES"); do
	branch="$(random_branch_name "$i")"
	branch_names+=("$branch")
	git branch "$branch" main
	if (( i % 100 == 0 )); then
		echo "  $i / $NUM_BRANCHES branches created"
	fi
done

# Make some branches have commits ahead of main
# Give every branch a unique divergence point from main
echo "Adding commits so branches diverge..."
main_commit=$(git rev-parse main)
for i in $(seq 1 "$NUM_BRANCHES"); do
	branch="${branch_names[$((i - 1))]}"
	# Create 1-5 commits per branch, all unique
	num_commits=$(( (RANDOM % 5) + 1 ))
	git checkout -q "$branch"
	for j in $(seq 1 "$num_commits"); do
		echo "branch $i commit $j: $(head -c 16 /dev/urandom | base64)" >> "work-$i.txt"
		git add -A
		git commit -q -m "$branch: commit $j/$num_commits"
	done
	if (( i % 100 == 0 )); then
		echo "  $i / $NUM_BRANCHES branches populated"
	fi
done
git checkout -q main

# Create worktrees with varied states
WORKTREE_DIR="$REPO_DIR/.worktrees"
mkdir -p "$WORKTREE_DIR"

NUM_DETACHED=10
NUM_MISSING=5
NUM_BRANCH_WT=$(( NUM_WORKTREES - NUM_DETACHED ))

echo "Creating $NUM_WORKTREES worktrees..."
worktree_idx=0

# Branch-based worktrees
for i in $(seq 1 "$NUM_BRANCH_WT"); do
	branch="${branch_names[$((i - 1))]}"
	worktree_idx=$((worktree_idx + 1))
	worktree_name="wt-$worktree_idx"
	git worktree add -q "$WORKTREE_DIR/$worktree_name" "$branch"
done

# Detached HEAD worktrees on random commits
echo "Creating $NUM_DETACHED detached worktrees..."
all_commits=($(git log --all --format='%H' | shuf -n "$NUM_DETACHED"))
for i in $(seq 1 "$NUM_DETACHED"); do
	worktree_idx=$((worktree_idx + 1))
	worktree_name="wt-detached-$worktree_idx"
	git worktree add -q --detach "$WORKTREE_DIR/$worktree_name" "${all_commits[$((i - 1))]}"
done

echo "  $worktree_idx / $NUM_WORKTREES worktrees created"

# Make ~30% of worktrees dirty (uncommitted changes)
echo "Making some worktrees dirty..."
dirty_count=0
for dir in "$WORKTREE_DIR"/wt-*; do
	if (( RANDOM % 100 < 30 )); then
		echo "dirty: uncommitted work $(date +%s%N)" >> "$dir/dirty-file.txt"
		dirty_count=$((dirty_count + 1))
	fi
done
echo "  $dirty_count worktrees dirtied"

# Make ~15% of worktrees have staged but uncommitted changes
echo "Staging changes in some worktrees..."
staged_count=0
for dir in "$WORKTREE_DIR"/wt-*; do
	if (( RANDOM % 100 < 15 )); then
		echo "staged: pending change $(date +%s%N)" >> "$dir/staged-file.txt"
		git -C "$dir" add staged-file.txt 2>/dev/null || true
		staged_count=$((staged_count + 1))
	fi
done
echo "  $staged_count worktrees with staged changes"

# Delete some worktree directories to simulate missing/broken worktrees
echo "Removing $NUM_MISSING worktree directories to simulate missing state..."
missing_dirs=($(ls -d "$WORKTREE_DIR"/wt-* | shuf -n "$NUM_MISSING"))
for dir in "${missing_dirs[@]}"; do
	rm -rf "$dir"
done

echo ""
echo "=== Demo repo created ==="
echo "Location: $REPO_DIR"
echo "Branches: $(git branch --list | wc -l)"
echo "Worktrees: $(git worktree list | wc -l)"
echo "Dirty worktrees: $dirty_count"
echo "Staged worktrees: $staged_count"
echo "Missing worktrees: $NUM_MISSING"
echo "Detached worktrees: $NUM_DETACHED"
echo ""
echo "To test: cd $REPO_DIR && gh interactive"
