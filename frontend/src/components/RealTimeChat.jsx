// src/components/RealTimeChat.jsx - Real-time Doctor-Patient Chat Component
import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Heart, Loader } from 'lucide-react';
import { MEDICAL_API } from '../config/api';

const RealTimeChat = ({ 
  appointmentId, 
  user, 
  token, 
  setCurrentView,
  onBack 
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [websocket, setWebsocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (appointmentId && token) {
      connectToWebSocket();
      fetchChatHistory();
    }

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [appointmentId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const connectToWebSocket = () => {
    try {
      const wsUrl = `${MEDICAL_API.replace('http', 'ws').replace('/api/v1', '')}/api/v1/chat/ws/${appointmentId}?token=${token}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setWebsocket(ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          // Add message to chat
          const newMessage = {
            id: data.message_id,
            sender_id: data.sender_id,
            sender_role: data.sender_role,
            content: data.message,
            timestamp: data.timestamp,
            type: data.type || 'text'
          };
          
          setMessages(prev => [...prev, newMessage]);
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
    } catch (err) {
      console.error('Failed to connect to WebSocket:', err);
      setConnectionStatus('error');
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(
        `${MEDICAL_API}/chat/history/${appointmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.messages.map(msg => ({
          id: msg._id,
          sender_id: msg.sender_id,
          sender_role: msg.sender_role,
          content: msg.message,
          timestamp: msg.timestamp,
          type: msg.message_type || 'text'
        }));
        
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !websocket || websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const messageData = {
        message: inputMessage.trim(),
        type: 'text'
      };
      
      websocket.send(JSON.stringify(messageData));
      
      // Clear input and add to UI immediately
      setInputMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return '';
    }
  };

  const isCurrentUser = (senderId) => {
    return senderId === user?.user_id?.toString() || senderId === user?.id?.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={onBack || (() => setCurrentView('my-appointments'))}
            className="text-purple-600 hover:text-purple-800 font-semibold flex items-center"
          >
            ← Back to Appointment
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Appointment Chat</h2>
                  <p className="text-blue-100 text-sm">
                    {connectionStatus === 'connected' ? 'Connected' : 
                     connectionStatus === 'connecting' ? 'Connecting...' : 
                     'Disconnected'}
                  </p>
                </div>
              </div>
              <div className="text-sm">
                <p className="font-semibold">Appointment ID</p>
                <p className="text-blue-100 truncate max-w-xs">{appointmentId}</p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(100vh - 380px)' }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Heart className="w-12 h-12 mb-4" />
                  <p>No messages yet. Start a conversation with your doctor.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser(msg.sender_id) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${isCurrentUser(msg.sender_id) ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCurrentUser(msg.sender_id) 
                          ? 'bg-blue-600 text-white' 
                          : msg.sender_role === 'doctor' 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'bg-green-100 text-green-600'
                      }`}>
                        <UserIcon className="w-5 h-5" />
                      </div>
                      
                      <div>
                        <div className={`rounded-2xl p-4 ${
                          isCurrentUser(msg.sender_id)
                            ? 'bg-blue-600 text-white'
                            : msg.sender_role === 'doctor'
                              ? 'bg-purple-100 text-gray-800'
                              : 'bg-green-100 text-gray-800'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 px-2">
                          {formatTime(msg.timestamp)}
                          {!isCurrentUser(msg.sender_id) && (
                            <span className="ml-2 capitalize">
                              {msg.sender_role === 'doctor' ? 'Dr.' : 'Patient'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-end space-x-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (Press Enter to send)"
                  className="flex-1 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="2"
                  disabled={loading || connectionStatus !== 'connected'}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !inputMessage.trim() || connectionStatus !== 'connected'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                💬 Secure real-time chat with your doctor
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeChat;