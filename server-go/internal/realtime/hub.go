package realtime

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"

	"interviewiq/internal/auth"
	"interviewiq/internal/models"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type Envelope struct {
	Event   string          `json:"event"`
	Payload json.RawMessage `json:"payload"`
}

type Client struct {
	id     string
	userID string
	conn   *websocket.Conn
	send   chan []byte
	rooms  map[string]bool
	hub    *Hub
}

type Hub struct {
	secret  string
	peers   *mongo.Collection
	mu      sync.RWMutex
	clients map[*Client]bool
	rooms   map[string]map[*Client]bool
	saves   map[string]*time.Timer
	up      websocket.Upgrader
}

func New(secret string, origin string, peers *mongo.Collection) *Hub {
	return &Hub{
		secret:  secret,
		peers:   peers,
		clients: map[*Client]bool{},
		rooms:   map[string]map[*Client]bool{},
		saves:   map[string]*time.Timer{},
		up: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				o := r.Header.Get("Origin")
				return o == "" || o == origin
			},
		},
	}
}

func (h *Hub) Handle(w http.ResponseWriter, r *http.Request) {
	token := auth.CookieFromRequest(r)
	userID, err := auth.Parse(h.secret, token)
	if err != nil || userID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"message":"Please sign in"}`))
		return
	}
	conn, err := h.up.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	client := &Client{
		id:     primitive.NewObjectID().Hex(),
		userID: userID,
		conn:   conn,
		send:   make(chan []byte, 32),
		rooms:  map[string]bool{},
		hub:    h,
	}
	h.mu.Lock()
	h.clients[client] = true
	h.mu.Unlock()
	go client.write()
	client.read()
}

func (c *Client) read() {
	defer func() {
		c.hub.remove(c)
		_ = c.conn.Close()
	}()
	c.conn.SetReadLimit(1 << 20)
	_ = c.conn.SetReadDeadline(time.Now().Add(90 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(90 * time.Second))
		return nil
	})
	for {
		_, data, err := c.conn.ReadMessage()
		if err != nil {
			return
		}
		var env Envelope
		if json.Unmarshal(data, &env) != nil || env.Event == "" {
			continue
		}
		c.handle(env)
	}
}

func (c *Client) write() {
	tick := time.NewTicker(30 * time.Second)
	defer tick.Stop()
	for {
		select {
		case msg, ok := <-c.send:
			if !ok {
				return
			}
			_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-tick.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handle(env Envelope) {
	switch env.Event {
	case "join-room":
		var code string
		if json.Unmarshal(env.Payload, &code) != nil {
			var wrap struct {
				Code string `json:"code"`
			}
			_ = json.Unmarshal(env.Payload, &wrap)
			code = wrap.Code
		}
		c.join(strings.ToUpper(code))
	case "webrtc-signal":
		c.forward("webrtc-signal", env.Payload, true)
	case "proctor-flag":
		c.forward("proctor-flag", env.Payload, true)
	case "session-status":
		c.forward("session-status", env.Payload, false)
	case "pad-output":
		c.forward("pad-output", env.Payload, true)
	case "pad-update":
		c.forward("pad-update", env.Payload, true)
		c.schedulePadSave(env.Payload)
	case "chat-message":
		c.saveChat(env.Payload)
	}
}

func (c *Client) join(code string) {
	if code == "" {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	var session models.PeerInterview
	if err := c.hub.peers.FindOne(ctx, bson.M{"inviteCode": code}).Decode(&session); err != nil {
		return
	}
	c.hub.mu.Lock()
	if c.hub.rooms[code] == nil {
		c.hub.rooms[code] = map[*Client]bool{}
	}
	c.hub.rooms[code][c] = true
	c.rooms[code] = true
	c.hub.mu.Unlock()
	c.hub.broadcast(code, "presence", map[string]any{"userId": c.userID, "socketId": c.id, "message": "joined"}, nil)
}

func (c *Client) forward(event string, payload json.RawMessage, excludeSelf bool) {
	var body map[string]any
	if json.Unmarshal(payload, &body) != nil {
		return
	}
	code, _ := body["code"].(string)
	code = strings.ToUpper(code)
	if excludeSelf {
		body["from"] = c.id
		body["userId"] = c.userID
	}
	var skip *Client
	if excludeSelf {
		skip = c
	}
	c.hub.broadcast(code, event, body, skip)
}

func (c *Client) saveChat(payload json.RawMessage) {
	var body struct {
		Code       string `json:"code"`
		Text       string `json:"text"`
		SenderName string `json:"senderName"`
		SenderRole string `json:"senderRole"`
	}
	if json.Unmarshal(payload, &body) != nil {
		return
	}
	clean := strings.TrimSpace(body.Text)
	if len(clean) > 2000 {
		clean = clean[:2000]
	}
	if clean == "" {
		return
	}
	room := strings.ToUpper(body.Code)
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	oid, _ := primitive.ObjectIDFromHex(c.userID)
	now := time.Now()
	msg := models.PeerMessage{
		ID: primitive.NewObjectID(), SenderID: oid, SenderName: body.SenderName,
		SenderRole: body.SenderRole, Text: clean, CreatedAt: now, UpdatedAt: now,
	}
	_, err := c.hub.peers.UpdateOne(ctx, bson.M{"inviteCode": room}, bson.M{
		"$push": bson.M{"messages": msg},
		"$set":  bson.M{"updatedAt": now},
	})
	if err != nil {
		return
	}
	c.hub.broadcast(room, "chat-message", msg, nil)
}

func (c *Client) schedulePadSave(payload json.RawMessage) {
	var body struct {
		Code     string `json:"code"`
		Prompt   *string `json:"prompt"`
		Language string  `json:"language"`
		Source   *string `json:"source"`
	}
	if json.Unmarshal(payload, &body) != nil {
		return
	}
	room := strings.ToUpper(body.Code)
	c.hub.mu.Lock()
	if t, ok := c.hub.saves[room]; ok {
		t.Stop()
	}
	c.hub.saves[room] = time.AfterFunc(800*time.Millisecond, func() {
		ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
		defer cancel()
		set := bson.M{"updatedAt": time.Now()}
		if body.Prompt != nil {
			p := *body.Prompt
			if len(p) > 20000 {
				p = p[:20000]
			}
			set["prompt"] = p
		}
		if body.Source != nil {
			s := *body.Source
			if len(s) > 40000 {
				s = s[:40000]
			}
			set["code"] = s
		}
		if body.Language == "javascript" || body.Language == "python" || body.Language == "java" || body.Language == "cpp" {
			set["language"] = body.Language
		}
		_, _ = c.hub.peers.UpdateOne(ctx, bson.M{"inviteCode": room}, bson.M{"$set": set})
	})
	c.hub.mu.Unlock()
}

func (h *Hub) broadcast(room, event string, payload any, skip *Client) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return
	}
	out, _ := json.Marshal(Envelope{Event: event, Payload: raw})
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.rooms[room] {
		if skip != nil && client == skip {
			continue
		}
		select {
		case client.send <- out:
		default:
		}
	}
}

func (h *Hub) remove(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if !h.clients[c] {
		return
	}
	delete(h.clients, c)
	for room := range c.rooms {
		delete(h.rooms[room], c)
	}
	close(c.send)
}
