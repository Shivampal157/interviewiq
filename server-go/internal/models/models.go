package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	Name      string             `bson:"name" json:"name"`
	Email     string             `bson:"email" json:"email"`
	Credits   int                `bson:"credits" json:"credits"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type Question struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	Question      string             `bson:"question" json:"question"`
	Difficulty    string             `bson:"difficulty" json:"difficulty"`
	TimeLimit     int                `bson:"timeLimit" json:"timeLimit"`
	Answer        string             `bson:"answer,omitempty" json:"answer"`
	Feedback      string             `bson:"feedback,omitempty" json:"feedback"`
	Score         float64            `bson:"score" json:"score"`
	Confidence    float64            `bson:"confidence" json:"confidence"`
	Communication float64            `bson:"communication" json:"communication"`
	Correctness   float64            `bson:"correctness" json:"correctness"`
}

type Interview struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	UserID     primitive.ObjectID `bson:"userId" json:"userId"`
	Role       string             `bson:"role" json:"role"`
	Experience string             `bson:"experience" json:"experience"`
	Mode       string             `bson:"mode" json:"mode"`
	ResumeText string             `bson:"resumeText,omitempty" json:"resumeText"`
	Questions  []Question         `bson:"questions" json:"questions"`
	FinalScore float64            `bson:"finalScore" json:"finalScore"`
	Status     string             `bson:"status" json:"status"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt  time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type InterviewSummary struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	Role       string             `bson:"role" json:"role"`
	Experience string             `bson:"experience" json:"experience"`
	Mode       string             `bson:"mode" json:"mode"`
	FinalScore float64            `bson:"finalScore" json:"finalScore"`
	Status     string             `bson:"status" json:"status"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
}

type Payment struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	UserID            primitive.ObjectID `bson:"userId" json:"userId"`
	PlanID            string             `bson:"planId,omitempty" json:"planId"`
	Amount            float64            `bson:"amount" json:"amount"`
	Credits           int                `bson:"credits" json:"credits"`
	RazorpayOrderID   string             `bson:"razorpayOrderId,omitempty" json:"razorpayOrderId"`
	RazorpayPaymentID string             `bson:"razorpayPaymentId,omitempty" json:"razorpayPaymentId"`
	Status            string             `bson:"status" json:"status"`
	CreatedAt         time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt         time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type PeerMessage struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	SenderID   primitive.ObjectID `bson:"senderId,omitempty" json:"senderId"`
	SenderName string             `bson:"senderName,omitempty" json:"senderName"`
	SenderRole string             `bson:"senderRole,omitempty" json:"senderRole"`
	Text       string             `bson:"text" json:"text"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt  time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type PeerInterview struct {
	ID              primitive.ObjectID  `bson:"_id,omitempty" json:"_id"`
	HostID          primitive.ObjectID  `bson:"hostId" json:"hostId"`
	InterviewerID   *primitive.ObjectID `bson:"interviewerId,omitempty" json:"interviewerId"`
	HostName        string              `bson:"hostName,omitempty" json:"hostName"`
	InterviewerName string              `bson:"interviewerName,omitempty" json:"interviewerName"`
	Role            string              `bson:"role" json:"role"`
	Experience      string              `bson:"experience" json:"experience"`
	Mode            string              `bson:"mode" json:"mode"`
	ScheduledAt     time.Time           `bson:"scheduledAt" json:"scheduledAt"`
	InviteCode      string              `bson:"inviteCode" json:"inviteCode"`
	Status          string              `bson:"status" json:"status"`
	Messages        []PeerMessage       `bson:"messages" json:"messages"`
	Feedback        string              `bson:"feedback,omitempty" json:"feedback"`
	Prompt          string              `bson:"prompt,omitempty" json:"prompt"`
	Language        string              `bson:"language,omitempty" json:"language"`
	Code            string              `bson:"code,omitempty" json:"code"`
	Output          string              `bson:"output,omitempty" json:"output"`
	StartedAt       *time.Time          `bson:"startedAt,omitempty" json:"startedAt"`
	CreatedAt       time.Time           `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time           `bson:"updatedAt" json:"updatedAt"`
}
