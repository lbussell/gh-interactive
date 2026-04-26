package main

import (
	"fmt"
	"os"
	"os/exec"
)

func openCopilot() error {
	cmd := exec.Command("copilot")
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("copilot failed: %w", err)
	}
	return nil
}
