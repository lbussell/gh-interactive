package main

import (
	"fmt"
	"os/exec"

	tea "charm.land/bubbletea/v2"
)

func openCopilot() tea.Cmd {
	return tea.ExecProcess(exec.Command("copilot"), func(err error) tea.Msg {
		if err != nil {
			err = fmt.Errorf("copilot failed: %w", err)
		}
		return menuActionFinishedMsg{err: err}
	})
}
