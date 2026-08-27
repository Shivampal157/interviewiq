import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import PeerInterview from "./models/peerInterview.model.js";

const parseCookie = (cookieHeader = "", name) => {
  const part = cookieHeader.split(";").find((c) => c.trim().startsWith(`${name}=`));
  return part ? decodeURIComponent(part.split("=")[1]) : null;
};

export const attachSocket = (app) => {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = parseCookie(socket.handshake.headers.cookie || "", "token");
      if (!token) return next(new Error("Please sign in"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid session"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-room", async (code) => {
      const session = await PeerInterview.findOne({ inviteCode: String(code).toUpperCase() });
      if (!session) return;
      const room = String(code).toUpperCase();
      socket.join(room);
      io.to(room).emit("presence", {
        userId: socket.userId,
        socketId: socket.id,
        message: "joined",
      });
    });

    socket.on("webrtc-signal", ({ code, signal }) => {
      socket.to(String(code).toUpperCase()).emit("webrtc-signal", {
        from: socket.id,
        userId: socket.userId,
        signal,
      });
    });

    socket.on("proctor-flag", ({ code, alert, flags, violationCount }) => {
      socket.to(String(code).toUpperCase()).emit("proctor-flag", {
        alert,
        flags,
        violationCount,
      });
    });

    socket.on("chat-message", async ({ code, text, senderName, senderRole }) => {
      const clean = String(text || "").trim().slice(0, 2000);
      if (!clean) return;
      const room = String(code).toUpperCase();
      const session = await PeerInterview.findOne({ inviteCode: room });
      if (!session) return;
      session.messages.push({
        senderId: socket.userId,
        senderName,
        senderRole,
        text: clean,
      });
      await session.save();
      const last = session.messages[session.messages.length - 1];
      io.to(room).emit("chat-message", last);
    });

    socket.on("session-status", ({ code, status }) => {
      io.to(String(code).toUpperCase()).emit("session-status", { status });
    });

    socket.on("pad-update", ({ code, prompt, language, source }) => {
      const room = String(code).toUpperCase();
      socket.to(room).emit("pad-update", {
        prompt,
        language,
        source,
        from: socket.id,
      });
      if (typeof source !== "string" && typeof prompt !== "string") return;
      clearTimeout(socket._padSave);
      socket._padSave = setTimeout(async () => {
        const session = await PeerInterview.findOne({ inviteCode: room });
        if (!session) return;
        if (typeof prompt === "string") session.prompt = prompt.slice(0, 20000);
        if (typeof source === "string") session.code = source.slice(0, 40000);
        if (["javascript", "python", "java", "cpp"].includes(language)) session.language = language;
        await session.save();
      }, 800);
    });

    socket.on("pad-output", ({ code, output }) => {
      socket.to(String(code).toUpperCase()).emit("pad-output", {
        output: String(output || "").slice(0, 12000),
        from: socket.id,
      });
    });
  });

  return server;
};
