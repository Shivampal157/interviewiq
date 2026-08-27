import { useCallback, useEffect, useRef, useState } from "react";

export function useProctoring({ enabled = true } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [flags, setFlags] = useState({
    tabSwitch: 0,
    windowBlur: 0,
    noFace: 0,
    extraFace: 0,
    cameraOff: 0,
  });
  const [liveAlert, setLiveAlert] = useState("");

  const addFlag = useCallback((key, message) => {
    setFlags((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    setLiveAlert(message);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraOn(true);
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        setCameraOn(false);
        addFlag("cameraOff", "Camera was turned off. Keep it on during the interview.");
      });
      return stream;
    } catch {
      setCameraError("Camera and microphone permission is required. Allow access and retry.");
      setCameraOn(false);
      return null;
    }
  }, [addFlag]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => {
    if (!enabled || !cameraOn) return undefined;
    const started = Date.now();

    const onHidden = () => {
      if (Date.now() - started < 2500) return;
      if (document.hidden) {
        addFlag("tabSwitch", "Tab switch detected. Stay on this page.");
      }
    };
    const onBlur = () => {
      if (Date.now() - started < 2500) return;
      addFlag("windowBlur", "You left the interview window.");
    };
    const block = (e) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);

    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
    };
  }, [enabled, cameraOn, addFlag]);

  useEffect(() => {
    if (!enabled || !cameraOn) return undefined;
    let cancelled = false;

    const tick = async () => {
      if (cancelled || !videoRef.current) return;
      try {
        if ("FaceDetector" in window) {
          const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
          const faces = await detector.detect(videoRef.current);
          if (faces.length === 0) {
            addFlag("noFace", "Face not visible. Look at the camera.");
          } else if (faces.length > 1) {
            addFlag("extraFace", "More than one person detected.");
          }
        }
      } catch {
        /* FaceDetector not supported or frame not ready */
      }
    };

    const id = setInterval(tick, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, cameraOn, addFlag]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const violationCount =
    flags.tabSwitch + flags.windowBlur + flags.noFace + flags.extraFace + flags.cameraOff;

  return {
    videoRef,
    streamRef,
    cameraOn,
    cameraError,
    flags,
    liveAlert,
    violationCount,
    startCamera,
    stopCamera,
  };
}
