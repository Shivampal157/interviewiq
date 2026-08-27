package httpx

import (
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"os"

	"interviewiq/internal/auth"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type C struct {
	W      http.ResponseWriter
	R      *http.Request
	UserID primitive.ObjectID
}

func (c *C) JSON(code int, v any) {
	c.W.Header().Set("Content-Type", "application/json")
	c.W.WriteHeader(code)
	_ = json.NewEncoder(c.W).Encode(v)
}

func (c *C) BindJSON(v any) error {
	defer c.R.Body.Close()
	return json.NewDecoder(c.R.Body).Decode(v)
}

func (c *C) Param(name string) string {
	return c.R.PathValue(name)
}

func (c *C) FormFile(name string) (*multipart.FileHeader, error) {
	if err := c.R.ParseMultipartForm(6 << 20); err != nil {
		return nil, err
	}
	_, hdr, err := c.R.FormFile(name)
	return hdr, err
}

func (c *C) SaveUploadedFile(hdr *multipart.FileHeader, dst string) error {
	src, err := hdr.Open()
	if err != nil {
		return err
	}
	defer src.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, src)
	return err
}

func (c *C) Authenticate(secret string) bool {
	token := auth.CookieFromRequest(c.R)
	if token == "" {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "user does not have a token"})
		return false
	}
	userID, err := auth.Parse(secret, token)
	if err != nil {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "user does not have a valid token"})
		return false
	}
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "user does not have a valid token"})
		return false
	}
	c.UserID = oid
	return true
}

func Wrap(h func(*C)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h(&C{W: w, R: r})
	}
}

func WrapAuth(secret string, h func(*C)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c := &C{W: w, R: r}
		if !c.Authenticate(secret) {
			return
		}
		h(c)
	}
}

func CORS(origin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
