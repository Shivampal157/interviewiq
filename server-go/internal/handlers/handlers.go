package handlers

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"interviewiq/internal/auth"
	"interviewiq/internal/config"
	"interviewiq/internal/httpx"
	"interviewiq/internal/models"
	"interviewiq/internal/services"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type API struct {
	Cfg  config.Config
	DB   *mongo.Database
	Users, Interviews, Payments, Peers *mongo.Collection
}

func New(cfg config.Config, db *mongo.Database) *API {
	return &API{
		Cfg:        cfg,
		DB:         db,
		Users:      db.Collection("users"),
		Interviews: db.Collection("interviews"),
		Payments:   db.Collection("payments"),
		Peers:      db.Collection("peerinterviews"),
	}
}

func ctx() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 12*time.Second)
}

func (a *API) GoogleAuth(c *httpx.C) {
	var body struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := c.BindJSON(&body); err != nil || body.Email == "" {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "name and email are required"})
		return
	}
	cx, cancel := ctx()
	defer cancel()
	var user models.User
	err := a.Users.FindOne(cx, bson.M{"email": body.Email}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		now := time.Now()
		user = models.User{
			ID:        primitive.NewObjectID(),
			Name:      body.Name,
			Email:     body.Email,
			Credits:   100,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if _, err := a.Users.InsertOne(cx, user); err != nil {
			c.JSON(http.StatusInternalServerError, map[string]any{"message": "Google auth error " + err.Error()})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, map[string]any{"message": "Google auth error " + err.Error()})
		return
	}
	token, err := auth.Sign(a.Cfg.JWTSecret, user.ID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, map[string]any{"message": "Google auth error " + err.Error()})
		return
	}
	auth.SetAuthCookie(c.W, token)
	c.JSON(http.StatusOK, user)
}

func (a *API) Logout(c *httpx.C) {
	auth.ClearAuthCookie(c.W)
	c.JSON(http.StatusOK, map[string]any{"message": "LogOut Successfully"})
}

func (a *API) CurrentUser(c *httpx.C) {
	cx, cancel := ctx()
	defer cancel()
	var user models.User
	err := a.Users.FindOne(cx, bson.M{"_id": c.UserID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, map[string]any{"message": "user does not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (a *API) AnalyzeResume(c *httpx.C) {
	file, err := c.FormFile("resume")
	if err != nil {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "Resume required"})
		return
	}
	dir := filepath.Join(os.TempDir(), "interviewiq")
	_ = os.MkdirAll(dir, 0700)
	dst := filepath.Join(dir, fmt.Sprintf("%d-%s", time.Now().UnixNano(), filepath.Base(file.Filename)))
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, map[string]any{"message": err.Error()})
		return
	}
	defer os.Remove(dst)

	resumeText, err := services.ExtractPDFText(dst)
	if err != nil {
		c.JSON(http.StatusInternalServerError, map[string]any{"message": err.Error()})
		return
	}
	resumeText = strings.Join(strings.Fields(resumeText), " ")

	ai := services.AskAI(a.Cfg.OpenRouterKey, []services.ChatMessage{
		{Role: "system", Content: `Extract structured data from resume.

Return strictly JSON:

{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}
`},
		{Role: "user", Content: resumeText},
	})
	var parsed struct {
		Role       string   `json:"role"`
		Experience string   `json:"experience"`
		Projects   []string `json:"projects"`
		Skills     []string `json:"skills"`
	}
	_ = json.Unmarshal([]byte(services.StripJSONFence(ai)), &parsed)
	if parsed.Projects == nil {
		parsed.Projects = []string{}
	}
	if parsed.Skills == nil {
		parsed.Skills = []string{}
	}
	c.JSON(http.StatusOK, map[string]any{
		"role": parsed.Role, "experience": parsed.Experience,
		"projects": parsed.Projects, "skills": parsed.Skills, "resumeText": resumeText,
	})
}

