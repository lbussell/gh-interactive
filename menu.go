package main

import (
	"fmt"

	"charm.land/bubbles/v2/list"
	tea "charm.land/bubbletea/v2"
)

type menuChoice string

type menuOption struct {
	title       string
	description string
	choice      menuChoice
	action      func() tea.Cmd
}

func (i menuOption) Title() string {
	return i.title
}

func (i menuOption) Description() string {
	return i.description
}

func (i menuOption) FilterValue() string {
	return i.title
}

type menuModel struct {
	list     list.Model
	selected menuChoice
	err      error
	done     bool
}

type menuActionFinishedMsg struct {
	err error
}

func newMenuModel(options []menuOption) menuModel {
	items := make([]list.Item, 0, len(options))
	for _, option := range options {
		items = append(items, option)
	}

	menuList := list.New(items, list.NewDefaultDelegate(), 80, 14)
	menuList.Title = "gh interactive"
	menuList.SetFilteringEnabled(false)
	menuList.SetShowStatusBar(false)

	return menuModel{list: menuList}
}

func runMenu(options []menuOption) (menuChoice, bool, error) {
	finalModel, err := tea.NewProgram(newMenuModel(options)).Run()
	if err != nil {
		return "", false, err
	}

	model, ok := finalModel.(menuModel)
	if !ok {
		return "", false, fmt.Errorf("unexpected final menu model %T", finalModel)
	}
	if model.err != nil {
		return "", false, model.err
	}
	if model.selected == "" {
		return "", false, nil
	}

	return model.selected, true, nil
}

func (m menuModel) Init() tea.Cmd {
	return nil
}

func (m menuModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.list.SetSize(msg.Width, msg.Height)
	case menuActionFinishedMsg:
		if msg.err != nil {
			m.err = msg.err
			m.done = true
			return m, tea.Quit
		}
		return m, nil
	case tea.KeyPressMsg:
		switch msg.String() {
		case "ctrl+c", "q", "esc":
			m.done = true
			return m, tea.Quit
		case "enter":
			if item, ok := m.list.SelectedItem().(menuOption); ok {
				if item.action != nil {
					return m, item.action()
				}
				m.selected = item.choice
			}
			m.done = true
			return m, tea.Quit
		}
	}

	var cmd tea.Cmd
	m.list, cmd = m.list.Update(msg)
	return m, cmd
}

func (m menuModel) View() tea.View {
	if m.done {
		return tea.NewView("")
	}

	return tea.NewView(m.list.View())
}
