package main

import (
	"errors"
	"testing"

	tea "charm.land/bubbletea/v2"
)

func TestMenuSelectsCurrentItem(t *testing.T) {
	model := newMenuModel()

	updated, _ := model.Update(tea.KeyPressMsg(tea.Key{Code: tea.KeyEnter}))
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

	updated, _ := model.Update(tea.KeyPressMsg(tea.Key{Code: 'q', Text: "q"}))
	model = updated.(menuModel)

	if model.selected != "" {
		t.Fatalf("selected %q, want no selection", model.selected)
	}

	if !model.done {
		t.Fatal("menu should be done after quitting")
	}
}

func TestMenuOpenCopilotRunsCommand(t *testing.T) {
	model := newMenuModel()
	model.list.Select(1)

	updated, cmd := model.Update(tea.KeyPressMsg(tea.Key{Code: tea.KeyEnter}))
	model = updated.(menuModel)

	if model.selected != "" {
		t.Fatalf("selected %q, want no menu selection", model.selected)
	}

	if model.done {
		t.Fatal("menu should stay open while Copilot runs")
	}

	if cmd == nil {
		t.Fatal("expected command to open Copilot")
	}
}

func TestMenuReturnsAfterCopilotSucceeds(t *testing.T) {
	model := newMenuModel()

	updated, cmd := model.Update(copilotFinishedMsg{})
	model = updated.(menuModel)

	if model.done {
		t.Fatal("menu should stay open after Copilot exits successfully")
	}

	if model.err != nil {
		t.Fatalf("err = %v, want nil", model.err)
	}

	if cmd != nil {
		t.Fatal("expected no command after Copilot succeeds")
	}
}

func TestMenuReportsCopilotError(t *testing.T) {
	model := newMenuModel()
	wantErr := errors.New("boom")

	updated, _ := model.Update(copilotFinishedMsg{err: wantErr})
	model = updated.(menuModel)

	if !model.done {
		t.Fatal("menu should be done after Copilot fails")
	}

	if !errors.Is(model.err, wantErr) {
		t.Fatalf("err = %v, want wrapped %v", model.err, wantErr)
	}
}
