package main

import (
	"fmt"

	"charm.land/huh/v2"
)

func confirmChoice(choice menuChoice) (bool, error) {
	confirmed := true
	err := huh.NewConfirm().
		Title(fmt.Sprintf("Open %s?", choice)).
		Affirmative("Open").
		Negative("Cancel").
		Value(&confirmed).
		Run()
	return confirmed, err
}
