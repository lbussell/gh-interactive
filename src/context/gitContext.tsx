import { createContext, useContext } from "react";
import type { SimpleGit } from "simple-git";

export const GitContext = createContext<SimpleGit | null>(null);

export const useGit = () => {
	const git = useContext(GitContext);

	if (git === null) {
		throw new Error("useGit must be used within GitContext.");
	}

	return git;
};
