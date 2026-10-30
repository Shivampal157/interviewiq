package auth

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID string `json:"userId"`
	jwt.RegisteredClaims
}

func Sign(secret, userID string) (string, error) {
	claims := Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

func Parse(secret, token string) (string, error) {
	parsed, err := jwt.ParseWithClaims(token, &Claims{}, func(t *jwt.Token) (any, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return "", err
	}
	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return "", jwt.ErrTokenInvalidClaims
	}
	return claims.UserID, nil
}

func CookieFromRequest(r *http.Request) string {
	if ck, err := r.Cookie("token"); err == nil && ck.Value != "" {
		return ck.Value
	}
	return parseCookieHeader(r.Header.Get("Cookie"), "token")
}

func parseCookieHeader(header, name string) string {
	for _, part := range strings.Split(header, ";") {
		part = strings.TrimSpace(part)
		if strings.HasPrefix(part, name+"=") {
			return strings.TrimPrefix(part, name+"=")
		}
	}
	return ""
}

func cookieSecurity(r *http.Request) (http.SameSite, bool) {
	isHTTPS := (r != nil && (r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https"))) ||
		strings.HasPrefix(os.Getenv("CLIENT_URL"), "https://") ||
		strings.HasPrefix(os.Getenv("RENDER_EXTERNAL_URL"), "https://") ||
		os.Getenv("RAILWAY_PUBLIC_DOMAIN") != ""

	isCrossOrigin := false
	if r != nil {
		reqOrigin := strings.TrimRight(r.Header.Get("Origin"), "/")
		originHost := strings.TrimPrefix(strings.TrimPrefix(reqOrigin, "https://"), "http://")
		if originHost != "" && !strings.EqualFold(originHost, r.Host) {
			isCrossOrigin = true
		}
	}

	if isCrossOrigin && isHTTPS {
		return http.SameSiteNoneMode, true
	}
	return http.SameSiteLaxMode, isHTTPS
}

func SetAuthCookie(w http.ResponseWriter, r *http.Request, token string) {
	sameSite, secure := cookieSecurity(r)
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		MaxAge:   7 * 24 * 60 * 60,
		HttpOnly: true,
		SameSite: sameSite,
		Secure:   secure,
	})
}

func ClearAuthCookie(w http.ResponseWriter, r *http.Request) {
	sameSite, secure := cookieSecurity(r)
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: sameSite,
		Secure:   secure,
	})
}
