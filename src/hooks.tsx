import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { useEffect, useState } from "react";

export type AsyncState<T> =
	| { status: "loading"; data: null; error: null }
	| { status: "done"; data: T; error: null }
	| { status: "error"; data: null; error: unknown };

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
): AsyncState<T> {
	const [state, setState] = useState<AsyncState<T>>({
		status: "loading",
		data: null,
		error: null,
	});

	useEffect(() => {
		const controller = new AbortController();
		let hasFreshData = false;

		setState({ status: "loading", data: null, error: null });

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
				}
			},
		);

		return () => {
			controller.abort();
		};
	}, [asyncFn, cacheFilePath]);

	return state;
}
