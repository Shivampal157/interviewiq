import crypto from "crypto";
import PeerInterview from "../models/peerInterview.model.js";
import User from "../models/user.model.js";
import { padForMode } from "../utils/interviewPad.js";
import { executeInterviewCode } from "../services/codeRunner.js";

const makeCode = () => crypto.randomBytes(4).toString("hex").toUpperCase();

export const createPeerInterview = async (req, res) => {
  try {
    const { role, experience, mode, scheduledAt } = req.body;
    if (!role || !experience || !mode || !scheduledAt) {
      return res.status(400).json({ message: "Role, experience, mode and time are required" });
    }

    const user = await User.findById(req.userId);
    const pad = padForMode(mode);
    const session = await PeerInterview.create({
      hostId: req.userId,
      hostName: user?.name || "Candidate",
      role,
      experience,
      mode,
      scheduledAt: new Date(scheduledAt),
      inviteCode: makeCode(),
      status: "scheduled",
      prompt: pad.prompt,
      language: pad.language,
      code: pad.code,
      output: "",
    });

    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: `Create peer interview failed ${error.message}` });
  }
};

export const runPeerCode = async (req, res) => {
  try {
    const session = await PeerInterview.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (String(session.hostId) !== String(req.userId) && String(session.interviewerId) !== String(req.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const language = ["javascript", "python", "java", "cpp"].includes(req.body?.language)
      ? req.body.language
      : "javascript";
    const code = String(req.body?.code || "");
    const stdin = String(req.body?.stdin || "");

    const output = await executeInterviewCode({ language, code, stdin });

    session.language = language;
    session.code = code;
    session.output = output;
    await session.save();

    return res.json({ output, language });
  } catch (error) {
    const message = error.message || "Could not run code";
    return res.status(400).json({ message, output: message });
  }
};

export const myPeerInterviews = async (req, res) => {
  try {
    const sessions = await PeerInterview.find({
      $or: [{ hostId: req.userId }, { interviewerId: req.userId }],
    })
      .sort({ scheduledAt: -1 })
      .select("-messages");
    return res.json(sessions);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPeerByCode = async (req, res) => {
  try {
    const session = await PeerInterview.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!session) return res.status(404).json({ message: "This invite link is invalid" });
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const joinPeerInterview = async (req, res) => {
  try {
    const session = await PeerInterview.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!session) return res.status(404).json({ message: "This invite link is invalid" });

    const user = await User.findById(req.userId);
    const isHost = String(session.hostId) === String(req.userId);

    let dirty = false;
    if (!isHost) {
      if (session.interviewerId && String(session.interviewerId) !== String(req.userId)) {
        return res.status(403).json({ message: "An interviewer has already joined this session" });
      }
      session.interviewerId = req.userId;
      session.interviewerName = user?.name || "Friend";
      if (session.status === "scheduled") session.status = "waiting";
      dirty = true;
    }

    if (!session.prompt || !session.code) {
      const pad = padForMode(session.mode);
      session.prompt = session.prompt || pad.prompt;
      session.code = session.code || pad.code;
      session.language = session.language || pad.language;
      dirty = true;
    }
    if (dirty) await session.save();

    return res.json({
      session,
      myRole: isHost ? "candidate" : "interviewer",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const startPeerInterview = async (req, res) => {
  try {
    const session = await PeerInterview.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (String(session.hostId) !== String(req.userId) && String(session.interviewerId) !== String(req.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    session.status = "live";
    if (!session.startedAt) session.startedAt = new Date();
    await session.save();
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const endPeerInterview = async (req, res) => {
  try {
    const session = await PeerInterview.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (String(session.interviewerId) !== String(req.userId) && String(session.hostId) !== String(req.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    session.status = "completed";
    session.feedback = req.body?.feedback || session.feedback;
    await session.save();
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