func (a *API) GenerateQuestions(c *httpx.C) {
	var body struct {
		Role       string   `json:"role"`
		Experience string   `json:"experience"`
		Mode       string   `json:"mode"`
		ResumeText string   `json:"resumeText"`
		Projects   []string `json:"projects"`
		Skills     []string `json:"skills"`
	}
	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "Role, Experience and Mode are required."})
		return
	}
	body.Role = strings.TrimSpace(body.Role)
	body.Experience = strings.TrimSpace(body.Experience)
	body.Mode = strings.TrimSpace(body.Mode)
	if body.Role == "" || body.Experience == "" || body.Mode == "" {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "Role, Experience and Mode are required."})
		return
	}
	cx, cancel := ctx()
	defer cancel()
	var user models.User
	if err := a.Users.FindOne(cx, bson.M{"_id": c.UserID}).Decode(&user); err != nil {
		c.JSON(http.StatusNotFound, map[string]any{"message": "User not found."})
		return
	}
	if user.Credits < 50 {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "Not enough credits. Minimum 50 required."})
		return
	}
	projects := "None"
	if len(body.Projects) > 0 {
		projects = strings.Join(body.Projects, ", ")
	}
	skills := "None"
	if len(body.Skills) > 0 {
		skills = strings.Join(body.Skills, ", ")
	}
	safeResume := strings.TrimSpace(body.ResumeText)
	if safeResume == "" {
		safeResume = "None"
	}
	ai := services.AskAI(a.Cfg.OpenRouterKey, []services.ChatMessage{
		{Role: "system", Content: `You are a real human interviewer conducting a professional interview.

Speak in simple, natural English as if you are directly talking to the candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Difficulty progression:
Question 1 → easy  
Question 2 → easy  
Question 3 → medium  
Question 4 → medium  
Question 5 → hard  

Make questions based on the candidate’s role, experience,interviewMode, projects, skills, and resume details.
`},
		{Role: "user", Content: fmt.Sprintf("Role:%s\nExperience:%s\nInterviewMode:%s\nProjects:%s\nSkills:%s,\nResume:%s", body.Role, body.Experience, body.Mode, projects, skills, safeResume)},
	})
	fallback := []string{
		fmt.Sprintf("Walk me through a recent project you built as a %s and what you owned end to end.", body.Role),
		fmt.Sprintf("How do you debug a production issue when users report a %s feature is failing?", body.Role),
		fmt.Sprintf("Explain how you would design a simple authentication flow for a %s product.", body.Role),
		fmt.Sprintf("What trade-offs do you consider while choosing tools and architecture as a %s?", body.Role),
		fmt.Sprintf("Tell me about a mistake you made at %s experience level and what you changed after it.", body.Experience),
	}
	re := regexp.MustCompile(`^\d+[).\s-]+`)
	var qs []string
	for _, line := range strings.Split(ai, "\n") {
		line = strings.TrimSpace(re.ReplaceAllString(line, ""))
		if line != "" {
			qs = append(qs, line)
		}
	}
	if len(qs) != 5 {
		qs = fallback
	}
	diffs := []string{"easy", "easy", "medium", "medium", "hard"}
	limits := []int{60, 60, 90, 90, 120}
	questions := make([]models.Question, 5)
	for i := 0; i < 5; i++ {
		questions[i] = models.Question{
			ID: primitive.NewObjectID(), Question: qs[i], Difficulty: diffs[i], TimeLimit: limits[i],
		}
	}
	now := time.Now()
	interview := models.Interview{
		ID: primitive.NewObjectID(), UserID: user.ID, Role: body.Role, Experience: body.Experience,
		Mode: body.Mode, ResumeText: safeResume, Questions: questions, Status: "Incompleted",
		CreatedAt: now, UpdatedAt: now,
	}
	if _, err := a.Interviews.InsertOne(cx, interview); err != nil {
		c.JSON(http.StatusInternalServerError, map[string]any{"message": "failed to create interview " + err.Error()})
		return
	}
	user.Credits -= 50
	_, _ = a.Users.UpdateByID(cx, user.ID, bson.M{"$set": bson.M{"credits": user.Credits, "updatedAt": now}})
	c.JSON(http.StatusOK, map[string]any{
		"interviewId": interview.ID, "creditsLeft": user.Credits, "userName": user.Name, "questions": interview.Questions,
	})
}

