package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"interviewiq/internal/config"
	"interviewiq/internal/db"
	"interviewiq/internal/distributed"
	"interviewiq/internal/handlers"
	"interviewiq/internal/httpx"
	"interviewiq/internal/realtime"
)

// spaHandler serves the built React app and falls back to index.html for client-side routes.
func spaHandler(dir string) http.HandlerFunc {
	files := http.FileServer(http.Dir(dir))
	return func(w http.ResponseWriter, r *http.Request) {
		p := filepath.Join(dir, filepath.Clean("/"+r.URL.Path))
		if st, err := os.Stat(p); err != nil || st.IsDir() {
			http.ServeFile(w, r, filepath.Join(dir, "index.html"))
			return
		}
		files.ServeHTTP(w, r)
	}
}

func main() {
	cfg := config.Load()
	database := db.Connect(cfg.MongoURL)
	api := handlers.New(cfg, database)
	hub := realtime.New(cfg.JWTSecret, cfg.ClientURL, api.Peers)
	auth := func(h func(*httpx.C)) http.HandlerFunc { return httpx.WrapAuth(cfg.JWTSecret, h) }

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/auth/google", httpx.Wrap(api.GoogleAuth))
	mux.HandleFunc("GET /api/auth/logout", httpx.Wrap(api.Logout))
	mux.HandleFunc("GET /api/user/current-user", auth(api.CurrentUser))

	mux.HandleFunc("POST /api/interview/resume", auth(api.AnalyzeResume))
	mux.HandleFunc("POST /api/interview/generate-questions", auth(api.GenerateQuestions))
	mux.HandleFunc("POST /api/interview/submit-answer", auth(api.SubmitAnswer))
	mux.HandleFunc("POST /api/interview/finish", auth(api.FinishInterview))
	mux.HandleFunc("GET /api/interview/get-interview", auth(api.MyInterviews))
	mux.HandleFunc("GET /api/interview/report/{id}", auth(api.InterviewReport))

	mux.HandleFunc("GET /api/payment/key", auth(api.PaymentKey))
	mux.HandleFunc("POST /api/payment/order", auth(api.CreateOrder))
	mux.HandleFunc("POST /api/payment/verify", auth(api.VerifyPayment))

	mux.HandleFunc("POST /api/peer/create", auth(api.CreatePeer))
	mux.HandleFunc("GET /api/peer/mine", auth(api.MyPeers))
	mux.HandleFunc("GET /api/peer/{code}", auth(api.GetPeer))
	mux.HandleFunc("POST /api/peer/{code}/join", auth(api.JoinPeer))
	mux.HandleFunc("POST /api/peer/{code}/start", auth(api.StartPeer))
	mux.HandleFunc("POST /api/peer/{code}/end", auth(api.EndPeer))
	mux.HandleFunc("POST /api/peer/{code}/run", auth(api.RunPeer))

	mux.HandleFunc("GET /ws", hub.Handle)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		dbStatus := "connected"
		if !db.Connected() {
			dbStatus = "connecting_or_database_not_reachable"
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":       true,
			"engine":   "go",
			"nodeId":   distributed.Default.NodeID,
			"region":   distributed.Default.Region,
			"database": dbStatus,
		})
	})

	// Distributed Systems Telemetry, Stress Benchmark & Prometheus Exporter
	mux.HandleFunc("GET /api/system/telemetry", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(distributed.Default.TelemetrySnapshot(db.Connected()))
	})
	mux.HandleFunc("POST /api/system/benchmark", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		bench := distributed.Default.RunStressBenchmark(16)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":        true,
			"benchmark": bench,
			"telemetry": distributed.Default.TelemetrySnapshot(db.Connected()),
		})
	})
	mux.HandleFunc("GET /metrics", func(w http.ResponseWriter, r *http.Request) {
		distributed.Default.ServePrometheus(w, db.Connected())
	})

	if st, err := os.Stat("static"); err == nil && st.IsDir() {
		mux.HandleFunc("GET /", spaHandler("static"))
		log.Println("Serving frontend from ./static")
	}

	addr := ":" + cfg.Port
	log.Printf("Server running on port %s (Go | Node=%s | Region=%s)", cfg.Port, distributed.Default.NodeID, distributed.Default.Region)
	if err := http.ListenAndServe(addr, httpx.CORS(cfg.ClientURL, distributed.Default.WrapHTTP(mux))); err != nil {
		log.Fatal(err)
	}
}
