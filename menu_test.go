package main

import (
	"testing"

	tea "github.com/charmbracelet/bubbletea"
)

func TestMenuSelectsCurrentItem(t *testing.T) {
	model := newMenuModel()

	updated, _ := model.Update(tea.KeyMsg{Type: tea.KeyEnter})
	model = updated.(menuModel)

	if model.selected != menuChoiceLocal {
		t.Fatalf("selected %q, want %q", model.selected, menuChoiceLocal)
	}

	if !model.done {
		t.Fatal("menu should be done after selecting an item")
	}
}

func TestMenuQuitDoesNotSelectItem(t *testing.T) {
	model := newMenuModel()

	updated, _ := model.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune("q")})
	model = updated.(menuModel)

	if model.selected != "" {
		t.Fatalf("selected %q, want no selection", model.selected)
	}

	if !model.done {
		t.Fatal("menu should be done after quitting")
	}
}
