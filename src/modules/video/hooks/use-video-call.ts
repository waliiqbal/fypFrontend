"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { env } from "@/config/env";
import { getAccessToken } from "@/infrastructure/auth/session-storage";

export type CallPhase = "idle" | "connecting" | "waiting" | "in-call" | "ended" | "error";
export type ChatMessage = { from: "doctor" | "patient"; name?: string; text: string; at: string };
type Signal = { type: "offer" | "answer" | "ice-candidate"; payload: unknown };

/**
 * Peer-to-peer WebRTC call. The backend (Socket.io namespace /video) only relays signaling.
 * Rule: whoever is already in the room creates the offer when the other side joins.
 */
export function useVideoCall(appointmentId: number, iceServers: RTCIceServer[]) {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [peerMedia, setPeerMedia] = useState({ audio: true, video: true });
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);

  /** Camera + mic preview before joining. */
  const startPreview = useCallback(async () => {
    if (streamRef.current) return streamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch {
      setError("Camera or microphone permission was denied. Allow access in your browser and try again.");
      setPhase("error");
      return null;
    }
  }, []);

  const send = useCallback((signal: Signal) => socketRef.current?.emit("signal", signal), []);

  const newPeerConnection = useCallback(() => {
    pcRef.current?.close();
    pendingIce.current = [];
    const pc = new RTCPeerConnection({ iceServers });
    streamRef.current?.getTracks().forEach((track) => pc.addTrack(track, streamRef.current!));
    pc.onicecandidate = (event) => {
      if (event.candidate) send({ type: "ice-candidate", payload: event.candidate.toJSON() });
    };
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0] ?? new MediaStream([event.track]));
      setPhase("in-call");
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") setError("Connection lost. Check your internet or rejoin the call.");
    };
    pcRef.current = pc;
    return pc;
  }, [iceServers, send]);

  const flushIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc?.remoteDescription) return;
    for (const candidate of pendingIce.current.splice(0)) await pc.addIceCandidate(candidate).catch(() => undefined);
  }, []);

  const handleSignal = useCallback(
    async ({ type, payload }: Signal) => {
      let pc = pcRef.current;
      if (type === "offer") {
        pc = newPeerConnection();
        await pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({ type: "answer", payload: answer });
        await flushIce();
      } else if (type === "answer" && pc) {
        await pc.setRemoteDescription(payload as RTCSessionDescriptionInit);
        await flushIce();
      } else if (type === "ice-candidate") {
        if (pc?.remoteDescription) await pc.addIceCandidate(payload as RTCIceCandidateInit).catch(() => undefined);
        else pendingIce.current.push(payload as RTCIceCandidateInit);
      }
    },
    [flushIce, newPeerConnection, send],
  );

  const join = useCallback(async () => {
    const stream = await startPreview();
    if (!stream) return;
    setError(null);
    setPhase("connecting");
    const socket = io(`${env.apiBaseUrl}/video`, { auth: { token: getAccessToken() }, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("call-error", (e: { message: string }) => {
      setError(e.message);
      setPhase("error");
    });
    socket.on("signal", (s: Signal) => void handleSignal(s));
    socket.on("chat", (m: ChatMessage) => setMessages((list) => [...list, m]));
    socket.on("media-state", (m: { audio: boolean; video: boolean }) => setPeerMedia({ audio: m.audio, video: m.video }));
    socket.on("peer-joined", async () => {
      // I was waiting: start a fresh connection and send the offer.
      const pc = newPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send({ type: "offer", payload: offer });
    });
    socket.on("peer-left", () => {
      pcRef.current?.close();
      pcRef.current = null;
      setRemoteStream(null);
      setPhase("waiting");
    });
    socket.on("connect", () => {
      socket.emit("join", { appointmentId }, (ack: { ok: boolean; message?: string; peerPresent?: boolean }) => {
        if (!ack?.ok) {
          setError(ack?.message ?? "Could not join the call.");
          setPhase("error");
          socket.disconnect();
          return;
        }
        // If the other person is already inside, they will send the offer.
        setPhase("waiting");
      });
    });
    socket.on("connect_error", () => {
      setError("Cannot reach the call server. Is the backend running?");
      setPhase("error");
    });
  }, [appointmentId, handleSignal, newPeerConnection, send, startPreview]);

  const toggleMic = useCallback(() => {
    const next = !micOn;
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
    socketRef.current?.emit("media-state", { audio: next, video: camOn });
  }, [camOn, micOn]);

  const toggleCam = useCallback(() => {
    const next = !camOn;
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
    socketRef.current?.emit("media-state", { audio: micOn, video: next });
  }, [camOn, micOn]);

  const sendChat = useCallback((text: string) => {
    if (text.trim()) socketRef.current?.emit("chat", { text });
  }, []);

  const hangUp = useCallback(() => {
    socketRef.current?.emit("leave");
    socketRef.current?.disconnect();
    socketRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setPhase("ended");
  }, []);

  useEffect(() => () => {
    socketRef.current?.disconnect();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return { phase, error, localStream, remoteStream, micOn, camOn, peerMedia, messages, startPreview, join, toggleMic, toggleCam, sendChat, hangUp };
}
