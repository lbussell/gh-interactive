import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Octokit } from "octokit";
import { useEffect, useRef, useState } from "react";
import {
	getPullRequestsForBranch,
	type WorktreePullRequest,
	type WorktreePullRequestMap,
} from "./gitHub";

export type AsyncState<T> =
	| { status: "loading"; data: null; error: null }
	| { status: "done"; data: T; error: null }
	| { status: "error"; data: null; error: unknown };

export type CachedAsyncState<T> = AsyncState<T> & { refreshing: boolean };

function isAbortError(error: unknown) {
	return error instanceof DOMException && error.name === "AbortError";
}

export function useAsync<T>(
	asyncFn: (signal: AbortSignal) => Promise<T>,
): AsyncState<T> {
	const [state, setState] = useState<AsyncState<T>>({
		status: "loading",
		data: null,
		error: null,
	});

	useEffect(() => {
		const controller = new AbortController();

		setState({ status: "loading", data: null, error: null });

		asyncFn(controller.signal).then(
			(data) => {
				if (!controller.signal.aborted) {
					setState({ status: "done", data, error: null });
				}
			},
			(error: unknown) => {
				if (!controller.signal.aborted && !isAbortError(error)) {
					setState({ status: "error", data: null, error });
				}
			},
		);

		return () => {
			controller.abort();
		};
	}, [asyncFn]);

	return state;
}

/**
 * Like useAsync, but caches data to a JSON file. On mount it loads
 * the cached data immediately (if available) while fetching fresh
 * data concurrently. Once the fresh data arrives it replaces the
 * cached view and persists the new data to the cache file.
 */
export function useAsyncCached<T>(
	asyncFn: (signal: AbortSignal) => Promise<T>,
	cacheFilePath: string,
): CachedAsyncState<T> {
	const [state, setState] = useState<AsyncState<T>>({
		status: "loading",
		data: null,
		error: null,
	});
	const [refreshing, setRefreshing] = useState(true);

	useEffect(() => {
		const controller = new AbortController();
		let hasFreshData = false;

		setState({ status: "loading", data: null, error: null });
		setRefreshing(true);

		// Load cached data immediately
		Bun.file(cacheFilePath)
			.json()
			.then((cachedData: unknown) => {
				if (!controller.signal.aborted && !hasFreshData) {
					setState({ status: "done", data: cachedData as T, error: null });
				}
			})
			.catch(() => {
				// Cache miss or invalid JSON — ignore
			});

		// Fetch fresh data concurrently
		asyncFn(controller.signal).then(
			async (data) => {
				if (!controller.signal.aborted) {
					hasFreshData = true;
					setState({ status: "done", data, error: null });
					setRefreshing(false);
					try {
						await mkdir(dirname(cacheFilePath), { recursive: true });
						await Bun.write(cacheFilePath, JSON.stringify(data));
					} catch {
						// Non-critical — swallow write errors
					}
				}
			},
			(error: unknown) => {
				if (!controller.signal.aborted && !isAbortError(error)) {
					setState({ status: "error", data: null, error });
					setRefreshing(false);
				}
			},
		);

		return () => {
			controller.abort();
		};
	}, [asyncFn, cacheFilePath]);

	return { ...state, refreshing };
}

/**
 * Fetches pull requests for each branch independently, updating the
 * returned map incrementally as each request resolves. Only fetches
 * once per branch (tracked via ref). Caches per-branch results to disk.
 */
export function useWorktreePullRequests(
	branches: string[],
	octokit: Octokit,
	owner: string,
	repo: string,
	cacheDir: string,
): WorktreePullRequestMap {
	const [map, setMap] = useState<WorktreePullRequestMap>({});
	const fetchedRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		const controller = new AbortController();

		for (const branch of branches) {
			if (fetchedRef.current.has(branch)) continue;
			fetchedRef.current.add(branch);

			const cachePath = join(cacheDir, "worktree-prs", `${branch}.cache.json`);

			// Load cache first
			Bun.file(cachePath)
				.json()
				.then((cached: unknown) => {
					if (!controller.signal.aborted) {
						setMap((prev) => {
							if (prev[branch]) return prev;
							return { ...prev, [branch]: cached as WorktreePullRequest[] };
						});
					}
				})
				.catch(() => {});

			// Fetch fresh data
			getPullRequestsForBranch(octokit, owner, repo, branch).then(
				async (data) => {
					if (controller.signal.aborted) return;
					setMap((prev) => ({ ...prev, [branch]: data }));
					try {
						await mkdir(join(cacheDir, "worktree-prs"), { recursive: true });
						await Bun.write(cachePath, JSON.stringify(data));
					} catch {}
				},
				() => {},
			);
		}

		return () => {
			controller.abort();
		};
	}, [branches, octokit, owner, repo, cacheDir]);

	return map;
}
