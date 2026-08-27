import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import AuthModel from "../components/AuthModel";
import CodePad, { STARTERS } from "../components/CodePad";
import { useProctoring } from "../hooks/useProctoring";
import { connectRoomSocket } from "../hooks/useRoomSocket";
import { ServerUrl } from "../App";

const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

function formatElapsed(startedAt) {
  if (!startedAt) return "00:00";
  const s = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
}

function PeerRoom() {
  const { code } = useParams();
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState(null);
  const [myRole, setMyRole] = useState("candidate");
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [remoteAlert, setRemoteAlert] = useState("");
  const [remoteFlags, setRemoteFlags] = useState(null);
  const [leftTab, setLeftTab] = useState("problem");
  const [notes, setNotes] = useState("");
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [source, setSource] = useState("");
  const [output, setOutput] = useState("");
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clock, setClock] = useState("00:00");
  const [inviteOpen, setInviteOpen] = useState(true);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const makingOffer = useRef(false);
  const skipEcho = useRef(false);
  const padReady = useRef(false);
  const proctor = useProctoring({ enabled: true });

  const inviteUrl = useMemo(() => `${window.location.origin}/peer/${code}`, [code]);
  const live = session?.status === "live";
  const ended = session?.status === "completed";

  useEffect(() => {
    if (!userData) {
      setShowAuth(true);
      return;
    }
    const boot = async () => {
      try {
        const { data } = await axios.post(ServerUrl + `/api/peer/${code}/join`, {}, { withCredentials: true });
        setSession(data.session);
        setMyRole(data.myRole);
        setPrompt(data.session.prompt || "");
        setLanguage(data.session.language || "javascript");
        setSource(data.session.code || STARTERS.javascript);
        setOutput(data.session.output || "");
        skipEcho.current = true;
        padReady.current = true;
        if (!data.session.interviewerId) setInviteOpen(true);
      } catch (err) {
        setError(err.response?.data?.message || "Could not join this room");
      }
    };
    boot();
  }, [userData, code]);

  useEffect(() => {
    if (userData) proctor.startCamera();
  }, [userData]);

  useEffect(() => {
    const pc = pcRef.current;
    const stream = proctor.streamRef.current;
    if (!pc || !stream || !proctor.cameraOn) return;
    stream.getTracks().forEach((track) => {
      const exists = pc.getSenders().some((s) => s.track === track);
      if (!exists) pc.addTrack(track, stream);
    });
  }, [proctor.cameraOn]);

  useEffect(() => {
    if (!live || !session?.startedAt) {
      setClock("00:00");
      return undefined;
    }
    const tick = () => setClock(formatElapsed(session.startedAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [live, session?.startedAt]);

  useEffect(() => {
    if (!userData || !session) return undefined;
    const socket = connectRoomSocket(ServerUrl);
    socketRef.current = socket;
    socket.emit("join-room", code);

    socket.on("chat-message", (msg) => {
      setSession((prev) => (prev ? { ...prev, messages: [...(prev.messages || []), msg] } : prev));
    });
    socket.on("session-status", ({ status }) => {
      setSession((prev) => (prev ? { ...prev, status, startedAt: status === "live" ? prev.startedAt || new Date().toISOString() : prev.startedAt } : prev));
    });
    socket.on("proctor-flag", ({ alert, flags }) => {
      setRemoteAlert(alert);
      setRemoteFlags(flags || null);
    });
    socket.on("pad-update", (pad) => {
      skipEcho.current = true;
      if (typeof pad.prompt === "string") setPrompt(pad.prompt);
      if (typeof pad.source === "string") setSource(pad.source);
      if (pad.language) setLanguage(pad.language);
    });
    socket.on("pad-output", ({ output: next }) => {
      if (typeof next === "string") setOutput(next);
    });

    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-signal", { code, signal: { candidate: event.candidate } });
      }
    };
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    const addLocalTracks = () => {
      const stream = proctor.streamRef.current;
      if (!stream) return;
      stream.getTracks().forEach((track) => {
        const exists = pc.getSenders().some((s) => s.track?.kind === track.kind);
        if (!exists) pc.addTrack(track, stream);
      });
    };
    addLocalTracks();

    const createOffer = async () => {
      try {
        makingOffer.current = true;
        addLocalTracks();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-signal", { code, signal: { sdp: pc.localDescription } });
      } catch (err) {
        console.error(err);
      } finally {
        makingOffer.current = false;
      }
    };

    socket.on("presence", () => {
      if (myRole === "candidate") createOffer();
    });

    socket.on("webrtc-signal", async ({ signal }) => {
      try {
        if (signal.sdp) {
          const offerCollision = signal.sdp.type === "offer" && (makingOffer.current || pc.signalingState !== "stable");
          if (offerCollision && myRole === "candidate") return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (signal.sdp.type === "offer") {
            addLocalTracks();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("webrtc-signal", { code, signal: { sdp: pc.localDescription } });
          }
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      socket.disconnect();
      pc.close();
    };
  }, [userData, session?._id, code, myRole]);

  useEffect(() => {
    if (!padReady.current) return undefined;
    if (skipEcho.current) {
      skipEcho.current = false;
      return undefined;
    }
    if (!socketRef.current) return undefined;
    const t = setTimeout(() => {
      socketRef.current?.emit("pad-update", { code, prompt, language, source });
    }, 220);
    return () => clearTimeout(t);
  }, [prompt, language, source, code]);

  useEffect(() => {
    if (!socketRef.current || myRole !== "candidate" || !proctor.liveAlert) return;
    socketRef.current.emit("proctor-flag", {
      code,
      alert: proctor.liveAlert,
      flags: proctor.flags,
      violationCount: proctor.violationCount,
    });
  }, [proctor.liveAlert, myRole, code]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages?.length]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    socketRef.current?.emit("chat-message", {
      code,
      text,
      senderName: userData.name,
      senderRole: myRole,
    });
    setText("");
  };

  const changeLanguage = (next) => {
    setLanguage(next);
    if (STARTERS[next]) setSource(STARTERS[next]);
  };

  const runCode = async () => {
    setRunning(true);
    setOutput("Running…");
    try {
      const { data } = await axios.post(
        ServerUrl + `/api/peer/${code}/run`,
        { language, code: source, stdin },
        { withCredentials: true, timeout: 30000 }
      );
      const next = data.output || "(no output)";
      setOutput(next);
      socketRef.current?.emit("pad-output", { code, output: next });
    } catch (err) {
      const next = err.response?.data?.output || err.response?.data?.message || err.message || "Could not run code";
      setOutput(next);
    } finally {
      setRunning(false);
    }
  };

  const startLive = async () => {
    const { data } = await axios.post(ServerUrl + `/api/peer/${code}/start`, {}, { withCredentials: true });
    setSession(data);
    socketRef.current?.emit("session-status", { code, status: "live" });
  };

  const endLive = async () => {
    const { data } = await axios.post(
      ServerUrl + `/api/peer/${code}/end`,
      { feedback },
      { withCredentials: true }
    );
    setSession(data);
    socketRef.current?.emit("session-status", { code, status: "completed" });
  };

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#0b0d12] text-zinc-200">
        {showAuth && <AuthModel onClose={() => { setShowAuth(false); if (!userData) navigate("/"); }} />}
        <p className="p-10 text-center text-zinc-500">Sign in required to join this interview.</p>
      </div>
    );
  }

  const integrityCount = myRole === "interviewer" ? (remoteFlags ? Object.values(remoteFlags).reduce((a, b) => a + (Number(b) || 0), 0) : 0) : proctor.violationCount;
  const peerName = myRole === "candidate" ? (session?.interviewerName || "Waiting for interviewer") : (session?.hostName || "Candidate");

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#0b0d12] text-zinc-200">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 bg-[#161b22] px-4 text-sm">
        <button onClick={() => navigate("/peer")} className="font-semibold tracking-tight text-white">
          InterviewIQ
        </button>
        <span className="hidden text-zinc-500 md:inline">/</span>
        <span className="hidden truncate text-zinc-400 md:inline">{session?.role || "Live coding"} · {session?.mode}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${live ? "bg-emerald-500/15 text-emerald-400" : ended ? "bg-zinc-700 text-zinc-300" : "bg-amber-500/15 text-amber-300"}`}>
          {session?.status || "…"}
        </span>
        <span className="font-mono text-zinc-300">{clock}</span>
        <span className={`hidden rounded-full px-2 py-0.5 text-[10px] md:inline ${integrityCount ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-400"}`}>
          {integrityCount ? `${integrityCount} integrity flags` : "Secure session"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={copyInvite} className="rounded-md border border-white/10 px-3 py-1 text-xs text-zinc-300 hover:bg-white/5">
            {copied ? "Copied" : "Copy invite"}
          </button>
          {!live && !ended && (
            <button onClick={startLive} className="rounded-md bg-[#238636] px-3 py-1 text-xs font-medium text-white">
              Start interview
            </button>
          )}
          {myRole === "interviewer" && !ended && (
            <button onClick={endLive} className="rounded-md bg-red-600/80 px-3 py-1 text-xs font-medium text-white">
              End
            </button>
          )}
        </div>
      </header>

      {error && <div className="bg-red-950 px-4 py-2 text-sm text-red-200">{error}</div>}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-white/10 bg-[#0e1117]">
          <div className="flex border-b border-white/10 text-xs">
            {["problem", "chat"].map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`flex-1 py-2.5 capitalize ${leftTab === tab ? "border-b-2 border-emerald-400 text-white" : "text-zinc-500"}`}
              >
                {tab === "problem" ? "Question" : `Chat${session?.messages?.length ? ` (${session.messages.length})` : ""}`}
              </button>
            ))}
          </div>
          {leftTab === "problem" ? (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={ended}
              className="min-h-0 flex-1 resize-none bg-transparent p-4 text-[13px] leading-6 text-zinc-300 outline-none"
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {(session?.messages || []).map((m) => (
                  <div key={m._id || m.createdAt} className="mb-3">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                      {m.senderName} · {m.senderRole}
                    </p>
                    <p className="mt-0.5 rounded-lg bg-white/5 px-3 py-2 text-sm text-zinc-200">{m.text}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              {!ended && (
                <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Message the room…"
                    className="flex-1 rounded-md border border-white/10 bg-[#161b22] px-3 py-2 text-sm outline-none"
                  />
                  <button className="rounded-md bg-white/10 px-3 text-xs">Send</button>
                </form>
              )}
            </div>
          )}
        </aside>

        <CodePad
          language={language}
          code={source}
          output={output}
          stdin={stdin}
          running={running}
          disabled={ended}
          onLanguage={changeLanguage}
          onCode={setSource}
          onStdin={setStdin}
          onRun={runCode}
        />

        <aside className="flex w-[240px] shrink-0 flex-col gap-2 border-l border-white/10 bg-[#161b22] p-2">
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video ref={remoteVideoRef} autoPlay playsInline className="h-36 w-full object-cover" />
            <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px]">{peerName}</span>
            <span className="absolute top-1.5 right-1.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold">LIVE</span>
          </div>
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video ref={proctor.videoRef} autoPlay muted playsInline className="h-28 w-full object-cover" />
            <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px]">You · {myRole}</span>
            {!proctor.cameraOn && (
              <button onClick={proctor.startCamera} className="absolute inset-0 grid place-items-center bg-black/70 text-xs">
                Enable camera
              </button>
            )}
          </div>
          {proctor.cameraError && <p className="text-[11px] text-red-300">{proctor.cameraError}</p>}
          {myRole === "candidate" && proctor.liveAlert && (
            <p className="rounded bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">{proctor.liveAlert}</p>
          )}
          {myRole === "interviewer" && remoteAlert && (
            <p className="rounded bg-red-500/15 px-2 py-1 text-[11px] text-red-200">Candidate: {remoteAlert}</p>
          )}
          {myRole === "interviewer" && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private interviewer notes (not shared)"
              className="min-h-0 flex-1 resize-none rounded-lg border border-white/10 bg-[#0e1117] p-2 text-[12px] outline-none"
            />
          )}
          {myRole === "interviewer" && !ended && (
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Final feedback (sent on End)"
              className="h-20 resize-none rounded-lg border border-white/10 bg-[#0e1117] p-2 text-[12px] outline-none"
            />
          )}
          {ended && (
            <p className="rounded-lg bg-emerald-500/10 p-2 text-[12px] text-emerald-200">
              Interview complete. {session.feedback || "No written feedback."}
            </p>
          )}
        </aside>
      </div>

      {inviteOpen && !session?.interviewerId && myRole === "candidate" && (
        <div className="absolute right-4 top-16 z-20 w-80 rounded-xl border border-white/10 bg-[#161b22] p-4 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Invite interviewer</p>
            <button onClick={() => setInviteOpen(false)} className="text-zinc-500">×</button>
          </div>
          <p className="break-all rounded-md bg-black/40 p-2 font-mono text-[11px] text-zinc-400">{inviteUrl}</p>
          <button onClick={copyInvite} className="mt-3 w-full rounded-md bg-[#238636] py-2 text-sm text-white">
            {copied ? "Link copied" : "Copy interview link"}
          </button>
          <p className="mt-2 text-[11px] text-zinc-500">Share this like a CoderPad / HackerRank CodePair link. Your friend signs in and becomes the interviewer.</p>
        </div>
      )}
    </div>
  );
}

export default PeerRoom;