func (a *API) SubmitAnswer(c *httpx.C) {
	var body struct {
		InterviewID   string `json:"interviewId"`
		QuestionIndex int    `json:"questionIndex"`
		Answer        string `json:"answer"`
		TimeTaken     int    `json:"timeTaken"`
	}
	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "failed to submit answer"})
		return
	}
	oid, err := primitive.ObjectIDFromHex(body.InterviewID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, map[string]any{"message": "failed to submit answer " + err.Error()})
		return
	}
	cx, cancel := ctx()
	defer cancel()
	var interview models.Interview
	if err := a.Interviews.FindOne(cx, bson.M{"_id": oid}).Decode(&interview); err != nil {
		c.JSON(http.StatusInternalServerError, map[string]any{"message": "failed to submit answer " + err.Error()})
		return
	}
	if body.QuestionIndex < 0 || body.QuestionIndex >= len(interview.Questions) {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "failed to submit answer"})
		return
	}
	q := interview.Questions[body.QuestionIndex]
	if body.Answer == "" {
		q.Score, q.Feedback, q.Answer = 0, "You did not submit an answer.", ""
		interview.Questions[body.QuestionIndex] = q
		_, _ = a.Interviews.UpdateByID(cx, oid, bson.M{"$set": bson.M{"questions": interview.Questions, "updatedAt": time.Now()}})
		c.JSON(http.StatusOK, map[string]any{"feedback": q.Feedback})
		return
	}
	if body.TimeTaken > q.TimeLimit {
		q.Score, q.Feedback, q.Answer = 0, "Time limit exceeded. Answer not evaluated.", body.Answer
		interview.Questions[body.QuestionIndex] = q
		_, _ = a.Interviews.UpdateByID(cx, oid, bson.M{"$set": bson.M{"questions": interview.Questions, "updatedAt": time.Now()}})
		c.JSON(http.StatusOK, map[string]any{"feedback": q.Feedback})
		return
	}
	ai := services.AskAI(a.Cfg.OpenRouterKey, []services.ChatMessage{
		{Role: "system", Content: `You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly, like a real person would.

Score the answer in these areas (0 to 10):

1. Confidence – Does the answer sound clear, confident, and well-presented?
2. Communication – Is the language simple, clear, and easy to understand?
3. Correctness – Is the answer accurate, relevant, and complete?

Rules:
- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.
- Consider clarity, structure, and relevance.

Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

Feedback Rules:
- Write natural human feedback.
- 10 to 15 words only.
- Sound like real interview feedback.
- Can suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.
- Keep tone professional and honest.

Return ONLY valid JSON in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"
}
`},
		{Role: "user", Content: fmt.Sprintf("Question: %s\nAnswer: %s", q.Question, body.Answer)},
	})
	var parsed struct {
		Confidence    float64 `json:"confidence"`
		Communication float64 `json:"communication"`
		Correctness   float64 `json:"correctness"`
		FinalScore    float64 `json:"finalScore"`
		Feedback      string  `json:"feedback"`
	}
	if json.Unmarshal([]byte(services.StripJSONFence(ai)), &parsed) != nil || parsed.Feedback == "" {
		parsed = struct {
			Confidence    float64 `json:"confidence"`
			Communication float64 `json:"communication"`
			Correctness   float64 `json:"correctness"`
			FinalScore    float64 `json:"finalScore"`
			Feedback      string  `json:"feedback"`
		}{6, 6, 6, 6, "Decent attempt. Add a concrete example and structure your answer more clearly."}
	}
	q.Answer, q.Confidence, q.Communication, q.Correctness, q.Score, q.Feedback = body.Answer, parsed.Confidence, parsed.Communication, parsed.Correctness, parsed.FinalScore, parsed.Feedback
	interview.Questions[body.QuestionIndex] = q
	_, _ = a.Interviews.UpdateByID(cx, oid, bson.M{"$set": bson.M{"questions": interview.Questions, "updatedAt": time.Now()}})
	c.JSON(http.StatusOK, map[string]any{"feedback": parsed.Feedback})
}

func (a *API) FinishInterview(c *httpx.C) {
	var body struct {
		InterviewID string `json:"interviewId"`
	}
	_ = c.BindJSON(&body)
	oid, err := primitive.ObjectIDFromHex(body.InterviewID)
	if err != nil {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "failed to find Interview"})
		return
	}
	cx, cancel := ctx()
	defer cancel()
	var interview models.Interview
	if err := a.Interviews.FindOne(cx, bson.M{"_id": oid}).Decode(&interview); err != nil {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "failed to find Interview"})
		return
	}
	n := float64(len(interview.Questions))
	var totalScore, conf, comm, corr float64
	for _, q := range interview.Questions {
		totalScore += q.Score
		conf += q.Confidence
		comm += q.Communication
		corr += q.Correctness
	}
	final := 0.0
	if n > 0 {
		final = totalScore / n
		conf, comm, corr = conf/n, comm/n, corr/n
	}
	_, _ = a.Interviews.UpdateByID(cx, oid, bson.M{"$set": bson.M{"finalScore": final, "status": "completed", "updatedAt": time.Now()}})
	rows := make([]map[string]any, 0, len(interview.Questions))
	for _, q := range interview.Questions {
		rows = append(rows, map[string]any{"question": q.Question, "score": q.Score, "feedback": q.Feedback, "confidence": q.Confidence, "communication": q.Communication, "correctness": q.Correctness})
	}
	c.JSON(http.StatusOK, map[string]any{
		"finalScore": round1(final), "confidence": round1(conf), "communication": round1(comm), "correctness": round1(corr), "questionWiseScore": rows,
	})
}

