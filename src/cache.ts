import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { useCallback, useEffect, useState } from "react";
import { useCacheDir } from "./context/cacheContext";

export type AsyncState<T> =
	| { status: "loading"; data: null; error: null }
	| { status: "done"; data: T; error: null }
	| { status: "error"; data: null; error: unknown };

export type CachedAsyncState<T> = AsyncState<T> & {
	refreshing: boolean;
	refresh: () => void;
};

export async function readJsonCache<T>(path: string): Promise<T | null> {
	try {
		return (await Bun.file(path).json()) as T;
	} catch {
		return null;
	}
}

export async function writeJsonCache(
	path: string,
	data: unknown,
): Promise<void> {
	try {
		await mkdir(dirname(path), { recursive: true });
		await Bun.write(path, JSON.stringify(data));
	} catch {
		// Non-critical — swallow write errors
	}
}

/**
 * Like useAsync, but caches data to a JSON file. On mount it loads
 * the cached data immediately (if available) while fetching fresh
 * data concurrently. Once the fresh data arrives it replaces the
 * cached view and persists the new data to the cache file.
 *
 * Callers provide a logical cache key (e.g. "branches"); the hook
 * resolves it to a file path internally using CacheDirContext.
 */
export function useAsyncCached<T>(
	cacheKey: string,
	asyncFn: (signal: AbortSignal) => Promise<T>,
): CachedAsyncState<T> {
	const cacheDir = useCacheDir();
	const cacheFilePath = join(cacheDir, `${cacheKey}.cache.json`);

	const [state, setState] = useState<AsyncState<T>>({
		status: "loading",
		data: null,
		error: null,
	});
	const [refreshing, setRefreshing] = useState(true);
	const [refreshKey, setRefreshKey] = useState(0);
	const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

	useEffect(() => {
		const controller = new AbortController();
		let hasFreshData = false;

		const isManualRefresh = refreshKey > 0;

		// On manual refresh, keep existing data visible; on first load, reset
		if (!isManualRefresh) {
			setState({ status: "loading", data: null, error: null });
		}
		setRefreshing(true);

		// Load cached data immediately (skip on manual refresh — we already have data)
		if (!isManualRefresh) {
			readJsonCache<T>(cacheFilePath).then((cachedData) => {
				if (
					!controller.signal.aborted &&
					!hasFreshData &&
					cachedData !== null
				) {
					setState({
						status: "done",
						data: cachedData,
						error: null,
					});
				}
			});
		}

		// Fetch fresh data concurrently
		asyncFn(controller.signal).then(
			async (data) => {
				if (!controller.signal.aborted) {
					hasFreshData = true;
					setState({ status: "done", data, error: null });
					setRefreshing(false);
					await writeJsonCache(cacheFilePath, data);
				}
			},
			(error: unknown) => {
				if (
					!controller.signal.aborted &&
					!(error instanceof DOMException && error.name === "AbortError")
				) {
					setState({ status: "error", data: null, error });
					setRefreshing(false);
				}
			},
		);

		return () => {
			controller.abort();
		};
	}, [asyncFn, cacheFilePath, refreshKey]);

	return { ...state, refreshing, refresh };
}
