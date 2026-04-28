export const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

export function formatError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
