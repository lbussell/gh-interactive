export async function getBranches(_signal: AbortSignal) {
	const output = await Bun.$`git branch --format='%(refname:short)'`.text();

	return output
		.split("\n")
		.map((branch) => branch.trim())
		.filter((branch) => branch.length > 0);
}
