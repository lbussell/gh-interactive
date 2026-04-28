import { join } from "node:path";
import type { Octokit } from "octokit";
import { useEffect, useRef, useState } from "react";
import { readJsonCache, writeJsonCache } from "./cache";
import { useCacheDir } from "./context/cacheContext";
import {
	getPullRequestsForBranch,
	type WorktreePullRequest,
	type WorktreePullRequestMap,
} from "./gitHub";

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
): WorktreePullRequestMap {
	const cacheDir = useCacheDir();
	const [map, setMap] = useState<WorktreePullRequestMap>({});
	const fetchedRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		const controller = new AbortController();

		for (const branch of branches) {
			if (fetchedRef.current.has(branch)) continue;
			fetchedRef.current.add(branch);

			const cachePath = join(cacheDir, "worktree-prs", `${branch}.cache.json`);

			// Load cache first
			readJsonCache<WorktreePullRequest[]>(cachePath).then((cached) => {
				if (!controller.signal.aborted && cached !== null) {
					setMap((prev) => {
						if (prev[branch]) return prev;
						return { ...prev, [branch]: cached };
					});
				}
			});

			// Fetch fresh data
			getPullRequestsForBranch(octokit, owner, repo, branch).then(
				async (data) => {
					if (controller.signal.aborted) return;
					setMap((prev) => ({ ...prev, [branch]: data }));
					await writeJsonCache(cachePath, data);
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
