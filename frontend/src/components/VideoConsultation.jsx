
import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Phone, MessageSquare, 
  Settings, Users, Monitor, X, Maximize, Minimize,
  ArrowLeft, Clock, User, AlertCircle
} from 'lucide-react';
import { APPOINTMENT_API, apiCall } from '../config/api';

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
  const chatEndRef = useRef(null);

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
        `${APPOINTMENT_API}/appointments/${appointmentId}/video` // Trailing slash will be added by apiCall if needed
      );
      
      if (checkResponse.ok) {
        // Video session exists, check approval status
        const sessionData = await checkResponse.json();
        
        // Check if doctor has approved the session
        if (!sessionData.doctor_approved) {
          throw new Error('Video session not yet approved by doctor');
        }
        
        // Session exists and is approved, use existing session
        setSessionToken(sessionData.token);
      } else if (checkResponse.status === 403) {
        // Doctor has not approved the session
        const errorData = await checkResponse.json();
        throw new Error(errorData.error || 'Video session not yet approved by doctor');
      } else if (checkResponse.status === 400) {
        // Bad request - likely time window validation failed
        const errorData = await checkResponse.json();
        throw new Error(errorData.error || 'Video session is not available at this time');
      } else if (checkResponse.status === 404) {
        // Video session doesn't exist, create it
        const createResponse = await apiCall(
          `${APPOINTMENT_API}/appointments/${appointmentId}/video/create`, // Trailing slash will be added by apiCall if needed
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
      
      // Connect to video service (Twilio/Agora)
      await connectToVideoService({});
      
      setConnectionStatus('connected');
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

  const connectToVideoService = async (sessionData) => {
    try {
      // Get the room name from the session data
      const checkResponse = await apiCall(
        `${APPOINTMENT_API}/appointments/${appointmentId}/video` // Trailing slash will be added by apiCall if needed
      );
      
      if (checkResponse.ok) {
        const sessionInfo = await checkResponse.json();
        const roomName = sessionInfo.room_name;
        
        // Initialize WebRTC connection
        await initializeWebRTCConnection(roomName);
      } else {
        console.error('Failed to get session info for WebRTC connection');
      }
    } catch (error) {
      console.error('Error connecting to video service:', error);
    }
  };

  // WebRTC connection setup
  const initializeWebRTCConnection = async (roomName) => {
    try {
      // Create RTCPeerConnection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      window.peerConnection = new RTCPeerConnection(configuration);
      
      // Add local stream to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          window.peerConnection.addTrack(track, localStreamRef.current);
        });
      }
      
      // Handle incoming remote tracks
      window.peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      // Handle ICE candidates
      window.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // In a real implementation, you would send the ICE candidate to the other participant
          // through a signaling server
          console.log('Sending ICE candidate:', event.candidate);
        }
      };
      
      // Create offer
      const offer = await window.peerConnection.createOffer();
      await window.peerConnection.setLocalDescription(offer);
      
      // In a real implementation, you would send the offer to the other participant
      // through a signaling server and receive their answer
      console.log('Created offer:', offer);
      
      // Simulate receiving the other participant's offer/answer
      // In a real implementation, this would come from a signaling server
      setTimeout(() => {
        simulateRemoteParticipant();
      }, 2000);
      
    } catch (error) {
      console.error('Error initializing WebRTC connection:', error);
    }
  };

  // Simulate the remote participant joining
  const simulateRemoteParticipant = async () => {
    try {
      // Create a dummy remote stream for simulation
      const dummyStream = new MediaStream();
      
      // In a real implementation, this would be the actual remote stream
      // For now, we'll just log that the remote participant is connected
      console.log('Remote participant connected');
      
      // Set connection status to connected
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error simulating remote participant:', error);
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
        `${APPOINTMENT_API}/appointments/${appointmentId}/video`, // Trailing slash will be added by apiCall if needed
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
        id: Date.now(),
        sender: userRole === 'doctor' ? 'Doctor' : 'Patient',
        text: messageInput,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages([...chatMessages, newMessage]);
      setMessageInput('');
      
      // In a real implementation, you would send this message via WebSocket
      // to the other participant
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
              <button className="bg-purple-600 px-4 py-2 rounded-r-lg">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoConsultation;
