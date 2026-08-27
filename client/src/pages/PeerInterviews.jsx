import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthModel from "../components/AuthModel";
import { ServerUrl } from "../App";

function PeerInterviews() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [role, setRole] = useState("Software Engineer");
  const [experience, setExperience] = useState("Fresher");
  const [mode, setMode] = useState("Technical");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const load = async () => {
    const { data } = await axios.get(ServerUrl + "/api/peer/mine", { withCredentials: true });
    setSessions(data);
  };

  useEffect(() => {
    if (!userData) return;
    load().catch(() => {});
  }, [userData]);

  const create = async (e) => {
    e.preventDefault();
    if (!userData) {
      setShowAuth(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const when = scheduledAt || new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const { data } = await axios.post(
        ServerUrl + "/api/peer/create",
        { role, experience, mode, scheduledAt: when },
        { withCredentials: true }
      );
      setScheduledAt("");
      await load();
      navigate(`/peer/${data.inviteCode}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not schedule the interview");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async (code) => {
    const url = `${window.location.origin}/peer/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <Navbar />
      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Live coding interview</h1>
        <p className="mt-2 text-gray-500">
          FAANG-style CodePair room: shared editor, question panel, video, and Run. You are the candidate. Send the invite to a friend who interviews you.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <form onSubmit={create} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">New session</h2>
            <div className="space-y-3">
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Job role" className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500" required />
              <input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Experience" className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500" required />
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3">
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
              </select>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3" />
              <p className="text-xs text-gray-400">Leave the time empty to start in 5 minutes and open the room now.</p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button disabled={busy} className="w-full rounded-full bg-green-600 py-3 font-semibold text-white disabled:bg-gray-400">
                {busy ? "Creating..." : "Create & open room"}
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">My sessions</h2>
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s._id} className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{s.role} · {s.mode}</p>
                      <p className="text-sm text-gray-500">{new Date(s.scheduledAt).toLocaleString()}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-green-700">{s.status}</p>
                      <p className="text-xs text-gray-400">Interviewer: {s.interviewerName || "Waiting for a friend"}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => copyLink(s.inviteCode)} className="rounded-full border px-3 py-1 text-xs">
                        {copied === s.inviteCode ? "Copied" : "Copy invite"}
                      </button>
                      <button onClick={() => navigate(`/peer/${s.inviteCode}`)} className="rounded-full bg-black px-3 py-1 text-xs text-white">
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!sessions.length && <p className="text-sm text-gray-500">No sessions yet. Create one to get started.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PeerInterviews;
