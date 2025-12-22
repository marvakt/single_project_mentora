
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
      
      // Create video session
      const response = await apiCall(
        `${APPOINTMENT_API}/appointments/${appointmentId}/video/create/`,
        {
          method: 'POST',
          body: JSON.stringify({ provider: 'twilio' })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create video session');
      }

      const data = await response.json();
      setSessionToken(data.token);
      
      // Initialize local media
      await initializeLocalMedia();
      
      // Connect to video service (Twilio/Agora)
      await connectToVideoService(data);
      
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

  // ... (Rest of the component as provided in the artifact)
};

export default VideoConsultation;
