package main

import (
	"fmt"

	"charm.land/huh/v2"
)

type confirmFormOptions struct {
	title        string
	affirmative  string
	negative     string
	defaultValue bool
}

func confirmChoice(choice menuChoice) (bool, error) {
	return runConfirmForm(confirmFormOptions{
		title:        fmt.Sprintf("Open %s?", choice),
		affirmative:  "Open",
		negative:     "Cancel",
		defaultValue: true,
	})
}

func runConfirmForm(options confirmFormOptions) (bool, error) {
	confirmed := options.defaultValue
	err := huh.NewConfirm().
		Title(options.title).
		Affirmative(options.affirmative).
		Negative(options.negative).
		Value(&confirmed).
		Run()
	return confirmed, err
}
