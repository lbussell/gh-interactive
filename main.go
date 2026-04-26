package main

import (
	"fmt"
	"os"
)

func main() {
	choice, selected, err := runMenu()
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