func (a *API) MyInterviews(c *httpx.C) {
	cx, cancel := ctx()
	defer cancel()
	cur, err := a.Interviews.Find(cx, bson.M{"userId": c.UserID}, options.Find().SetSort(bson.M{"createdAt": -1}).SetProjection(bson.M{"role": 1, "experience": 1, "mode": 1, "finalScore": 1, "status": 1, "createdAt": 1}))
	if err != nil {
		c.JSON(http.StatusInternalServerError, map[string]any{"message": "failed to find currentUser Interview " + err.Error()})
		return
	}
	var list []models.InterviewSummary
	if err := cur.All(cx, &list); err != nil {
		c.JSON(http.StatusInternalServerError, map[string]any{"message": "failed to find currentUser Interview " + err.Error()})
		return
	}
	if list == nil {
		list = []models.InterviewSummary{}
	}
	c.JSON(http.StatusOK, list)
}

func (a *API) InterviewReport(c *httpx.C) {
	oid, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, map[string]any{"message": "Interview not found"})
		return
	}
	cx, cancel := ctx()
	defer cancel()
	var interview models.Interview
	if err := a.Interviews.FindOne(cx, bson.M{"_id": oid}).Decode(&interview); err != nil {
		c.JSON(http.StatusNotFound, map[string]any{"message": "Interview not found"})
		return
	}
	n := float64(len(interview.Questions))
	var conf, comm, corr float64
	for _, q := range interview.Questions {
		conf += q.Confidence
		comm += q.Communication
		corr += q.Correctness
	}
	if n > 0 {
		conf, comm, corr = conf/n, comm/n, corr/n
	}
	c.JSON(http.StatusOK, map[string]any{
		"finalScore": interview.FinalScore, "confidence": round1(conf), "communication": round1(comm), "correctness": round1(corr), "questionWiseScore": interview.Questions,
	})
}

func (a *API) CreateOrder(c *httpx.C) {
	var body struct {
		PlanID  string  `json:"planId"`
		Amount  float64 `json:"amount"`
		Credits int     `json:"credits"`
	}
	_ = c.BindJSON(&body)
	if body.Amount == 0 || body.Credits == 0 {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "Invalid plan data"})
		return
	}
	order, err := services.CreateRazorpayOrder(a.Cfg.RazorpayKey, a.Cfg.RazorpaySecret, int(body.Amount*100), fmt.Sprintf("receipt_%d", time.Now().UnixMilli()))
	if err != nil {
		c.JSON(http.StatusInternalServerError, map[string]any{"message": "failed to create Razorpay order " + err.Error()})
		return
	}
	cx, cancel := ctx()
	defer cancel()
	now := time.Now()
	id, _ := order["id"].(string)
	_, _ = a.Payments.InsertOne(cx, models.Payment{
		ID: primitive.NewObjectID(), UserID: c.UserID, PlanID: body.PlanID, Amount: body.Amount, Credits: body.Credits,
		RazorpayOrderID: id, Status: "created", CreatedAt: now, UpdatedAt: now,
	})
	c.JSON(http.StatusOK, order)
}

func (a *API) VerifyPayment(c *httpx.C) {
	var body struct {
		OrderID   string `json:"razorpay_order_id"`
		PaymentID string `json:"razorpay_payment_id"`
		Signature string `json:"razorpay_signature"`
	}
	_ = c.BindJSON(&body)
	mac := hmac.New(sha256.New, []byte(a.Cfg.RazorpaySecret))
	_, _ = mac.Write([]byte(body.OrderID + "|" + body.PaymentID))
	expected := hex.EncodeToString(mac.Sum(nil))
	if expected != body.Signature {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "Invalid payment signature"})
		return
	}
	cx, cancel := ctx()
	defer cancel()
	var payment models.Payment
	if err := a.Payments.FindOne(cx, bson.M{"razorpayOrderId": body.OrderID}).Decode(&payment); err != nil {
		c.JSON(http.StatusNotFound, map[string]any{"message": "Payment not found"})
		return
	}
	if payment.Status == "paid" {
		c.JSON(http.StatusOK, map[string]any{"message": "Already processed"})
		return
	}
	now := time.Now()
	_, _ = a.Payments.UpdateByID(cx, payment.ID, bson.M{"$set": bson.M{"status": "paid", "razorpayPaymentId": body.PaymentID, "updatedAt": now}})
	var user models.User
	_ = a.Users.FindOneAndUpdate(cx, bson.M{"_id": payment.UserID}, bson.M{"$inc": bson.M{"credits": payment.Credits}, "$set": bson.M{"updatedAt": now}}, options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&user)
	c.JSON(http.StatusOK, map[string]any{"success": true, "message": "Payment verified and credits added", "user": user})
}

