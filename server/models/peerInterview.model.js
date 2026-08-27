import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    senderName: String,
    senderRole: { type: String, enum: ["candidate", "interviewer"] },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const peerSchema = new mongoose.Schema(
  {
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    hostName: String,
    interviewerName: String,
    role: { type: String, required: true },
    experience: { type: String, required: true },
    mode: { type: String, enum: ["HR", "Technical"], required: true },
    scheduledAt: { type: Date, required: true },
    inviteCode: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["scheduled", "waiting", "live", "completed", "cancelled"],
      default: "scheduled",
    },
    messages: [messageSchema],
    feedback: { type: String, default: "" },
    prompt: { type: String, default: "" },
    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      default: "javascript",
    },
    code: { type: String, default: "" },
    output: { type: String, default: "" },
    startedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const PeerInterview = mongoose.model("PeerInterview", peerSchema);
export default PeerInterview;
