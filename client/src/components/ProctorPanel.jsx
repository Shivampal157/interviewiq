export default function ProctorPanel({
  videoRef,
  cameraOn,
  cameraError,
  liveAlert,
  flags,
  violationCount,
  onEnable,
  title = "Candidate camera",
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs ${cameraOn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {cameraOn ? "LIVE" : "OFF"}
        </span>
      </div>
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} autoPlay muted playsInline className="h-44 w-full object-cover" />
        {!cameraOn && (
          <div className="absolute inset-0 grid place-items-center bg-black/70 p-3 text-center text-sm text-white">
            Camera required
          </div>
        )}
      </div>
      {cameraError && <p className="mt-2 text-xs text-red-600">{cameraError}</p>}
      {liveAlert && <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">{liveAlert}</p>}
      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-gray-500">
        <span>Tab switches: {flags.tabSwitch}</span>
        <span>Left window: {flags.windowBlur}</span>
        <span>No face: {flags.noFace}</span>
        <span>Extra person: {flags.extraFace}</span>
      </div>
      <p className={`mt-2 text-xs font-medium ${violationCount > 3 ? "text-red-600" : "text-gray-500"}`}>
        Integrity flags: {violationCount}
      </p>
      {!cameraOn && (
        <button onClick={onEnable} className="mt-2 w-full rounded-full bg-black py-2 text-xs text-white">
          Enable camera
        </button>
      )}
    </div>
  );
}
