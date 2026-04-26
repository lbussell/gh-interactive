package main

import (
	"errors"
	"testing"

	tea "charm.land/bubbletea/v2"
)

func TestMenuSelectsCurrentOption(t *testing.T) {
	ran := false
	model := newMenuModel([]menuOption{
		{
			title: "Run test",
			run: func() error {
				ran = true
				return nil
			},
		},
	})

	updated, _ := model.Update(tea.KeyPressMsg(tea.Key{Code: tea.KeyEnter}))
	model = updated.(menuModel)

	if ran {
		t.Fatal("menu should not run option before exiting")
	}

	if model.selected == nil {
		t.Fatal("expected selected option")
	}

	if model.selected.title != "Run test" {
		t.Fatalf("selected %q, want Run test", model.selected.title)
	}

	if !model.done {
		t.Fatal("menu should be done after selecting an option")
	}
}

func TestMenuRunsSelectedOption(t *testing.T) {
	ran := false
	model := menuModel{
		selected: &menuOption{
			run: func() error {
				ran = true
				return nil
			},
		},
	}

	if err := model.runSelected(); err != nil {
		t.Fatalf("runSelected() error = %v, want nil", err)
	}

	if !ran {
		t.Fatal("expected selected option to run")
	}
}

func TestMenuReturnsSelectedOptionError(t *testing.T) {
	wantErr := errors.New("boom")
	model := menuModel{
		selected: &menuOption{
			run: func() error {
				return wantErr
			},
		},
	}

	if err := model.runSelected(); !errors.Is(err, wantErr) {
		t.Fatalf("runSelected() error = %v, want %v", err, wantErr)
	}
}

func TestMenuQuitDoesNotSelectOption(t *testing.T) {
	model := newMenuModel([]menuOption{{title: "Do not select"}})

	updated, _ := model.Update(tea.KeyPressMsg(tea.Key{Code: 'q', Text: "q"}))
	model = updated.(menuModel)

	if model.selected != nil {
		t.Fatalf("selected %q, want no selection", model.selected.title)
	}

	if !model.done {
		t.Fatal("menu should be done after quitting")
	}
}

func TestMenuOpenCopilotSelectsRunnableOption(t *testing.T) {
	model := newMenuModel(appMenuOptions())
	selectMenuOption(t, &model, menuOptionOpenCopilot)

	updated, cmd := model.Update(tea.KeyPressMsg(tea.Key{Code: tea.KeyEnter}))
	model = updated.(menuModel)

	if !model.done {
		t.Fatal("menu should be done after selecting Copilot")
	}

	if cmd == nil {
		t.Fatal("expected quit command after selecting Copilot")
	}

	if model.selected == nil || model.selected.title != menuOptionOpenCopilot {
		t.Fatalf("selected = %#v, want %q", model.selected, menuOptionOpenCopilot)
	}

	if model.selected.run == nil {
		t.Fatal("expected Copilot option to provide run function")
	}
}

func selectMenuOption(t *testing.T, model *menuModel, title string) {
	t.Helper()

	for index, item := range model.list.Items() {
		menuOption, ok := item.(menuOption)
		if ok && menuOption.title == title {
			model.list.Select(index)
			return
		}
	}

	t.Fatalf("menu option %q not found", title)
}