func (a *API) CreatePeer(c *httpx.C) {
	var body struct {
		Role        string `json:"role"`
		Experience  string `json:"experience"`
		Mode        string `json:"mode"`
		ScheduledAt string `json:"scheduledAt"`
	}
	_ = c.BindJSON(&body)
	if body.Role == "" || body.Experience == "" || body.Mode == "" || body.ScheduledAt == "" {
		c.JSON(http.StatusBadRequest, map[string]any{"message": "Role, experience, mode and time are required"})
		return
	}
	when := parseWhen(body.ScheduledAt)
	cx, cancel := ctx()
	defer cancel()
	var user models.User
	_ = a.Users.FindOne(cx, bson.M{"_id": c.UserID}).Decode(&user)
	prompt, lang, code := services.PadForMode(body.Mode)
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	now := time.Now()
	session := models.PeerInterview{
		ID: primitive.NewObjectID(), HostID: c.UserID, HostName: orDefault(user.Name, "Candidate"),
		Role: body.Role, Experience: body.Experience, Mode: body.Mode, ScheduledAt: when,
		InviteCode: strings.ToUpper(hex.EncodeToString(b)), Status: "scheduled", Messages: []models.PeerMessage{},
		Prompt: prompt, Language: lang, Code: code, CreatedAt: now, UpdatedAt: now,
	}
	if _, err := a.Peers.InsertOne(cx, session); err != nil {
		c.JSON(http.StatusInternalServerError, map[string]any{"message": "Create peer interview failed " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, session)
}

func (a *API) MyPeers(c *httpx.C) {
	cx, cancel := ctx()
	defer cancel()
	uid := c.UserID
	cur, err := a.Peers.Find(cx, bson.M{"$or": []bson.M{{"hostId": uid}, {"interviewerId": uid}}}, options.Find().SetSort(bson.M{"scheduledAt": -1}).SetProjection(bson.M{"messages": 0}))
	if err != nil {
		c.JSON(http.StatusInternalServerError, map[string]any{"message": err.Error()})
		return
	}
	var list []models.PeerInterview
	_ = cur.All(cx, &list)
	if list == nil {
		list = []models.PeerInterview{}
	}
	c.JSON(http.StatusOK, list)
}

func (a *API) GetPeer(c *httpx.C) {
	session, err := a.findPeer(strings.ToUpper(c.Param("code")))
	if err != nil {
		c.JSON(http.StatusNotFound, map[string]any{"message": "This invite link is invalid"})
		return
	}
	c.JSON(http.StatusOK, session)
}

func (a *API) JoinPeer(c *httpx.C) {
	code := strings.ToUpper(c.Param("code"))
	session, err := a.findPeer(code)
	if err != nil {
		c.JSON(http.StatusNotFound, map[string]any{"message": "This invite link is invalid"})
		return
	}
	cx, cancel := ctx()
	defer cancel()
	uid := c.UserID
	var user models.User
	_ = a.Users.FindOne(cx, bson.M{"_id": uid}).Decode(&user)
	isHost := session.HostID == uid
	set := bson.M{"updatedAt": time.Now()}
	dirty := false
	if !isHost {
		if session.InterviewerID != nil && *session.InterviewerID != uid {
			c.JSON(http.StatusForbidden, map[string]any{"message": "An interviewer has already joined this session"})
			return
		}
		set["interviewerId"] = uid
		set["interviewerName"] = orDefault(user.Name, "Friend")
		if session.Status == "scheduled" {
			set["status"] = "waiting"
		}
		dirty = true
	}
	if session.Prompt == "" || session.Code == "" {
		p, l, codePad := services.PadForMode(session.Mode)
		if session.Prompt == "" {
			set["prompt"] = p
		}
		if session.Code == "" {
			set["code"] = codePad
		}
		if session.Language == "" {
			set["language"] = l
		}
		dirty = true
	}
	if dirty {
		_, _ = a.Peers.UpdateByID(cx, session.ID, bson.M{"$set": set})
		session, _ = a.findPeer(code)
	}
	role := "interviewer"
	if isHost {
		role = "candidate"
	}
	c.JSON(http.StatusOK, map[string]any{"session": session, "myRole": role})
}

func (a *API) StartPeer(c *httpx.C) {
	session, err := a.findPeer(strings.ToUpper(c.Param("code")))
	if err != nil {
		c.JSON(http.StatusNotFound, map[string]any{"message": "Session not found"})
		return
	}
	uid := c.UserID
	if session.HostID != uid && (session.InterviewerID == nil || *session.InterviewerID != uid) {
		c.JSON(http.StatusForbidden, map[string]any{"message": "Not allowed"})
		return
	}
	cx, cancel := ctx()
	defer cancel()
	now := time.Now()
	set := bson.M{"status": "live", "updatedAt": now}
	if session.StartedAt == nil {
		set["startedAt"] = now
	}
	_, _ = a.Peers.UpdateByID(cx, session.ID, bson.M{"$set": set})
	session, _ = a.findPeer(session.InviteCode)
	c.JSON(http.StatusOK, session)
}

func (a *API) EndPeer(c *httpx.C) {
	session, err := a.findPeer(strings.ToUpper(c.Param("code")))
	if err != nil {
		c.JSON(http.StatusNotFound, map[string]any{"message": "Session not found"})
		return
	}
	uid := c.UserID
	if session.HostID != uid && (session.InterviewerID == nil || *session.InterviewerID != uid) {
		c.JSON(http.StatusForbidden, map[string]any{"message": "Not allowed"})
		return
	}
	var body struct {
		Feedback string `json:"feedback"`
	}
	_ = c.BindJSON(&body)
	if body.Feedback == "" {
		body.Feedback = session.Feedback
	}
	cx, cancel := ctx()
	defer cancel()
	_, _ = a.Peers.UpdateByID(cx, session.ID, bson.M{"$set": bson.M{"status": "completed", "feedback": body.Feedback, "updatedAt": time.Now()}})
	session, _ = a.findPeer(session.InviteCode)
	c.JSON(http.StatusOK, session)
}

func (a *API) RunPeer(c *httpx.C) {
	session, err := a.findPeer(strings.ToUpper(c.Param("code")))
	if err != nil {
		c.JSON(http.StatusNotFound, map[string]any{"message": "Session not found"})
		return
	}
	uid := c.UserID
	if session.HostID != uid && (session.InterviewerID == nil || *session.InterviewerID != uid) {
		c.JSON(http.StatusForbidden, map[string]any{"message": "Not allowed"})
		return
	}
	var body struct {
		Language string `json:"language"`
		Code     string `json:"code"`
		Stdin    string `json:"stdin"`
	}
	_ = c.BindJSON(&body)
	out, err := services.ExecuteCode(body.Language, body.Code, body.Stdin)
	if err != nil {
		c.JSON(http.StatusBadRequest, map[string]any{"message": err.Error(), "output": err.Error()})
		return
	}
	lang := body.Language
	if lang != "javascript" && lang != "python" && lang != "java" && lang != "cpp" {
		lang = "javascript"
	}
	cx, cancel := ctx()
	defer cancel()
	_, _ = a.Peers.UpdateByID(cx, session.ID, bson.M{"$set": bson.M{"language": lang, "code": body.Code, "output": out, "updatedAt": time.Now()}})
	c.JSON(http.StatusOK, map[string]any{"output": out, "language": lang})
}

func (a *API) findPeer(code string) (*models.PeerInterview, error) {
	cx, cancel := ctx()
	defer cancel()
	var session models.PeerInterview
	err := a.Peers.FindOne(cx, bson.M{"inviteCode": code}).Decode(&session)
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func parseWhen(s string) time.Time {
	layouts := []string{time.RFC3339Nano, time.RFC3339, "2006-01-02T15:04:05", "2006-01-02T15:04"}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t
		}
		if t, err := time.ParseInLocation(layout, s, time.Local); err == nil {
			return t
		}
	}
	return time.Now().Add(5 * time.Minute)
}

func orDefault(v, d string) string {
	if strings.TrimSpace(v) == "" {
		return d
	}
	return v
}

func round1(v float64) float64 {
	return float64(int(v*10+0.5)) / 10
}
