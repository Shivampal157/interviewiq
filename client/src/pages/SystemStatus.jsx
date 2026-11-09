import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ServerUrl } from "../App";
import {
  BsCpu,
  BsLightningChargeFill,
  BsShieldCheck,
  BsDiagram3,
  BsActivity,
  BsHddNetwork,
  BsClockHistory,
  BsArrowRepeat,
  BsCheckCircleFill,
  BsExclamationTriangleFill,
} from "react-icons/bs";

function SystemStatus() {
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [benchRunning, setBenchRunning] = useState(false);
  const [benchmark, setBenchmark] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [nodeHeader, setNodeHeader] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await axios.get(`${ServerUrl}/api/system/telemetry`, {
        timeout: 8000,
      });
      setTelemetry(res.data);
      setNodeHeader(res.headers?.["x-node-id"] || res.data?.nodeId || "node-primary");
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Telemetry fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    if (!autoRefresh) return undefined;
    const id = setInterval(fetchTelemetry, 3500);
    return () => clearInterval(id);
  }, [fetchTelemetry, autoRefresh]);

  const runStressTest = async () => {
    setBenchRunning(true);
    try {
      const res = await axios.post(`${ServerUrl}/api/system/benchmark`, {});
      if (res.data?.benchmark) setBenchmark(res.data.benchmark);
      if (res.data?.telemetry) setTelemetry(res.data.telemetry);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Benchmark failed:", err);
    } finally {
      setBenchRunning(false);
    }
  };

  const t = telemetry || {
    nodeId: nodeHeader || "node-initializing",
    region: "global-edge",
    uptimeSeconds: 0,
    databaseConnected: true,
    runtime: {
      goVersion: "go1.23",
      goroutines: 12,
      numCPU: 4,
      heapAllocMB: 8.4,
      sysMemMB: 24.1,
    },
    traffic: {
      totalRequests: 1,
      errorRequests: 0,
      wsConnections: 0,
      latencyMs: { p50: 1.2, p95: 4.8, p99: 9.4 },
    },
    lamportClocks: {
      activeRooms: 0,
      totalClockTicks: 0,
      consistency: "Causal Lamport Monotonic Ordering",
    },
    workerPool: {
      workers: 4,
      activeWorkers: 0,
      queuedJobs: 0,
      queueCapacity: 64,
      completedJobs: 0,
      rejectedJobs: 0,
      avgExecMs: 0,
    },
    pubSubBackplane: {
      mode: "in-memory-partitioned-mesh",
      channel: "interviewiq:cluster:bus",
      publishedFrames: 0,
      relayedFrames: 0,
    },
    rateLimiter: {
      algorithm: "sharded-token-bucket (16 shards)",
      rateLimitRpm: 120,
      burstCapacity: 40,
      allowedTotal: 1,
      throttledTotal: 0,
    },
    circuitBreakers: [
      {
        name: "openrouter-llm",
        state: "CLOSED",
        consecutiveFailures: 0,
        failureThreshold: 4,
        totalSuccesses: 0,
        totalFailures: 0,
        cooldownSec: 25,
      },
      {
        name: "sandbox-compiler",
        state: "CLOSED",
        consecutiveFailures: 0,
        failureThreshold: 5,
        totalSuccesses: 0,
        totalFailures: 0,
        cooldownSec: 15,
      },
    ],
  };

  const formatUptime = (sec = 0) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Top Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0e1117] text-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-800 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                DISTRIBUTED SYSTEMS CONTROL PLANE · LIVE TELEMETRY
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Cluster Node{" "}
                <span className="text-emerald-400 font-mono">{t.nodeId}</span>
              </h1>
              <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
                Real-time distributed systems telemetry: Causal Lamport Logical
                Clocks, 16-Shard Token-Bucket Rate Limiting, 3-State Fault
                Circuit Breakers, Bounded Worker Pool Backpressure, and Lock-Free
                Latency Histograms.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={runStressTest}
                disabled={benchRunning}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <BsLightningChargeFill size={16} />
                {benchRunning
                  ? "Running 16x Burst..."
                  : "Run 16x Stress Benchmark"}
              </button>

              <button
                onClick={() => setAutoRefresh((v) => !v)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  autoRefresh
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-transparent border-white/10 text-zinc-400"
                }`}
              >
                <BsArrowRepeat
                  size={14}
                  className={autoRefresh ? "animate-spin" : ""}
                />
                {autoRefresh ? "Auto-Poll (3.5s)" : "Paused"}
              </button>

              <a
                href={`${ServerUrl}/metrics`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition"
              >
                /metrics (Prometheus)
              </a>
            </div>
          </div>

          {/* Cluster Pill Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-zinc-400 block">Region / Mesh</span>
              <span className="font-mono font-semibold text-white mt-0.5 block">
                {t.region} · {t.pubSubBackplane?.mode}
              </span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-zinc-400 block">MongoDB Atlas Replica</span>
              <span className="font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <BsCheckCircleFill size={12} />
                {t.databaseConnected ? "Connected (Primary)" : "Reconnecting"}
              </span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-zinc-400 block">Go Runtime / Concurrency</span>
              <span className="font-mono font-semibold text-white mt-0.5 block">
                {t.runtime?.goVersion} · {t.runtime?.goroutines} goroutines
              </span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-zinc-400 block">Node Uptime / Sync</span>
              <span className="font-mono font-semibold text-white mt-0.5 block">
                {formatUptime(t.uptimeSeconds)} {lastUpdated && `· ${lastUpdated}`}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stress Benchmark Banner (When triggered) */}
        {benchmark && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-950 text-emerald-100 border border-emerald-500/40 rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                <BsLightningChargeFill size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">
                  Concurrent Worker Pool & Lamport Clock Stress Test Completed
                </h3>
                <p className="text-xs text-emerald-300/90">
                  Dispatched {benchmark.concurrency} parallel goroutines across
                  bounded worker pool and incremented causal room vector clocks.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-emerald-400 block">COMPLETED</span>
                <span className="text-base font-bold text-white">
                  {benchmark.completedTasks}/{benchmark.concurrency}
                </span>
              </div>
              <div>
                <span className="text-emerald-400 block">TOTAL TIME</span>
                <span className="text-base font-bold text-white">
                  {benchmark.totalTimeMs} ms
                </span>
              </div>
              <div>
                <span className="text-emerald-400 block">THROUGHPUT</span>
                <span className="text-base font-bold text-emerald-300">
                  {benchmark.throughputRps} req/s
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 6-Card Distributed Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Lock-Free Latency Histogram */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  SLI Latency Histogram
                </span>
                <BsActivity className="text-emerald-600" size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Lock-Free Ring Buffer
              </h2>
              <p className="text-xs text-gray-500 mb-5">
                512-sample atomic circular buffer computing real-time p50, p95,
                and p99 tail latencies.
              </p>

              <div className="space-y-3">
                {[
                  { label: "p50 (Median)", val: t.traffic?.latencyMs?.p50 || 0, color: "bg-emerald-500" },
                  { label: "p95 (Tail)", val: t.traffic?.latencyMs?.p95 || 0, color: "bg-blue-500" },
                  { label: "p99 (Worst)", val: t.traffic?.latencyMs?.p99 || 0, color: "bg-amber-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-mono font-bold text-gray-900">
                        {item.val} ms
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-300`}
                        style={{
                          width: `${Math.min(100, Math.max(8, item.val * 3))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-600 font-mono">
              <span>Requests: {t.traffic?.totalRequests}</span>
              <span>Active WS: {t.traffic?.wsConnections}</span>
              <span>5xx: {t.traffic?.errorRequests}</span>
            </div>
          </div>

          {/* 2. Three-State Circuit Breakers */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Fault Isolation
                </span>
                <BsShieldCheck className="text-emerald-600" size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                3-State Circuit Breakers
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Automatic CLOSED → OPEN → HALF_OPEN state machine preventing
                cascading failures on downstream LLM & compiler calls.
              </p>

              <div className="space-y-3">
                {(t.circuitBreakers || []).map((cb) => {
                  const isClosed = cb.state === "CLOSED";
                  return (
                    <div
                      key={cb.name}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-gray-800">
                          {cb.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isClosed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {cb.state}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                        <span>Pass: {cb.totalSuccesses}</span>
                        <span>Fail: {cb.totalFailures}</span>
                        <span>
                          Trip: {cb.consecutiveFailures}/{cb.failureThreshold}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1.5">
              <BsCheckCircleFill className="text-emerald-600" size={13} />
              <span>Fail-fast fallback enabled for AI & Code Runner</span>
            </div>
          </div>

          {/* 3. Bounded Sandbox Worker Pool */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Bulkhead Isolation
                </span>
                <BsCpu className="text-emerald-600" size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Bounded Sandbox Pool
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Semaphore-bounded worker pool ({t.workerPool?.workers} workers,{" "}
                {t.workerPool?.queueCapacity} queue depth) isolating CPU-heavy
                code executions with load-shedding backpressure.
              </p>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] text-gray-500 block">
                    ACTIVE WORKERS
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {t.workerPool?.activeWorkers} / {t.workerPool?.workers}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] text-gray-500 block">
                    QUEUE DEPTH
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {t.workerPool?.queuedJobs} / {t.workerPool?.queueCapacity}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] text-gray-500 block">
                    COMPLETED JOBS
                  </span>
                  <span className="text-base font-bold text-emerald-600">
                    {t.workerPool?.completedJobs}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] text-gray-500 block">
                    AVG EXEC TIME
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {t.workerPool?.avgExecMs} ms
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500 font-mono">
              <span>Load Shed (Rejected): {t.workerPool?.rejectedJobs}</span>
              <span>8s Hard Deadline</span>
            </div>
          </div>

          {/* 4. Causal Lamport Logical Clocks */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Distributed Consensus
                </span>
                <BsClockHistory className="text-emerald-600" size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Lamport Logical Clocks
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Enforces strict causal ordering{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">
                  L = max(L_local, L_msg) + 1
                </code>{" "}
                for collaborative code pad edits across peer interview rooms.
              </p>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Monotonic Clock Ticks:</span>
                  <span className="font-bold text-emerald-600">
                    {t.lamportClocks?.totalClockTicks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Tracked Rooms:</span>
                  <span className="font-bold text-gray-900">
                    {t.lamportClocks?.activeRooms}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ordering Model:</span>
                  <span className="text-gray-800">Causal Monotonic</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-500">Live in Peer Coding Rooms</span>
              <button
                onClick={() => navigate("/peer")}
                className="text-emerald-600 font-semibold hover:underline cursor-pointer"
              >
                Open Live Coding →
              </button>
            </div>
          </div>

          {/* 5. 16-Shard Token-Bucket Rate Limiter */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Edge Traffic Shaping
                </span>
                <BsDiagram3 className="text-emerald-600" size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                16-Shard Token Bucket
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                FNV-1a hash-partitioned rate limiter across 16 independent mutex
                shards to eliminate lock contention under high concurrency.
              </p>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sustained Rate:</span>
                  <span className="font-bold text-gray-900">
                    {t.rateLimiter?.rateLimitRpm} req/min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Burst Capacity:</span>
                  <span className="font-bold text-gray-900">
                    {t.rateLimiter?.burstCapacity} tokens
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Allowed / Throttled:</span>
                  <span className="font-bold text-emerald-600">
                    {t.rateLimiter?.allowedTotal} /{" "}
                    <span className="text-red-500">
                      {t.rateLimiter?.throttledTotal}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 font-mono">
              Headers: X-RateLimit-Limit · X-Node-ID
            </div>
          </div>

          {/* 6. Multi-Node Pub/Sub Backplane & Memory */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Horizontal Scale Bus
                </span>
                <BsHddNetwork className="text-emerald-600" size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Pub/Sub Cluster Mesh
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Zero-dependency Redis RESP wire-protocol Pub/Sub backplane with
                automatic fallback to in-memory partitioned mesh.
              </p>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Published Frames:</span>
                  <span className="font-bold text-emerald-600">
                    {t.pubSubBackplane?.publishedFrames}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cross-Node Relayed:</span>
                  <span className="font-bold text-gray-900">
                    {t.pubSubBackplane?.relayedFrames}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Heap / Sys Memory:</span>
                  <span className="font-bold text-gray-900">
                    {t.runtime?.heapAllocMB} MB / {t.runtime?.sysMemMB} MB
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 font-mono">
              Channel: {t.pubSubBackplane?.channel}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default SystemStatus;
