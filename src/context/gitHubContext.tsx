import type { Octokit } from "octokit";
import { createContext, useContext } from "react";

export type GitHubContextValue = {
	octokit: Octokit;
	owner: string;
	repo: string;
};

export const GitHubContext = createContext<GitHubContextValue | null>(null);

export const useGitHub = () => {
	const github = useContext(GitHubContext);

	if (github === null) {
		throw new Error("useGitHub must be used within GitHubContext.");
	}

	return github;
};
