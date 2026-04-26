package main

import (
	"fmt"
	"os"
)

const (
	menuOptionLocal        = "Local"
	menuOptionOpenCopilot  = "Open Copilot"
	menuOptionPullRequests = "Pull Requests"
	menuOptionIssues       = "Issues"
)

func main() {
	if err := runMenu(appMenuOptions()); err != nil {
		fmt.Fprintf(os.Stderr, "failed to run menu: %v\n", err)
		os.Exit(1)
	}
}

func appMenuOptions() []menuOption {
	return []menuOption{
		{
			title:       menuOptionLocal,
			description: "Work with local repository state",
			run:         confirmAndPrintSelection(menuOptionLocal),
		},
		{
			title:       menuOptionPullRequests,
			description: "Browse and manage pull requests",
			run:         confirmAndPrintSelection(menuOptionPullRequests),
		},
		{
			title:       menuOptionIssues,
			description: "Browse and manage issues",
			run:         confirmAndPrintSelection(menuOptionIssues),
		},
		{
			title:       menuOptionOpenCopilot,
			description: "Launch GitHub Copilot CLI",
			run:         openCopilot,
		},
	}
}

func confirmAndPrintSelection(choice string) func() error {
	return func() error {
		confirmed, err := confirmChoice(choice)
		if err != nil {
			return err
		}
		if confirmed {
			fmt.Printf("Selected %s\n", choice)
		}
		return nil
	}
}
