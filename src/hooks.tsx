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
