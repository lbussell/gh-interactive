package main

import (
	"fmt"

	"charm.land/bubbles/v2/list"
	tea "charm.land/bubbletea/v2"
)

type menuOption struct {
	title       string
	description string
	run         func() error
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
	selected *menuOption
	done     bool
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

func runMenu(options []menuOption) error {
	finalModel, err := tea.NewProgram(newMenuModel(options)).Run()
	if err != nil {
		return err
	}

	model, ok := finalModel.(menuModel)
	if !ok {
		return fmt.Errorf("unexpected final menu model %T", finalModel)
	}

	return model.runSelected()
}

func (m menuModel) Init() tea.Cmd {
	return nil
}

func (m menuModel) runSelected() error {
	if m.selected == nil || m.selected.run == nil {
		return nil
	}
	return m.selected.run()
}

func (m menuModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.list.SetSize(msg.Width, msg.Height)
	case tea.KeyPressMsg:
		switch msg.String() {
		case "ctrl+c", "q", "esc":
			m.done = true
			return m, tea.Quit
		case "enter":
			if item, ok := m.list.SelectedItem().(menuOption); ok {
				m.selected = &item
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
