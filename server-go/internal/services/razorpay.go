package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Plan struct {
	ID      string
	Amount  float64
	Credits int
}

func PlanByID(id string) (Plan, bool) {
	plans := map[string]Plan{
		"basic": {ID: "basic", Amount: 100, Credits: 150},
		"pro":   {ID: "pro", Amount: 500, Credits: 650},
	}
	p, ok := plans[id]
	return p, ok
}

func RazorpayConfigured(key, secret string) bool {
	if key == "" || secret == "" {
		return false
	}
	if strings.Contains(key, "add your") || strings.Contains(secret, "add your") {
		return false
	}
	return true
}

func CreateRazorpayOrder(key, secret string, amountPaise int, receipt string) (map[string]any, error) {
	if !RazorpayConfigured(key, secret) {
		return nil, fmt.Errorf("razorpay is not configured")
	}
	body, _ := json.Marshal(map[string]any{
		"amount":   amountPaise,
		"currency": "INR",
		"receipt":  receipt,
	})
	req, err := http.NewRequest(http.MethodPost, "https://api.razorpay.com/v1/orders", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.SetBasicAuth(key, secret)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 20 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 300 {
		return nil, fmt.Errorf("%s", strings.TrimSpace(string(raw)))
	}
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}
	return out, nil
}
