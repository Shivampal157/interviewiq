package config

import (
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	MongoURL       string
	JWTSecret      string
	ClientURL      string
	OpenRouterKey  string
	RazorpayKey    string
	RazorpaySecret string
}

func Load() Config {
	_ = godotenv.Load()
	_ = godotenv.Load(".env")
	_ = godotenv.Load(filepath.Join("..", "server", ".env"))
	_ = godotenv.Load(filepath.Join("server", ".env"))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	client := os.Getenv("CLIENT_URL")
	if client == "" {
		client = "http://localhost:5173"
	}
	return Config{
		Port:           port,
		MongoURL:       os.Getenv("MONGODB_URL"),
		JWTSecret:      os.Getenv("JWT_SECRET"),
		ClientURL:      client,
		OpenRouterKey:  os.Getenv("OPENROUTER_API_KEY"),
		RazorpayKey:    os.Getenv("RAZORPAY_KEY_ID"),
		RazorpaySecret: os.Getenv("RAZORPAY_KEY_SECRET"),
	}
}
