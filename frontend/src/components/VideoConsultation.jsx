
import React, { useState, useEffect, useRef } from 'react';
import {
  Video, VideoOff, Mic, MicOff, Phone, MessageSquare,
  Settings, Users, Monitor, X, Maximize, Minimize,
  ArrowLeft, Clock, User, AlertCircle
} from 'lucide-react';
import { APPOINTMENT_API, MEDICAL_API, apiCall } from '../config/api';

const VideoConsultation = ({ appointmentId, token, userRole, onEndCall, setCurrentView }) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [sessionToken, setSessionToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    initializeVideoSession();
    return () => {
      cleanup();
    };
  }, []);

  const initializeVideoSession = async () => {
    try {
      setLoading(true);

      // First, check if video session exists and is approved
      const checkResponse = await apiCall(
        `${APPOINTMENT_API}/appointments/${appointmentId}/video`
      );

      if (checkResponse.ok) {
        const sessionData = await checkResponse.json();
        if (!sessionData.doctor_approved) {
          throw new Error('Video session not yet approved by doctor');
        }
        setSessionToken(sessionData.token);
      } else if (checkResponse.status === 403) {
        const errorData = await checkResponse.json();
        throw new Error(errorData.error || 'Video session not yet approved by doctor');
      } else if (checkResponse.status === 400) {
        const errorData = await checkResponse.json();
        throw new Error(errorData.error || 'Video session is not available at this time');
      } else if (checkResponse.status === 404) {
        const createResponse = await apiCall(
          `${APPOINTMENT_API}/appointments/${appointmentId}/video/create`,
          {
            method: 'POST',
            body: JSON.stringify({ provider: 'twilio' })
          }
        );

        if (!createResponse.ok) {
          throw new Error('Failed to create video session');
        }

        const sessionData = await createResponse.json();
        setSessionToken(sessionData.token);
      } else {
        throw new Error('Failed to check video session');
      }

      // Initialize local media
      await initializeLocalMedia();

      // Connect to signaling and initialize WebRTC
      connectToSignalingServer(token);
      await initializeWebRTCConnection();

      setSessionStartTime(Date.now());
      setLoading(false);

    } catch (err) {
      console.error('Video session initialization error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const initializeLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera/microphone. Please check permissions.');
    }
  };

  // WebSocket Connection for Signaling
  const connectToSignalingServer = (authToken) => {
    // Safely Construct WebSocket URL
    let wsBase = MEDICAL_API;
    if (wsBase.startsWith('http')) {
      wsBase = wsBase.replace('http://', 'ws://').replace('https://', 'wss://');
    }
    const wsUrl = `${wsBase}/chat/ws/${appointmentId}?token=${authToken}`;
    console.log('Connecting to Signaling Server:', wsUrl);

    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Signaling WebSocket connected');
      // Wait briefly for connection stability then offer if we are the initiator
      // In a mesh without a dedicated signaling "join" event, we can try to offer.
      // Better strategy: Both peers attach handlers. The one who's 'polite' waits?
      // Simple strategy: Just offer if nothing happens after 2s, or relying on manual trigger?
      // Let's offer automatically.
      setTimeout(() => {
        if (window.peerConnection && window.peerConnection.signalingState === "stable") {
          // Check if we are "Patient" or "Doctor". Let's say Doctor initiates?
          // Or better, just random to avoid collision, or both try.
          // We'll just try.
          createAndSendOffer();
        }
      }, 1500);
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        // Filter out own messages (echoed by backend)
        if (data.status === 'sent') return;
        // Filter by sender role if possible, but basic check is good enough
        if (data.sender_role === userRole) return;

        if (data.type === 'offer') {
          await handleReceiveOffer(JSON.parse(data.message));
        } else if (data.type === 'answer') {
          await handleReceiveAnswer(JSON.parse(data.message));
        } else if (data.type === 'candidate') {
          await handleReceiveCandidate(JSON.parse(data.message));
        } else if (data.type === 'text') {
          // Handle chat messages
          const newMessage = {
            id: data.message_id || Date.now(),
            sender: data.sender_role === 'doctor' ? 'Doctor' : 'Patient',
            text: data.message,
            timestamp: new Date(data.timestamp).toLocaleTimeString()
          };
          setChatMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      } catch (err) {
        // Warning: many messages might be plain chat acknowledgements we can't parse as signaling
        // console.error('Signaling message error:', err);
      }
    };

    ws.onerror = (e) => console.error('Signaling WebSocket error:', e);
  };

  const sendSignal = (type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        message: JSON.stringify(payload),
        type: type,
        client_message_id: Date.now().toString()
      }));
    }
  };

  const createAndSendOffer = async () => {
    if (!window.peerConnection) return;
    try {
      const offer = await window.peerConnection.createOffer();
      await window.peerConnection.setLocalDescription(offer);
      sendSignal('offer', offer);
    } catch (e) {
      console.error("Error creating offer:", e);
    }
  };

  const handleReceiveOffer = async (offer) => {
    console.log('Received Offer');
    if (!window.peerConnection) await initializeWebRTCConnection();

    if (window.peerConnection.signalingState !== "stable") {
      await Promise.all([
        window.peerConnection.setLocalDescription({ type: "rollback" }),
        window.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      ]);
    } else {
      await window.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    }

    const answer = await window.peerConnection.createAnswer();
    await window.peerConnection.setLocalDescription(answer);
    sendSignal('answer', answer);
    setConnectionStatus('connected');
  };

  const handleReceiveAnswer = async (answer) => {
    console.log('Received Answer');
    if (window.peerConnection) {
      await window.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      setConnectionStatus('connected');
    }
  };

  const handleReceiveCandidate = async (candidate) => {
    console.log('Received Candidate');
    if (window.peerConnection) {
      await window.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  // WebRTC connection setup
  const initializeWebRTCConnection = async () => {
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      if (window.peerConnection) window.peerConnection.close();
      window.peerConnection = new RTCPeerConnection(configuration);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          window.peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      window.peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setConnectionStatus('connected');
        }
      };

      window.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('candidate', event.candidate);
        }
      };

    } catch (error) {
      console.error('Error initializing WebRTC connection:', error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        setIsVideoOn(videoTracks[0].enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsAudioOn(audioTracks[0].enabled);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      let screenStream;
      if (navigator.mediaDevices.getDisplayMedia) {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      } else {
        throw new Error('getDisplayMedia not supported');
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      // Replace the video track in the local stream
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);
        screenStream.getTracks().forEach(track => {
          localStreamRef.current.addTrack(track);
        });
      }

      setIsScreenSharing(true);
    } catch (err) {
      console.error('Error starting screen share:', err);
    }
  };

  const stopScreenShare = () => {
    if (localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      videoTrack.stop();
      initializeLocalMedia(); // Revert to camera
    }
    setIsScreenSharing(false);
  };

  const endCall = async () => {
    try {
      // Send API call to end video session
      await apiCall(
        `${APPOINTMENT_API}/appointments/${appointmentId}/video`,
        {
          method: 'PATCH',
          body: JSON.stringify({ ended: true })
        }
      );
    } catch (err) {
      console.error('Error ending video session:', err);
    } finally {
      onEndCall && onEndCall();
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Close WebRTC connection if it exists
    if (window.peerConnection) {
      window.peerConnection.close();
      window.peerConnection = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  useEffect(() => {
    let interval;
    if (sessionStartTime) {
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => interval && clearInterval(interval);
  }, [sessionStartTime]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sendMessage = () => {
    if (messageInput.trim()) {
      const newMessage = {
        message: messageInput.trim(), // Send as object wrapper if needed, but backend takes string in message field
        // Actually backend logic takes message field. 
        // We use sendSignal with type 'text'
      };

      sendSignal('text', messageInput.trim());

      setChatMessages([...chatMessages, {
        id: Date.now(),
        sender: 'Me', // UI placeholder
        text: messageInput.trim(),
        timestamp: new Date().toLocaleTimeString()
      }]);
      setMessageInput('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up video session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">Error</h3>
          </div>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => setCurrentView && setCurrentView('my-appointments')}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover">
            Your browser does not support video playback.
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-4 left-4 flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Local Video (Pip) */}
        <div className="absolute top-4 right-4 w-32 h-24 bg-black border-2 border-white rounded-lg overflow-hidden z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover">
            Your browser does not support video playback.
          </video>
          {isVideoOn && (
            <div className="absolute top-1 right-1 bg-green-500 rounded-full w-3 h-3"></div>
          )}
        </div>

        {/* Connection Status */}
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm">{connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center items-center space-x-6">
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOn ? 'bg-gray-700' : 'bg-red-600'}`}>
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${isAudioOn ? 'bg-gray-700' : 'bg-red-600'}`}>
            {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`p-3 rounded-full ${isScreenSharing ? 'bg-purple-600' : 'bg-gray-700'}`}>
            <Monitor className="w-6 h-6" />
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className="p-3 rounded-full bg-gray-700">
            <MessageSquare className="w-6 h-6" />
          </button>

          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-600">
            <Phone className="w-6 h-6 transform rotate-135" />
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="absolute top-0 right-0 h-full w-80 bg-gray-800 z-20 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold">Chat</h3>
            <button onClick={() => setShowChat(false)} className="p-1 rounded-full hover:bg-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {chatMessages.map((msg, index) => (
              <div key={index} className="mb-3">
                <div className="font-semibold text-sm">{msg.sender}</div>
                <div className="text-sm">{msg.text}</div>
                <div className="text-xs text-gray-400 mt-1">{msg.timestamp}</div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-700">
            <div className="flex">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && messageInput.trim() && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-l-lg focus:outline-none"
              />
              <button className="bg-purple-600 px-4 py-2 rounded-r-lg" onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoConsultation;
