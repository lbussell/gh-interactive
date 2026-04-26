package main

import (
	"fmt"

	"github.com/charmbracelet/bubbles/list"
	tea "github.com/charmbracelet/bubbletea"
)

type menuChoice string

const (
	menuChoiceLocal        menuChoice = "Local"
	menuChoicePullRequests menuChoice = "Pull Requests"
	menuChoiceIssues       menuChoice = "Issues"
)

type menuItem struct {
	title       string
	description string
	choice      menuChoice
}

func (i menuItem) Title() string {
	return i.title
}

func (i menuItem) Description() string {
	return i.description
}

func (i menuItem) FilterValue() string {
	return i.title
}

type menuModel struct {
	list     list.Model
	selected menuChoice
	done     bool
}

func newMenuModel() menuModel {
	items := []list.Item{
		menuItem{
			title:       string(menuChoiceLocal),
			description: "Work with local repository state",
			choice:      menuChoiceLocal,
		},
		menuItem{
			title:       string(menuChoicePullRequests),
			description: "Browse and manage pull requests",
			choice:      menuChoicePullRequests,
		},
		menuItem{
			title:       string(menuChoiceIssues),
			description: "Browse and manage issues",
			choice:      menuChoiceIssues,
		},
	}

	menuList := list.New(items, list.NewDefaultDelegate(), 80, 14)
	menuList.Title = "gh interactive"
	menuList.SetFilteringEnabled(false)
	menuList.SetShowStatusBar(false)

	return menuModel{list: menuList}
}

func runMenu() (menuChoice, bool, error) {
	finalModel, err := tea.NewProgram(newMenuModel()).Run()
	if err != nil {
		return "", false, err
	}

	model, ok := finalModel.(menuModel)
	if !ok {
		return "", false, fmt.Errorf("unexpected final menu model %T", finalModel)
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
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q", "esc":
			m.done = true
			return m, tea.Quit
		case "enter":
			if item, ok := m.list.SelectedItem().(menuItem); ok {
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

func (m menuModel) View() string {
	if m.done {
		return ""
	}

	return m.list.View()
}
