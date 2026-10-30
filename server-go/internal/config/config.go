package config

import (
	"os"
	"path/filepath"
	"strings"

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

func cleanEnv(key string) string {
	return strings.Trim(strings.TrimSpace(os.Getenv(key)), `"'`)
}

func Load() Config {
	_ = godotenv.Load()
	_ = godotenv.Load(".env")
	_ = godotenv.Load(filepath.Join("..", "server", ".env"))
	_ = godotenv.Load(filepath.Join("server", ".env"))

	port := cleanEnv("PORT")
	if port == "" {
		port = "8000"
	}
	client := strings.TrimRight(cleanEnv("CLIENT_URL"), "/")
	if client == "" {
		if renderURL := strings.TrimRight(cleanEnv("RENDER_EXTERNAL_URL"), "/"); renderURL != "" {
			client = renderURL
		} else if railwayDomain := strings.TrimRight(cleanEnv("RAILWAY_PUBLIC_DOMAIN"), "/"); railwayDomain != "" {
			if strings.HasPrefix(railwayDomain, "http://") || strings.HasPrefix(railwayDomain, "https://") {
				client = railwayDomain
			} else {
				client = "https://" + railwayDomain
			}
		} else {
			client = "http://localhost:5173"
		}
	}
	return Config{
		Port:           port,
		MongoURL:       cleanEnv("MONGODB_URL"),
		JWTSecret:      cleanEnv("JWT_SECRET"),
		ClientURL:      client,
		OpenRouterKey:  cleanEnv("OPENROUTER_API_KEY"),
		RazorpayKey:    cleanEnv("RAZORPAY_KEY_ID"),
		RazorpaySecret: cleanEnv("RAZORPAY_KEY_SECRET"),
	}
}
