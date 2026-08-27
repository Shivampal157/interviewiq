package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

const maxOut = 12000

func clip(s string) string {
	if len(s) > maxOut {
		return s[:maxOut]
	}
	return s
}

func emptyOut(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return "Program finished. No stdout."
	}
	return clip(s)
}

func ExecuteCode(language, code, stdin string) (string, error) {
	lang := language
	if lang != "javascript" && lang != "python" && lang != "java" && lang != "cpp" {
		lang = "javascript"
	}
	code = strings.TrimSpace(code)
	if code == "" {
		return "", errors.New("Write some code first")
	}
	if len(code) > 40000 {
		return "", errors.New("Code is too long")
	}
	if len(stdin) > 4000 {
		stdin = stdin[:4000]
	}
	switch lang {
	case "javascript":
		return runJavascript(code)
	case "python":
		return runPython(code, stdin)
	case "cpp":
		return runGodbolt("g132", "c++", code, stdin, "-O2 -std=c++17")
	default:
		return runGodbolt("java2100", "java", code, stdin, "")
	}
}

func runJavascript(code string) (string, error) {
	dir, err := os.MkdirTemp("", "iq-js-*")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(dir)
	file := filepath.Join(dir, "main.js")
	if err := os.WriteFile(file, []byte(code), 0600); err != nil {
		return "", err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "node", file)
	cmd.Dir = dir
	cmd.Env = []string{"PATH=" + os.Getenv("PATH")}
	out, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		return "", errors.New("JavaScript timed out")
	}
	text := string(out)
	if err != nil && strings.TrimSpace(text) == "" {
		return "", errors.New("JavaScript failed")
	}
	if err != nil {
		return clip(strings.TrimSpace(text)), nil
	}
	return emptyOut(text), nil
}

func runPython(code, stdin string) (string, error) {
	dir, err := os.MkdirTemp("", "iq-*")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(dir)
	file := filepath.Join(dir, "main.py")
	if err := os.WriteFile(file, []byte(code), 0600); err != nil {
		return "", err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "python", file)
	cmd.Dir = dir
	cmd.Env = []string{"PYTHONIOENCODING=utf-8", "PYTHONUNBUFFERED=1", "PATH=" + os.Getenv("PATH")}
	if stdin != "" {
		cmd.Stdin = strings.NewReader(stdin)
	}
	out, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		return "", errors.New("Python timed out")
	}
	text := string(out)
	if err != nil && strings.TrimSpace(text) == "" {
		return "", errors.New("Python exited with an error")
	}
	if err != nil {
		return clip(strings.TrimSpace(text)), nil
	}
	return emptyOut(text), nil
}

type ceLine struct {
	Text string `json:"text"`
}

func joinLines(rows []ceLine) string {
	parts := make([]string, 0, len(rows))
	for _, row := range rows {
		if row.Text != "" {
			parts = append(parts, row.Text)
		}
	}
	return strings.TrimSpace(strings.Join(parts, "\n"))
}

func runGodbolt(compiler, lang, source, stdin, userArguments string) (string, error) {
	payload := map[string]any{
		"source": source,
		"lang":   lang,
		"options": map[string]any{
			"userArguments":     userArguments,
			"executeParameters": map[string]any{"args": []string{}, "stdin": stdin},
			"compilerOptions":   map[string]any{"skipAsm": true, "executorRequest": true},
			"filters":           map[string]any{"execute": true},
		},
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequest(http.MethodPost, "https://godbolt.org/api/compiler/"+compiler+"/compile", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "InterviewIQ")
	client := &http.Client{Timeout: 25 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return "", errors.New("C++ / Java runner is busy. Try JavaScript or Python, or click Run again.")
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 300 {
		return "", errors.New("C++ / Java runner is busy. Try JavaScript or Python, or click Run again.")
	}
	var data struct {
		DidExecute  bool     `json:"didExecute"`
		Stdout      []ceLine `json:"stdout"`
		Stderr      []ceLine `json:"stderr"`
		BuildResult struct {
			Stderr []ceLine `json:"stderr"`
		} `json:"buildResult"`
		ExecResult *struct {
			DidExecute bool     `json:"didExecute"`
			Stdout     []ceLine `json:"stdout"`
			Stderr     []ceLine `json:"stderr"`
		} `json:"execResult"`
	}
	if err := json.Unmarshal(raw, &data); err != nil {
		return "", errors.New("Compilation failed")
	}
	did := data.DidExecute
	stdout := joinLines(data.Stdout)
	stderr := joinLines(data.Stderr)
	compileErr := joinLines(data.BuildResult.Stderr)
	if data.ExecResult != nil {
		did = data.ExecResult.DidExecute
		stdout = joinLines(data.ExecResult.Stdout)
		stderr = joinLines(data.ExecResult.Stderr)
	}
	if !did {
		msg := compileErr
		if msg == "" {
			msg = stderr
		}
		if msg == "" {
			msg = "Compilation failed"
		}
		return "", errors.New(msg)
	}
	out := strings.TrimSpace(strings.Join([]string{stdout, stderr, compileErr}, "\n"))
	return emptyOut(out), nil
}
