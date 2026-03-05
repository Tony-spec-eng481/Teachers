/**
 * AgoraClass.tsx — Teacher's Live Class Room
 *
 * ROLE: Teacher (full control)
 * - Can start/stop session, toggle mic/video, share screen, record session
 * - Manages screen sharing: only one sharer at a time
 * - Real-time chat via Agora data streams
 * - Token auto-renewal every 50 minutes
 * - Premium dark glassmorphism UI
 *
 * HOW SCREEN SHARING WORKS:
 * - Uses a separate Agora client for screen share to avoid replacing the camera track
 * - The screen share track is published with a dedicated UID (backend returns screenShareUid)
 * - A separate screenShareToken is fetched from the backend for proper authentication
 * - Other participants detect screen share by checking if UID >= SCREEN_SHARE_UID_OFFSET
 * - Only one person can share at a time (controlled by state)
 *
 * HOW CHAT WORKS:
 * - Uses Agora's data channel via client.createDataStream() + client.sendStreamMessage()
 * - A single data stream is created on join and reused for all messages
 * - Messages include sender name, role, and timestamp
 * - Incoming messages are received via the "stream-message" event
 *
 * HOW RECORDING WORKS:
 * - Teacher clicks record → backend calls Agora Cloud Recording REST API
 * - Backend POST /live-classes/recording/start acquires resource + starts recording
 * - Backend POST /live-classes/recording/stop stops and stores recording info
 * - Recording status is persisted in the database with download URLs
 *
 * HOW HAND RAISE WORKS:
 * - Students send a "hand-raise" event via data stream
 * - Teacher receives it and sees a toast notification + indicator in participants panel
 * - Teacher can acknowledge/dismiss hand raises
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AgoraRTC from "agora-rtc-sdk-ng";
import type {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  ILocalVideoTrack,
  IAgoraRTCClient,
  UID,
} from "agora-rtc-sdk-ng";
import { axiosInstance } from "../../shared/index";
import toast from "react-hot-toast";
import "../styles/LiveClassRoom.css";

// ─── Types ───────────────────────────────────────────────────────────────
interface RemoteUser {
  uid: UID;
  name: string;
  role: string;
  audioMuted: boolean;
  videoMuted: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  handRaised: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  text: string;
  timestamp: number;
}

// Data stream message types for signaling between participants
interface DataStreamMessage {
  type: "chat" | "hand-raise" | "hand-lower" | "screen-share-notify";
  payload: any;
}

// Screen share UIDs are offset by this amount from regular UIDs
const SCREEN_SHARE_UID_OFFSET = 100000;

const AgoraClass = () => {
  const { channelName } = useParams<{ channelName: string }>();
  const navigate = useNavigate();

  // ─── Connection State ──────────────────────────────────────────────
  const [appId, setAppId] = useState("");
  const [token, setToken] = useState("");
  const [screenShareToken, setScreenShareToken] = useState("");
  const [screenShareUid, setScreenShareUid] = useState(0);
  const [localUid, setLocalUid] = useState(0);
  const [userName, setUserName] = useState("Teacher");
  const [classId, setClassId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [loadingToken, setLoadingToken] = useState(true);

  // ─── Media State ───────────────────────────────────────────────────
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenShareUid, setRemoteScreenShareUid] = useState<UID | null>(null);

  // ─── Recording State ───────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResourceId, setRecordingResourceId] = useState<string | null>(null);
  const [recordingSid, setRecordingSid] = useState<string | null>(null);

  // ─── Chat State ────────────────────────────────────────────────────
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // ─── Participants State ────────────────────────────────────────────
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<UID | null>(null);

  // ─── Session Timer ────────────────────────────────────────────────
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  // ─── Refs ──────────────────────────────────────────────────────────
  const client = useRef<IAgoraRTCClient>(
    AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
  );
  const screenClient = useRef<IAgoraRTCClient>(
    AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
  );
  const localVideoTrack = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrack = useRef<IMicrophoneAudioTrack | null>(null);
  const screenVideoTrack = useRef<ILocalVideoTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const screenShareRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const tokenRenewalInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionTimerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataStreamId = useRef<number | null>(null);
  const chatOpenRef = useRef(chatOpen);

  // Keep chatOpenRef in sync
  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  // ─── Session Timer Logic ───────────────────────────────────────────
  useEffect(() => {
    if (sessionStartTime) {
      sessionTimerInterval.current = setInterval(() => {
        const diff = Date.now() - sessionStartTime;
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setElapsedTime(
          `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
        );
      }, 1000);
    }
    return () => {
      if (sessionTimerInterval.current) {
        clearInterval(sessionTimerInterval.current);
      }
    };
  }, [sessionStartTime]);

  // ─── Fetch Token ───────────────────────────────────────────────────
  useEffect(() => {
    if (!channelName) {
      toast.error("Invalid channel");
      navigate("/dashboard/live-classes");
      return;
    }

    const fetchToken = async () => {
      setLoadingToken(true);
      try {
        const res = await axiosInstance.get(
          `/live-classes/token?channel=${channelName}`
        );
        setAppId(res.data.appId);
        setToken(res.data.token);
        setLocalUid(res.data.uid);
        setUserName(res.data.userName || "Teacher");
        setClassId(res.data.classId);
        setScreenShareToken(res.data.screenShareToken || "");
        setScreenShareUid(res.data.screenShareUid || 0);
      } catch (err) {
        toast.error("Failed to get token");
        navigate("/dashboard/live-classes");
      } finally {
        setLoadingToken(false);
      }
    };
    fetchToken();

    return () => {
      leaveClass();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);

  // ─── Auto-scroll Chat ─────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ─── Reset Unread When Chat Opens ─────────────────────────────────
  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);
    
  // ─── Broadcast a data stream message ──────────────────────────────
  const broadcastDataMessage = useCallback(
    async (message: DataStreamMessage) => {
      try {
        const agoraClient = client.current as any; // bypass TS type checking

        if (dataStreamId.current === null) {
          dataStreamId.current = await agoraClient.createDataStream({
            ordered: true,
            reliable: true,
          });
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(message));
        await agoraClient.sendStreamMessage(dataStreamId.current, data);
      } catch (err) {
        console.warn("Failed to broadcast data message:", err);
        dataStreamId.current = null;
      }
    },
    [],
  );
  // ─── Join Class ────────────────────────────────────────────────────
  const joinClass = async () => {
    if (!appId || !token || !channelName || joined) return;

    try {
      // Join the main RTC channel
      await client.current.join(appId, channelName, token, localUid);

      // Create and publish local tracks
      const [microphoneTrack, cameraTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks();
      localAudioTrack.current = microphoneTrack;
      localVideoTrack.current = cameraTrack;

      // Play local video
      if (localVideoRef.current) {
        cameraTrack.play(localVideoRef.current);
      }

      await client.current.publish([microphoneTrack, cameraTrack]);
      setJoined(true);
      setSessionStartTime(Date.now());

      // Update class status to "live"
      if (classId) {
        try {
          await axiosInstance.patch(`/live-classes/${classId}/status`, {
            status: "live",
          });
        } catch (e) {
          console.warn("Could not update class status:", e);
        }
      }

      // ─── Event Handlers ──────────────────────────────────────────
      client.current.on("user-published", async (user, mediaType) => {
        await client.current.subscribe(user, mediaType);
        const uid = user.uid;

        // Check if this is a screen share stream
        if (typeof uid === "number" && uid >= SCREEN_SHARE_UID_OFFSET) {
          if (mediaType === "video" && user.videoTrack) {
            setRemoteScreenShareUid(uid);
            toast("Someone started screen sharing", { icon: "🖥️" });
            setTimeout(() => {
              if (screenShareRef.current) {
                (user.videoTrack as IRemoteVideoTrack).play(screenShareRef.current);
              }
            }, 100);
          }
          return;
        }

        // Regular user video/audio
        if (mediaType === "video") {
          setRemoteUsers((prev) => {
            const existing = prev.find((u) => u.uid === uid);
            if (existing) {
              return prev.map((u) => (u.uid === uid ? { ...u, hasVideo: true, videoMuted: false } : u));
            }
            return [
              ...prev,
              { uid, name: `User ${uid}`, role: "student", audioMuted: false, videoMuted: false, hasVideo: true, hasAudio: false, handRaised: false },
            ];
          });
          // Play remote video in its tile
          setTimeout(() => {
            const container = document.getElementById(`remote-video-${uid}`);
            if (container && user.videoTrack) {
              (user.videoTrack as IRemoteVideoTrack).play(container);
            }
          }, 200);
        }

        if (mediaType === "audio") {
          (user.audioTrack as IRemoteAudioTrack)?.play();
          setRemoteUsers((prev) => {
            const existing = prev.find((u) => u.uid === uid);
            if (existing) {
              return prev.map((u) => (u.uid === uid ? { ...u, hasAudio: true, audioMuted: false } : u));
            }
            return [
              ...prev,
              { uid, name: `User ${uid}`, role: "student", audioMuted: false, videoMuted: false, hasVideo: false, hasAudio: true, handRaised: false },
            ];
          });
        }
      });

      client.current.on("user-unpublished", (user, mediaType) => {
        const uid = user.uid;
        if (typeof uid === "number" && uid >= SCREEN_SHARE_UID_OFFSET) {
          setRemoteScreenShareUid(null);
          return;
        }
        if (mediaType === "video") {
          setRemoteUsers((prev) =>
            prev.map((u) => (u.uid === uid ? { ...u, hasVideo: false, videoMuted: true } : u))
          );
        }
        if (mediaType === "audio") {
          setRemoteUsers((prev) =>
            prev.map((u) => (u.uid === uid ? { ...u, hasAudio: false, audioMuted: true } : u))
          );
        }
      });

      client.current.on("user-left", (user) => {
        const uid = user.uid;
        if (typeof uid === "number" && uid >= SCREEN_SHARE_UID_OFFSET) {
          setRemoteScreenShareUid(null);
          return;
        }
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== uid));
        toast(`Participant left`, { icon: "👋" });
      });

      client.current.on("user-joined", (user) => {
        const uid = user.uid;
        if (typeof uid === "number" && uid >= SCREEN_SHARE_UID_OFFSET) return;
        toast(`New participant joined`, { icon: "🎉" });
      });

      // Listen for data stream messages (chat + hand raise signals)
      client.current.on("stream-message", (_uid, data) => {
        try {
          const decoder = new TextDecoder();
          const message: DataStreamMessage = JSON.parse(decoder.decode(data));

          if (message.type === "chat") {
            const chatMsg = message.payload as ChatMessage;
            setChatMessages((prev) => [...prev, chatMsg]);
            if (!chatOpenRef.current) {
              setUnreadCount((c) => c + 1);
              toast(`💬 ${chatMsg.sender}: ${chatMsg.text.substring(0, 50)}`, {
                duration: 3000,
              });
            }
          } else if (message.type === "hand-raise") {
            const { uid: raiserUid, name: raiserName } = message.payload;
            setRemoteUsers((prev) =>
              prev.map((u) =>
                u.uid === raiserUid ? { ...u, handRaised: true, name: raiserName || u.name } : u
              )
            );
            toast(`✋ ${raiserName || `User ${raiserUid}`} raised their hand`, {
              duration: 5000,
            });
          } else if (message.type === "hand-lower") {
            const { uid: lowerUid } = message.payload;
            setRemoteUsers((prev) =>
              prev.map((u) =>
                u.uid === lowerUid ? { ...u, handRaised: false } : u
              )
            );
          }
        } catch (err) {
          console.warn("Failed to parse data stream message:", err);
        }
      });

      // Active speaker detection
      client.current.enableAudioVolumeIndicator();
      client.current.on("volume-indicator", (volumes) => {
        const loudest = volumes.reduce(
          (max, v) => (v.level > max.level ? v : max),
          { uid: 0 as UID, level: 0 }
        );
        if (loudest.level > 5) {
          setActiveSpeaker(loudest.uid);
        }
      });

      // Token renewal every 50 minutes
      tokenRenewalInterval.current = setInterval(async () => {
        try {
          const res = await axiosInstance.get(
            `/live-classes/token?channel=${channelName}`
          );
          await client.current.renewToken(res.data.token);
          // Also update screen share token for next use
          if (res.data.screenShareToken) {
            setScreenShareToken(res.data.screenShareToken);
          }
        } catch (err) {
          console.error("Failed to renew token:", err);
        }
      }, 50 * 60 * 1000);
    } catch (err) {
      console.error("Agora join error:", err);
      toast.error("Failed to join class. Please check your camera/mic permissions.");
    }
  };

  // ─── Leave Class ───────────────────────────────────────────────────
  const leaveClass = async () => {
    // Stop recording if active
    if (isRecording) {
      await stopRecording();
    }

    // Stop screen sharing if active
    if (isScreenSharing) {
      await stopScreenShare();
    }

    // Clean up token renewal
    if (tokenRenewalInterval.current) {
      clearInterval(tokenRenewalInterval.current);
      tokenRenewalInterval.current = null;
    }

    // Clean up session timer
    if (sessionTimerInterval.current) {
      clearInterval(sessionTimerInterval.current);
      sessionTimerInterval.current = null;
    }

    // Remove all event listeners
    client.current.removeAllListeners();

    // Clean up local tracks
    localAudioTrack.current?.stop();
    localAudioTrack.current?.close();
    localAudioTrack.current = null;

    localVideoTrack.current?.stop();
    localVideoTrack.current?.close();
    localVideoTrack.current = null;

    try {
      await client.current.leave();
    } catch (e) {
      // ignore
    }

    // Update class status to "ended"
    if (classId && joined) {
      try {
        await axiosInstance.patch(`/live-classes/${classId}/status`, {
          status: "ended",
        });
      } catch (e) {
        console.warn("Could not update class status:", e);
      }
    }

    // Reset data stream ID
    dataStreamId.current = null;

    setJoined(false);
    setRemoteUsers([]);
    setRemoteScreenShareUid(null);
    setSessionStartTime(null);
    setElapsedTime("00:00:00");
  };

  // ─── Toggle Audio ──────────────────────────────────────────────────
  const toggleAudio = async () => {
    if (localAudioTrack.current) {
      await localAudioTrack.current.setEnabled(audioMuted);
      setAudioMuted(!audioMuted);
    }
  };

  // ─── Toggle Video ──────────────────────────────────────────────────
  const toggleVideo = async () => {
    if (localVideoTrack.current) {
      await localVideoTrack.current.setEnabled(videoMuted);
      setVideoMuted(!videoMuted);
    }
  };

  // ─── Start Screen Share ────────────────────────────────────────────
  /**
   * Screen sharing uses a SEPARATE Agora client + dedicated token.
   * The backend provides screenShareToken and screenShareUid specifically
   * for this purpose, ensuring proper authentication.
   */
  const startScreenShare = async () => {
    if (isScreenSharing || remoteScreenShareUid) {
      toast.error("Someone is already sharing their screen");
      return;
    }

    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack(
        { encoderConfig: "1080p_1" },
        "disable"
      );

      // Handle array return (video + audio) or single track
      const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
      screenVideoTrack.current = videoTrack;

      // Join with screen share client using the dedicated screen share token + UID
      await screenClient.current.join(appId, channelName!, screenShareToken, screenShareUid);
      await screenClient.current.publish([videoTrack]);

      setIsScreenSharing(true);

      // Show screen share locally
      if (screenShareRef.current) {
        videoTrack.play(screenShareRef.current);
      }

      // Notify others via data stream
      broadcastDataMessage({
        type: "screen-share-notify",
        payload: { userName, action: "started" },
      });

      // Handle user stopping screen share via browser UI
      videoTrack.on("track-ended", () => {
        stopScreenShare();
      });

      toast.success("Screen sharing started");
    } catch (err: any) {
      if (err.message?.includes("Permission denied") || err.code === "PERMISSION_DENIED") {
        // User cancelled the browser permission dialog
        return;
      }
      console.error("Screen share error:", err);
      toast.error("Failed to start screen sharing");
    }
  };

  // ─── Stop Screen Share ─────────────────────────────────────────────
  const stopScreenShare = async () => {
    screenVideoTrack.current?.stop();
    screenVideoTrack.current?.close();
    screenVideoTrack.current = null;

    try {
      await screenClient.current.leave();
    } catch (e) {
      // ignore
    }

    setIsScreenSharing(false);

    // Notify others
    broadcastDataMessage({
      type: "screen-share-notify",
      payload: { userName, action: "stopped" },
    });
  };

  // ─── Start Recording ──────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const res = await axiosInstance.post("/live-classes/recording/start", {
        channel: channelName,
        classId,
      });
      setRecordingResourceId(res.data.resourceId);
      setRecordingSid(res.data.sid);
      setIsRecording(true);
      toast.success("Recording started");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to start recording";
      toast.error(msg);
    }
  };

  // ─── Stop Recording ───────────────────────────────────────────────
  const stopRecording = async () => {
    try {
      await axiosInstance.post("/live-classes/recording/stop", {
        channel: channelName,
        classId,
        resourceId: recordingResourceId,
        sid: recordingSid,
      });
      setIsRecording(false);
      setRecordingResourceId(null);
      setRecordingSid(null);
      toast.success("Recording stopped and saved");
    } catch (err) {
      console.error("Stop recording error:", err);
      toast.error("Failed to stop recording");
    }
  };

  // ─── Send Chat Message ────────────────────────────────────────────
  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;

    const chatMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: userName,
      role: "teacher",
      text,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, chatMsg]);
    setChatInput("");

    // Broadcast via data stream
    await broadcastDataMessage({ type: "chat", payload: chatMsg });
  };

  // ─── Dismiss Hand Raise ────────────────────────────────────────────
  const dismissHandRaise = (uid: UID) => {
    setRemoteUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, handRaised: false } : u))
    );
  };

  // ─── Compute Grid Class ───────────────────────────────────────────
  const totalParticipants = remoteUsers.filter(
    (u) => typeof u.uid === "number" && u.uid < SCREEN_SHARE_UID_OFFSET
  ).length + 1; // +1 for local
  const gridClass = `grid-${Math.min(totalParticipants, 10)}`;
  const hasScreenShare = isScreenSharing || remoteScreenShareUid !== null;
  const handRaisedCount = remoteUsers.filter((u) => u.handRaised).length;

  // ─── Loading State ────────────────────────────────────────────────
  if (loadingToken) {
    return (
      <div className="lcr-loading">
        <div className="lcr-spinner" />
        <span>Preparing your classroom...</span>
      </div>
    );
  }

  // ─── Pre-Join Screen ──────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="lcr-room">
        <div className="lcr-prejoin">
          <div className="lcr-prejoin-card">
            <h2>🎓 Ready to Teach?</h2>
            <p>Channel: {channelName}</p>
            <div className="lcr-prejoin-preview" ref={localVideoRef} />
            <button
              className="lcr-join-btn"
              onClick={joinClass}
              disabled={!appId || !token}
            >
              Start Streaming
            </button>
            <button
              className="lcr-back-btn"
              onClick={() => navigate("/dashboard/live-classes")}
            >
              ← Back to Sessions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Room UI ─────────────────────────────────────────────────
  return (
    <div className="lcr-room">
      {/* ─── Top Bar ─────────────────────────────────────────────── */}
      <div className="lcr-topbar">
        <div className="lcr-topbar-left">
          <span className="lcr-topbar-title">{channelName}</span>
          <span className="lcr-topbar-badge lcr-badge-live">● Live</span>
          <span className="lcr-topbar-badge lcr-badge-teacher">Teacher</span>
        </div>

        <div className="lcr-topbar-center">
          <div className="lcr-session-timer">⏱️ {elapsedTime}</div>
          {isRecording && (
            <div className="lcr-recording-indicator">
              <div className="lcr-recording-dot" />
              REC
            </div>
          )}
        </div>

        <div className="lcr-topbar-right">
          {handRaisedCount > 0 && (
            <div className="lcr-hand-raise-badge">
              ✋ {handRaisedCount}
            </div>
          )}
          <div
            className="lcr-participants-count"
            onClick={() => setParticipantsOpen(!participantsOpen)}
          >
            👥 {totalParticipants}
          </div>
        </div>
      </div>

      {/* ─── Content Area ────────────────────────────────────────── */}
      <div className="lcr-content">
        <div className="lcr-video-area">
          {/* Screen Share Display */}
          {hasScreenShare && (
            <div className="lcr-screen-share-container">
              <div className="lcr-screen-share-label">
                🖥️ {isScreenSharing ? "You are sharing" : "Screen Share"}
              </div>
              <div ref={screenShareRef} style={{ width: "100%", height: "100%" }} />
            </div>
          )}

          {/* Video Grid */}
          <div className={`lcr-video-grid ${gridClass} ${hasScreenShare ? "with-screen-share" : ""}`}>
            {/* Local Video Tile */}
            <div
              className={`lcr-video-tile is-local ${activeSpeaker === localUid ? "active-speaker" : ""}`}
            >
              {videoMuted ? (
                <div className="lcr-video-avatar">
                  <div className="lcr-video-avatar-circle">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div
                  ref={localVideoRef}
                  style={{ width: "100%", height: "100%" }}
                />
              )}
              <div className="lcr-video-tile-info">
                <span className="lcr-video-tile-name">
                  {userName} (You)
                </span>
                <div className="lcr-video-tile-indicators">
                  {audioMuted && <span className="lcr-indicator muted">🔇</span>}
                </div>
              </div>
            </div>

            {/* Remote Video Tiles */}
            {remoteUsers
              .filter((u) => typeof u.uid === "number" && u.uid < SCREEN_SHARE_UID_OFFSET)
              .map((user) => (
                <div
                  key={user.uid}
                  className={`lcr-video-tile ${activeSpeaker === user.uid ? "active-speaker" : ""} ${user.handRaised ? "hand-raised" : ""}`}
                >
                  {!user.hasVideo ? (
                    <div className="lcr-video-avatar">
                      <div className="lcr-video-avatar-circle">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <div
                      id={`remote-video-${user.uid}`}
                      style={{ width: "100%", height: "100%" }}
                    />
                  )}
                  <div className="lcr-video-tile-info">
                    <span className="lcr-video-tile-name">
                      {user.handRaised && "✋ "}{user.name}
                    </span>
                    <div className="lcr-video-tile-indicators">
                      {user.audioMuted && <span className="lcr-indicator muted">🔇</span>}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ─── Chat Sidebar ────────────────────────────────────────── */}
        <div className={`lcr-chat-sidebar ${chatOpen ? "" : "hidden"}`}>
          <div className="lcr-chat-header">
            <h3>💬 Chat</h3>
            <button className="lcr-chat-close" onClick={() => setChatOpen(false)}>
              ✕
            </button>
          </div>
          <div className="lcr-chat-messages">
            {chatMessages.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--lcr-text-muted)", padding: "40px 0", fontSize: "0.85rem" }}>
                No messages yet. Start the conversation!
              </div>
            )}
            {chatMessages.map((msg) => (
              <div key={msg.id} className="lcr-chat-msg">
                <div className="lcr-chat-msg-header">
                  <span className="lcr-chat-msg-sender">{msg.sender}</span>
                  <span className={`lcr-chat-msg-role ${msg.role}`}>{msg.role}</span>
                  <span className="lcr-chat-msg-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="lcr-chat-msg-text">{msg.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="lcr-chat-input-area">
            <input
              className="lcr-chat-input"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
            />
            <button
              className="lcr-chat-send"
              onClick={sendChatMessage}
              disabled={!chatInput.trim()}
            >
              ➤
            </button>
          </div>
        </div>

        {/* ─── Participants Panel ──────────────────────────────────── */}
        <div className={`lcr-participants-panel ${participantsOpen ? "" : "hidden"}`}>
          <div className="lcr-chat-header">
            <h3>👥 Participants ({totalParticipants})</h3>
            <button className="lcr-chat-close" onClick={() => setParticipantsOpen(false)}>
              ✕
            </button>
          </div>
          <div className="lcr-participants-list">
            {/* Local user */}
            <div className="lcr-participant-item">
              <div className="lcr-participant-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="lcr-participant-info">
                <div className="lcr-participant-name">{userName} (You)</div>
                <div className="lcr-participant-role">Teacher</div>
              </div>
              <div className="lcr-participant-status">
                {audioMuted && <span className="lcr-indicator muted">🔇</span>}
                {videoMuted && <span className="lcr-indicator muted">📷</span>}
              </div>
            </div>
            {/* Remote users */}
            {remoteUsers
              .filter((u) => typeof u.uid === "number" && u.uid < SCREEN_SHARE_UID_OFFSET)
              .map((user) => (
                <div key={user.uid} className="lcr-participant-item">
                  <div className="lcr-participant-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="lcr-participant-info">
                    <div className="lcr-participant-name">{user.name}</div>
                    <div className="lcr-participant-role">{user.role}</div>
                  </div>
                  <div className="lcr-participant-status">
                    {user.handRaised && (
                      <button
                        className="lcr-hand-raise-dismiss"
                        onClick={() => dismissHandRaise(user.uid)}
                        title="Dismiss hand raise"
                      >
                        ✋
                      </button>
                    )}
                    {user.audioMuted && <span className="lcr-indicator muted">🔇</span>}
                    {user.videoMuted && <span className="lcr-indicator muted">📷</span>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ─── Control Bar ───────────────────────────────────────────── */}
      <div className="lcr-controls">
        {/* Mic */}
        <button
          className={`lcr-ctrl-btn ${audioMuted ? "muted-btn" : ""}`}
          onClick={toggleAudio}
        >
          {audioMuted ? "🔇" : "🎤"}
          <span className="lcr-btn-tooltip">{audioMuted ? "Unmute" : "Mute"}</span>
        </button>

        {/* Camera */}
        <button
          className={`lcr-ctrl-btn ${videoMuted ? "muted-btn" : ""}`}
          onClick={toggleVideo}
        >
          {videoMuted ? "📷" : "🎥"}
          <span className="lcr-btn-tooltip">{videoMuted ? "Start Video" : "Stop Video"}</span>
        </button>

        <div className="lcr-ctrl-divider" />

        {/* Screen Share */}
        <button
          className={`lcr-ctrl-btn ${isScreenSharing ? "active" : ""}`}
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
        >
          🖥️
          <span className="lcr-btn-tooltip">
            {isScreenSharing ? "Stop Sharing" : "Share Screen"}
          </span>
        </button>

        {/* Record (Teacher only) */}
        <button
          className={`lcr-ctrl-btn ${isRecording ? "recording" : ""}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          🔴
          <span className="lcr-btn-tooltip">
            {isRecording ? "Stop Recording" : "Start Recording"}
          </span>
        </button>

        <div className="lcr-ctrl-divider" />

        {/* Chat */}
        <button
          className={`lcr-ctrl-btn ${chatOpen ? "active" : ""}`}
          onClick={() => setChatOpen(!chatOpen)}
          style={{ position: "relative" }}
        >
          💬
          {unreadCount > 0 && (
            <span className="lcr-unread-badge">
              {unreadCount}
            </span>
          )}
          <span className="lcr-btn-tooltip">Chat</span>
        </button>

        <div className="lcr-ctrl-divider" />

        {/* Leave */}
        <button
          className="lcr-ctrl-btn danger"
          onClick={() => {
            leaveClass();
            navigate("/dashboard/live-classes");
          }}
        >
          📞
          <span className="lcr-btn-tooltip">End Session</span>
        </button>
      </div>
    </div>
  );
};

export default AgoraClass;
