import React, { useState, useEffect, useRef } from 'react';
import { TourBooking, ChatMessage, User } from '../types';

interface TourVideoCallRoomProps {
  booking: TourBooking;
  currentUser?: User | null;
  currentUserRole: 'traveler' | 'guide';
  language: 'vi' | 'en';
  onEndCall: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isFloating?: boolean;
  onToggleFloating?: () => void;
}

export const TourVideoCallRoom: React.FC<TourVideoCallRoomProps> = ({
  booking,
  currentUser,
  currentUserRole,
  language,
  onEndCall,
  messages,
  onSendMessage,
  isFloating = false,
  onToggleFloating
}) => {
  // Call Controls State
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInviteCopied, setShowInviteCopied] = useState(false);
  const [activeLayout, setActiveLayout] = useState<'split' | 'spotlight'>('split');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [inCallChatInput, setInCallChatInput] = useState('');

  // Audio level simulation for visualizer
  const [localAudioLevel, setLocalAudioLevel] = useState<number>(40);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState<number>(65);

  // Live Subtitles simulation
  const [currentCaption, setCurrentCaption] = useState<{
    speaker: string;
    text: string;
    translation?: string;
  } | null>({
    speaker: currentUserRole === 'traveler' ? booking.guideName : booking.travelerName,
    text: language === 'vi' ? 'Xin chào! Mình đã sẵn sàng cho chuyến đi hôm nay rồi.' : 'Hello! I am all ready for our tour today.',
    translation: language === 'vi' ? 'Hello! I am ready for our tour today.' : 'Xin chào! Tôi đã sẵn sàng cho chuyến đi hôm nay.'
  });

  // Media Stream references
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Devices state
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const counterpartyName = currentUserRole === 'traveler' ? booking.guideName : booking.travelerName;
  const counterpartyAvatar = currentUserRole === 'traveler' ? booking.guideAvatar : booking.travelerAvatar;
  const myName = currentUser?.name || (currentUserRole === 'guide' ? booking.guideName : booking.travelerName);
  const myAvatar = currentUser?.avatar || (currentUserRole === 'guide' ? booking.guideAvatar : booking.travelerAvatar);

  const meetingCode = `meet.tourguidehub.com/tgh-${booking.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase()}`;

  // Call timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Initialize Real Camera / Mic or fall back to virtual feed
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: true
          });

          if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }

          localStreamRef.current = stream;
          setHasCameraPermission(true);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }

          // Enumerate devices
          const devices = await navigator.mediaDevices.enumerateDevices();
          if (isMounted) {
            setCameras(devices.filter(d => d.kind === 'videoinput'));
            setMicrophones(devices.filter(d => d.kind === 'audioinput'));
          }
        } else {
          setHasCameraPermission(false);
        }
      } catch (err) {
        console.log('Camera permission was not granted or not supported in environment, using simulated video feed:', err);
        if (isMounted) setHasCameraPermission(false);
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Simulated live audio wave levels and captions rotation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMicMuted) {
        setLocalAudioLevel(Math.floor(20 + Math.random() * 60));
      } else {
        setLocalAudioLevel(0);
      }
      setRemoteAudioLevel(Math.floor(30 + Math.random() * 50));
    }, 400);

    const captionInterval = setInterval(() => {
      const phrases = currentUserRole === 'traveler' ? [
        { text: 'I am wearing a white Tour Guide Hub shirt and waiting near the entrance.', translation: 'Tôi đang mặc áo Tour Guide Hub trắng và đứng đợi gần cổng.' },
        { text: 'We have bottled cold water ready and the weather is great today!', translation: 'Chúng tôi đã chuẩn bị sẵn nước suối mát và thời tiết hôm nay rất đẹp!' },
        { text: 'Are you near the hotel lobby or the main street?', translation: 'Bạn đang ở gần sảnh khách sạn hay phía mặt đường chính?' },
        { text: 'Take your time, no rush! See you in 5 minutes.', translation: 'Bạn cứ từ từ nhé! Hẹn gặp bạn sau 5 phút nữa.' }
      ] : [
        { text: 'Hi! We just stepped into the lobby, heading to the entrance now.', translation: 'Chào bạn! Chúng tôi vừa xuống sảnh và đang đi ra cửa.' },
        { text: 'Thanks for calling! Should we bring sunscreen and hats?', translation: 'Cảm ơn đã gọi! Chúng tôi có cần mang kem chống nắng và mũ không?' },
        { text: 'Sounds perfect! Looking forward to the tour with you.', translation: 'Tuyệt vời! Rất mong chờ chuyến đi cùng bạn.' }
      ];

      const chosen = phrases[Math.floor(Math.random() * phrases.length)];
      setCurrentCaption({
        speaker: counterpartyName,
        text: chosen.text,
        translation: chosen.translation
      });
    }, 9000);

    return () => {
      clearInterval(interval);
      clearInterval(captionInterval);
    };
  }, [isMicMuted, currentUserRole, counterpartyName]);

  // Toggle Mic
  const toggleMic = () => {
    setIsMicMuted(prev => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => {
          t.enabled = !next;
        });
      }
      return next;
    });
  };

  // Toggle Video
  const toggleVideo = () => {
    setIsVideoOff(prev => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => {
          t.enabled = !next;
        });
      }
      return next;
    });
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = screenStream;
          setIsScreenSharing(true);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
            localVideoRef.current.play().catch(() => {});
          }

          screenStream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            if (localVideoRef.current && localStreamRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
              localVideoRef.current.play().catch(() => {});
            }
          };
        } else {
          setIsScreenSharing(true);
        }
      } catch (err) {
        console.log('Screen sharing cancelled or not supported:', err);
      }
    }
  };

  const copyMeetingLink = () => {
    navigator.clipboard?.writeText(meetingCode);
    setShowInviteCopied(true);
    setTimeout(() => setShowInviteCopied(false), 2500);
  };

  const handleInCallSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inCallChatInput.trim()) return;
    onSendMessage(inCallChatInput.trim());
    setInCallChatInput('');
  };

  // If floating minimized mode
  if (isFloating) {
    return (
      <div className="fixed bottom-6 right-4 sm:right-6 z-[80] w-72 max-w-[calc(100vw-2rem)] bg-slate-900 text-white rounded-3xl shadow-2xl border-2 border-teal-500 overflow-hidden flex flex-col animate-scale-up">
        <div className="p-3 bg-slate-950 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black truncate max-w-[140px]">{counterpartyName}</span>
            <span className="text-[10px] font-mono text-teal-400 font-bold">{formatTime(callDuration)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onToggleFloating}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={language === 'vi' ? "Mở rộng cuộc gọi" : "Expand Call"}
            >
              <span className="material-symbols-outlined text-base">open_in_full</span>
            </button>
            <button
              onClick={onEndCall}
              className="p-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              title={language === 'vi' ? "Kết thúc cuộc gọi" : "End Call"}
            >
              <span className="material-symbols-outlined text-base">call_end</span>
            </button>
          </div>
        </div>

        {/* Mini Video Feed */}
        <div className="h-40 bg-slate-800 relative flex items-center justify-center overflow-hidden">
          <img
            src={counterpartyAvatar}
            alt={counterpartyName}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-bold text-white drop-shadow">{counterpartyName}</span>
              <div className="flex items-center space-x-1">
                <span className="material-symbols-outlined text-sm text-emerald-400">mic</span>
                <span className="text-[9px] bg-teal-900/80 text-teal-200 px-1.5 py-0.5 rounded font-bold">HD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick controls bar */}
        <div className="p-2 bg-slate-950 flex items-center justify-center space-x-3">
          <button
            onClick={toggleMic}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all ${
              isMicMuted ? 'bg-rose-600' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{isMicMuted ? 'mic_off' : 'mic'}</span>
          </button>
          <button
            onClick={toggleVideo}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all ${
              isVideoOff ? 'bg-rose-600' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
          </button>
          <button
            onClick={onToggleFloating}
            className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-full text-[11px] font-bold"
          >
            {language === 'vi' ? 'Phóng to' : 'Maximize'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[480px] bg-[#202124] text-white flex flex-col rounded-2xl overflow-hidden relative select-none animate-fade-in">
      
      {/* 1. TOP GOOGLE MEET HEADER BAR */}
      <div className="px-4 py-3 bg-[#171717] border-b border-white/10 flex items-center justify-between shrink-0">
        
        {/* Left: Meeting Info & Escrow Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined text-lg">video_camera_front</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-extrabold text-sm text-white tracking-wide flex items-center space-x-1.5">
                <span>{language === 'vi' ? 'Google Meet Cuộc Gọi Trực Tiếp' : 'Live Meet Video Room'}</span>
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LIVE HD</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-sm">
              {booking.tourTitle} • <span className="font-mono text-teal-400">{formatTime(callDuration)}</span>
            </p>
          </div>
        </div>

        {/* Right: Meeting Code, Layout & Window Controls */}
        <div className="flex items-center space-x-2">
          {/* Copy Meeting Link Button */}
          <button
            type="button"
            onClick={copyMeetingLink}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-white/10"
            title={language === 'vi' ? "Sao chép liên kết Google Meet" : "Copy Google Meet Link"}
          >
            <span className="material-symbols-outlined text-sm">{showInviteCopied ? 'check' : 'content_copy'}</span>
            <span>
              {showInviteCopied 
                ? (language === 'vi' ? 'Đã sao chép!' : 'Link Copied!') 
                : (language === 'vi' ? 'Sao chép link' : 'Copy Meet Link')}
            </span>
          </button>

          {/* Layout Switcher */}
          <button
            type="button"
            onClick={() => setActiveLayout(prev => prev === 'split' ? 'spotlight' : 'split')}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
            title={activeLayout === 'split' ? (language === 'vi' ? 'Chuyển sang tiêu điểm' : 'Switch to Spotlight') : (language === 'vi' ? 'Chuyển sang chia đôi lưới' : 'Switch to Grid')}
          >
            <span className="material-symbols-outlined text-base">
              {activeLayout === 'split' ? 'grid_view' : 'crop_landscape'}
            </span>
          </button>

          {/* Minimize / Float */}
          {onToggleFloating && (
            <button
              type="button"
              onClick={onToggleFloating}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
              title={language === 'vi' ? "Thu nhỏ cửa sổ thu nhỏ" : "Minimize to Picture-in-Picture"}
            >
              <span className="material-symbols-outlined text-base">close_fullscreen</span>
            </button>
          )}

          {/* Settings button */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showSettings ? 'bg-teal-600 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
            title={language === 'vi' ? "Cài đặt âm thanh & hình ảnh" : "Audio & Video Settings"}
          >
            <span className="material-symbols-outlined text-base">settings</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CALL STAGE & IN-CALL SIDE DRAWER */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        
        {/* VIDEO GRID CANVAS */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center items-center gap-3 overflow-y-auto">
          
          <div className={`w-full h-full max-h-[520px] grid ${
            activeLayout === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
          } gap-3 sm:gap-4 items-center justify-center`}>
            
            {/* --- REMOTE PARTICIPANT TILE (Counterparty: Guide or Traveler) --- */}
            <div className="w-full h-full min-h-[220px] bg-[#3c4043] rounded-3xl overflow-hidden relative shadow-lg flex items-center justify-center border border-white/10 group transition-all">
              
              {/* Remote simulated or stream video */}
              <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 overflow-hidden">
                <img
                  src={counterpartyAvatar}
                  alt={counterpartyName}
                  className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-700"
                />

                {/* Audio pulse wave ring when speaking */}
                <div
                  className="absolute w-28 h-28 rounded-full border-4 border-teal-400 opacity-60 animate-ping pointer-events-none"
                  style={{ animationDuration: '2s' }}
                />

                {/* Top badges on video tile */}
                <div className="absolute top-3 left-3 flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center space-x-1.5 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{currentUserRole === 'traveler' ? (language === 'vi' ? 'Hướng Dẫn Viên' : 'Tour Guide') : (language === 'vi' ? 'Du Khách' : 'Traveler')}</span>
                  </span>
                  <span className="px-2 py-1 rounded-xl bg-teal-900/70 text-teal-200 text-[10px] font-mono font-extrabold border border-teal-500/30">
                    1080p 60fps
                  </span>
                </div>

                {/* Hand Raised indicator */}
                {isHandRaised && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-white px-2.5 py-1 rounded-2xl text-xs font-bold flex items-center space-x-1 shadow-lg animate-bounce">
                    <span className="text-sm">✋</span>
                    <span>{language === 'vi' ? 'Giơ tay phát biểu' : 'Hand Raised'}</span>
                  </div>
                )}

                {/* Bottom info pill */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="px-3 py-1.5 rounded-2xl bg-black/65 backdrop-blur-md text-white text-xs font-bold flex items-center space-x-2 border border-white/10">
                    <span>{counterpartyName}</span>
                    {/* Live audio level indicator dots */}
                    <div className="flex items-end space-x-0.5 h-3">
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ height: `${Math.max(4, remoteAudioLevel * 0.2)}px` }}></span>
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ height: `${Math.max(6, remoteAudioLevel * 0.3)}px`, animationDelay: '0.1s' }}></span>
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ height: `${Math.max(3, remoteAudioLevel * 0.15)}px`, animationDelay: '0.2s' }}></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="p-1.5 rounded-full bg-black/60 text-white text-xs">
                      <span className="material-symbols-outlined text-sm text-emerald-400">mic</span>
                    </span>
                    <span className="p-1.5 rounded-full bg-black/60 text-white text-xs">
                      <span className="material-symbols-outlined text-sm text-teal-400">signal_cellular_alt</span>
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* --- LOCAL PARTICIPANT TILE (Current User: Camera Stream / Screen Share) --- */}
            <div className="w-full h-full min-h-[220px] bg-[#3c4043] rounded-3xl overflow-hidden relative shadow-lg flex items-center justify-center border border-white/10 group transition-all">
              
              {/* Real or Simulated Video stream */}
              {!isVideoOff ? (
                <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
                  {hasCameraPermission ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-tr from-slate-900 via-teal-950 to-slate-900">
                      <img
                        src={myAvatar}
                        alt={myName}
                        className="w-24 h-24 rounded-full object-cover border-4 border-teal-500/50 shadow-2xl z-10"
                      />
                      <div className="absolute inset-0 bg-teal-500/5 blur-3xl rounded-full"></div>
                      <p className="text-xs text-slate-300 font-semibold mt-3 z-10">
                        {isScreenSharing 
                          ? (language === 'vi' ? '🖥️ Đang chia sẻ màn hình' : '🖥️ Presenting your screen') 
                          : (language === 'vi' ? 'Video HD Ảo Đang Hoạt Động' : 'Virtual HD Video Active')}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Video Off state */
                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center space-y-2">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-3xl">videocam_off</span>
                  </div>
                  <p className="text-xs text-slate-400 font-bold">{myName} ({language === 'vi' ? 'Tắt Camera' : 'Camera Off'})</p>
                </div>
              )}

              {/* Top status badges */}
              <div className="absolute top-3 left-3 flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center space-x-1 border border-white/10">
                  <span>
                    {language === 'vi' 
                      ? `Bạn (${currentUserRole === 'guide' ? 'HDV' : 'Du Khách'})` 
                      : `You (${currentUserRole === 'guide' ? 'Guide' : 'Traveler'})`}
                  </span>
                </span>
                {isScreenSharing && (
                  <span className="px-2 py-1 rounded-xl bg-teal-600 text-white text-[10px] font-extrabold flex items-center space-x-1 shadow">
                    <span className="material-symbols-outlined text-xs">present_to_all</span>
                    <span>{language === 'vi' ? 'Chia sẻ màn hình' : 'Screen Share'}</span>
                  </span>
                )}
              </div>

              {/* Local mute indicator */}
              <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                {isMicMuted ? (
                  <span className="p-1.5 rounded-full bg-rose-600 text-white text-xs shadow">
                    <span className="material-symbols-outlined text-sm">mic_off</span>
                  </span>
                ) : (
                  <span className="p-1.5 rounded-full bg-black/60 text-white text-xs">
                    <span className="material-symbols-outlined text-sm text-emerald-400">mic</span>
                  </span>
                )}
              </div>

              {/* Bottom name pill */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="px-3 py-1.5 rounded-2xl bg-black/65 backdrop-blur-md text-white text-xs font-bold flex items-center space-x-2 border border-white/10">
                  <span>{myName}</span>
                  {!isMicMuted && (
                    <div className="flex items-end space-x-0.5 h-3">
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ height: `${Math.max(3, localAudioLevel * 0.2)}px` }}></span>
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce" style={{ height: `${Math.max(5, localAudioLevel * 0.3)}px`, animationDelay: '0.1s' }}></span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* --- 3. LIVE CAPTIONS / TRANSLATION BAR (Google Meet Subtitles) --- */}
          {showCaptions && currentCaption && (
            <div className="w-full max-w-2xl bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center shadow-xl space-y-1 animate-fade-in">
              <div className="flex items-center justify-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-black uppercase tracking-wider">
                  {language === 'vi' ? 'Dịch Phụ Đề AI Trực Tiếp' : 'AI CC Translation'} • {currentCaption.speaker}
                </span>
              </div>
              <p className="text-sm font-semibold text-white leading-snug">
                "{currentCaption.text}"
              </p>
              {currentCaption.translation && (
                <p className="text-xs text-teal-300 font-medium italic">
                  ⇄ {currentCaption.translation}
                </p>
              )}
            </div>
          )}

        </div>

        {/* --- IN-CALL SIDE CHAT DRAWER --- */}
        {isChatOpen && (
          <div className="w-80 bg-[#1e1f20] border-l border-white/10 flex flex-col justify-between p-3.5 z-20 animate-fade-in shrink-0">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-teal-400 text-lg">chat</span>
                <h5 className="font-extrabold text-xs text-white uppercase tracking-wider">
                  {language === 'vi' ? 'Tin Nhắn Trong Cuộc Gọi' : 'In-Call Messages'}
                </h5>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 text-xs">
              {messages.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-1">
                  <span className="material-symbols-outlined text-2xl text-slate-500">forum</span>
                  <p className="font-bold">{language === 'vi' ? 'Chưa có tin nhắn trong cuộc gọi' : 'No in-call chats yet'}</p>
                  <p className="text-[11px]">{language === 'vi' ? 'Gửi ghi chú, địa chỉ đón hoặc thời gian đến' : 'Send a note, address, or ETA'}</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderRole === currentUserRole;
                  return (
                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`p-2.5 rounded-2xl max-w-[210px] text-xs ${
                          isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white/10 text-slate-100 rounded-bl-none'
                        }`}
                      >
                        <p className="font-bold text-[10px] opacity-75 mb-0.5">{m.senderName}</p>
                        <p className="leading-snug">{m.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 mt-0.5">{m.timestamp}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick in-call chips */}
            <div className="flex flex-wrap gap-1 pb-2 text-[10px]">
              <button
                type="button"
                onClick={() => onSendMessage(language === 'vi' ? "Bạn nghe rõ mình không? 🎧" : "Can you hear me clearly? 🎧")}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300"
              >
                {language === 'vi' ? '"Bạn nghe rõ không?"' : '"Can you hear me?"'}
              </button>
              <button
                type="button"
                onClick={() => onSendMessage(language === 'vi' ? "Mình đang trên đường đến điểm hẹn! 🛵" : "I am on my way to meeting point! 🛵")}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300"
              >
                {language === 'vi' ? '"Đang trên đường đến!"' : '"On my way!"'}
              </button>
            </div>

            {/* Input box */}
            <form onSubmit={handleInCallSend} className="flex items-center space-x-1.5 pt-2 border-t border-white/10">
              <input
                type="text"
                value={inCallChatInput}
                onChange={(e) => setInCallChatInput(e.target.value)}
                placeholder={language === 'vi' ? 'Nhắn tin cho mọi người...' : 'Send a message to everyone...'}
                className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white cursor-pointer transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </div>
        )}

        {/* --- SETTINGS MODAL / POPUP --- */}
        {showSettings && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#282a2d] border border-white/15 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-scale-up">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-teal-400">tune</span>
                  <h4 className="font-extrabold text-sm text-white">
                    {language === 'vi' ? 'Cài Đặt Cuộc Gọi & Thiết Bị' : 'Call & Device Settings'}
                  </h4>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Camera device selector */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <span className="material-symbols-outlined text-sm text-teal-400">videocam</span>
                  <span>{language === 'vi' ? 'Camera Thiết Bị:' : 'Camera Device:'}</span>
                </label>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="w-full bg-[#1e1f20] border border-white/15 rounded-xl p-2.5 text-white font-medium text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
                >
                  {cameras.length > 0 ? (
                    cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || (language === 'vi' ? 'Camera trước mặc định' : 'Default Front Camera')}</option>)
                  ) : (
                    <option value="">{language === 'vi' ? 'WebCam HD Mặc Định' : 'Default High-Definition WebCam'}</option>
                  )}
                </select>
              </div>

              {/* Microphone device selector */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <span className="material-symbols-outlined text-sm text-teal-400">mic</span>
                  <span>{language === 'vi' ? 'Microphone Thu Âm:' : 'Microphone:'}</span>
                </label>
                <select
                  value={selectedMicId}
                  onChange={(e) => setSelectedMicId(e.target.value)}
                  className="w-full bg-[#1e1f20] border border-white/15 rounded-xl p-2.5 text-white font-medium text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
                >
                  {microphones.length > 0 ? (
                    microphones.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label || (language === 'vi' ? 'Micro mặc định' : 'Default Microphone')}</option>)
                  ) : (
                    <option value="">{language === 'vi' ? 'Âm thanh Stereo Tích Hợp' : 'Default Built-in Stereo Audio'}</option>
                  )}
                </select>
              </div>

              {/* Video Resolution & AI features */}
              <div className="p-3 bg-white/5 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">{language === 'vi' ? 'Khử Ồn AI Thông Minh' : 'AI Noise Cancellation'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">{language === 'vi' ? 'Đang bật' : 'Active'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">{language === 'vi' ? 'Phụ Đề & Dịch Tự Động' : 'Live Subtitles & Translation'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold text-[10px]">EN ⇄ VI</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer shadow"
                >
                  {language === 'vi' ? 'Hoàn tất' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 4. GOOGLE MEET BOTTOM FLOATING CONTROL BAR */}
      <div className="px-4 py-3.5 bg-[#171717] border-t border-white/10 flex items-center justify-between shrink-0">
        
        {/* Left: Meeting ID pill */}
        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-300">
          <span className="font-mono font-bold text-slate-400">{booking.id}</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-bold flex items-center space-x-1">
            <span className="material-symbols-outlined text-xs">lock</span>
            <span>{language === 'vi' ? 'Bảo Vệ Ký Quỹ Escrow' : 'Escrow Protected'}</span>
          </span>
        </div>

        {/* Center: Core Action Circle Buttons (Google Meet Style) */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 mx-auto">
          
          {/* Mute Microphone */}
          <button
            type="button"
            onClick={toggleMic}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all transform active:scale-90 cursor-pointer shadow-md ${
              isMicMuted ? 'bg-rose-600 hover:bg-rose-500 ring-2 ring-rose-400/40' : 'bg-[#3c4043] hover:bg-[#4f5357]'
            }`}
            title={isMicMuted ? (language === 'vi' ? 'Bật micro' : 'Turn on microphone') : (language === 'vi' ? 'Tắt micro' : 'Turn off microphone')}
          >
            <span className="material-symbols-outlined text-xl">{isMicMuted ? 'mic_off' : 'mic'}</span>
          </button>

          {/* Toggle Video Camera */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all transform active:scale-90 cursor-pointer shadow-md ${
              isVideoOff ? 'bg-rose-600 hover:bg-rose-500 ring-2 ring-rose-400/40' : 'bg-[#3c4043] hover:bg-[#4f5357]'
            }`}
            title={isVideoOff ? (language === 'vi' ? 'Bật camera' : 'Turn on camera') : (language === 'vi' ? 'Tắt camera' : 'Turn off camera')}
          >
            <span className="material-symbols-outlined text-xl">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
          </button>

          {/* Toggle Subtitles / Captions */}
          <button
            type="button"
            onClick={() => setShowCaptions(!showCaptions)}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all transform active:scale-90 cursor-pointer ${
              showCaptions ? 'bg-teal-600 hover:bg-teal-500 ring-2 ring-teal-400/40' : 'bg-[#3c4043] hover:bg-[#4f5357]'
            }`}
            title={language === 'vi' ? "Bật/tắt phụ đề trực tiếp (CC)" : "Toggle Live Subtitles (CC)"}
          >
            <span className="material-symbols-outlined text-xl">closed_caption</span>
          </button>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all transform active:scale-90 cursor-pointer ${
              isHandRaised ? 'bg-amber-500 hover:bg-amber-400 ring-2 ring-amber-300' : 'bg-[#3c4043] hover:bg-[#4f5357]'
            }`}
            title={isHandRaised ? (language === 'vi' ? 'Hạ tay' : 'Lower hand') : (language === 'vi' ? 'Giơ tay' : 'Raise hand')}
          >
            <span className="material-symbols-outlined text-xl">front_hand</span>
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all transform active:scale-90 cursor-pointer ${
              isScreenSharing ? 'bg-teal-600 hover:bg-teal-500 ring-2 ring-teal-400/40' : 'bg-[#3c4043] hover:bg-[#4f5357]'
            }`}
            title={isScreenSharing ? (language === 'vi' ? 'Dừng chia sẻ màn hình' : 'Stop presenting') : (language === 'vi' ? 'Bắt đầu chia sẻ màn hình' : 'Present now / Screen share')}
          >
            <span className="material-symbols-outlined text-xl">present_to_all</span>
          </button>

          {/* RED END CALL BUTTON */}
          <button
            type="button"
            onClick={onEndCall}
            className="px-5 h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all transform active:scale-95 cursor-pointer shadow-lg flex items-center space-x-1.5 ring-2 ring-rose-500/40"
            title={language === 'vi' ? "Rời khỏi cuộc gọi" : "Leave Call"}
          >
            <span className="material-symbols-outlined text-xl">call_end</span>
            <span className="hidden sm:inline">{language === 'vi' ? 'Kết Thúc Cuộc Gọi' : 'End Call'}</span>
          </button>

        </div>

        {/* Right: In-Call Chat & Participants Drawer Toggle */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all cursor-pointer relative ${
              isChatOpen ? 'bg-teal-600' : 'bg-[#3c4043] hover:bg-[#4f5357]'
            }`}
            title={language === 'vi' ? "Tin nhắn trong cuộc gọi" : "In-call messages"}
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            {messages.length > 0 && !isChatOpen && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-teal-500 text-white text-[9px] font-black flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
