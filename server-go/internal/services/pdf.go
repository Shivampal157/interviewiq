package services

import (
	"os"
	"regexp"
	"strings"
	"unicode/utf8"
)

var pdfString = regexp.MustCompile(`\((?:\\.|[^\\)]){3,}\)`)

func ExtractPDFText(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	matches := pdfString.FindAll(data, -1)
	parts := make([]string, 0, len(matches))
	for _, m := range matches {
		s := string(m)
		s = strings.TrimPrefix(s, "(")
		s = strings.TrimSuffix(s, ")")
		s = strings.ReplaceAll(s, `\(`, "(")
		s = strings.ReplaceAll(s, `\)`, ")")
		s = strings.ReplaceAll(s, `\n`, " ")
		s = strings.ReplaceAll(s, `\r`, " ")
		if utf8.ValidString(s) && looksLikeText(s) {
			parts = append(parts, s)
		}
	}
	return strings.Join(parts, " "), nil
}

func looksLikeText(s string) bool {
	letters := 0
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') {
			letters++
		}
	}
	return letters >= 3
}
