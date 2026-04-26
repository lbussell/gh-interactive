package main

import (
	"fmt"
	"os"
)

const (
	menuChoiceLocal        menuChoice = "Local"
	menuChoiceOpenCopilot  menuChoice = "Open Copilot"
	menuChoicePullRequests menuChoice = "Pull Requests"
	menuChoiceIssues       menuChoice = "Issues"
)

func main() {
	choice, selected, err := runMenu(appMenuOptions())
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to run menu: %v\n", err)
		os.Exit(1)
	}

	if selected {
		confirmed, err := confirmChoice(choice)
		if err != nil {
			fmt.Fprintf(os.Stderr, "failed to confirm selection: %v\n", err)
			os.Exit(1)
		}
		if confirmed {
			fmt.Printf("Selected %s\n", choice)
		}
	}
}

func appMenuOptions() []menuOption {
	return []menuOption{
		{
			title:       string(menuChoiceLocal),
			description: "Work with local repository state",
			choice:      menuChoiceLocal,
		},
		{
			title:       string(menuChoicePullRequests),
			description: "Browse and manage pull requests",
			choice:      menuChoicePullRequests,
		},
		{
			title:       string(menuChoiceIssues),
			description: "Browse and manage issues",
			choice:      menuChoiceIssues,
		},
		{
			title:       string(menuChoiceOpenCopilot),
			description: "Launch GitHub Copilot CLI",
			choice:      menuChoiceOpenCopilot,
			action:      openCopilot,
		},
	}
}
