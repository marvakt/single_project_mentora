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
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const messageIdsRef = useRef(new Set()); // Track message IDs to prevent duplicates

  useEffect(() => {
    if (appointmentId && token) {
      initializeChat();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      // Clear any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [appointmentId, token]);
  
  const initializeChat = async () => {
    // Fetch appointment-specific chat token
    try {
      const response = await fetch(
        `${MEDICAL_API}/chat/token/${appointmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const chatToken = data.token;
        
        // Connect to WebSocket with appointment-specific token
        connectToWebSocket(chatToken);
        fetchChatHistory();
      } else {
        console.error('Failed to get chat token, using regular token as fallback');
        // Fallback to regular token
        connectToWebSocket(token);
        fetchChatHistory();
      }
    } catch (err) {
      console.error('Error fetching chat token:', err);
      // Fallback to regular token
      connectToWebSocket(token);
      fetchChatHistory();
    }
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const connectToWebSocket = (useToken = token) => {
    try {
      // Clear any existing reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      setConnectionStatus('connecting');
      
      // Convert HTTP API URL to WebSocket URL - include the full chat path
      const wsUrl = `${MEDICAL_API.replace('http://', 'ws://').replace('https://', 'wss://')}/chat/ws/${appointmentId}?token=${useToken}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
      };      
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          // Handle heartbeat messages
          if (data.type === 'heartbeat') {
            console.log('Received heartbeat');
            return;
          }
          
          // Add message to chat with deduplication using both message_id and client_message_id
          const messageId = data.message_id || data.client_message_id;
          if (messageId && messageIdsRef.current.has(messageId)) {
            console.log('Duplicate message ignored:', messageId);
            return;
          }
          
          // Add to tracked IDs
          if (messageId) {
            messageIdsRef.current.add(messageId);
          }
          
          const newMessage = {
            id: data.message_id,
            client_id: data.client_message_id,
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
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Only attempt to reconnect if the disconnection was abnormal
        // 1000 = Normal closure, 1001-1004 = Normal closures, 1005 = No status, 1006 = Abnormal closure
        // Only reconnect on abnormal closures (1005, 1006) or error codes (1007+)
        if (event.code === 1005 || event.code === 1006 || event.code >= 1007) {
          // Attempt to reconnect after a delay
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect to WebSocket...');
            connectToWebSocket(useToken);
          }, 3000); // Reconnect after 3 seconds
        }
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
        
        // Populate message IDs set for deduplication
        formattedMessages.forEach(msg => {
          if (msg.id) {
            messageIdsRef.current.add(msg.id);
          }
        });
        
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  const sendMessageWithFallback = async (messageData) => {
    // Generate client message ID once for idempotency
    const clientMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const enrichedMessageData = {
      ...messageData,
      client_message_id: clientMessageId
    };
    
    // Try WebSocket first
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(enrichedMessageData));
      return { method: 'websocket', status: 'sent' };
    }
    
    // Fallback to REST API with same client_message_id
    try {
      const response = await fetch(`${MEDICAL_API}/chat/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room_id: appointmentId,
          message: enrichedMessageData.message,
          message_type: enrichedMessageData.type,
          client_message_id: clientMessageId
        })
      });
      
      if (response.ok) {
        return { method: 'rest', status: 'sent' };
      }
    } catch (err) {
      console.error('Both WebSocket and REST failed:', err);
      return { method: 'both', status: 'failed' };
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) {
      return;
    }

    try {
      setLoading(true);
      const messageData = {
        message: inputMessage.trim(),
        type: 'text'
      };
      
      const result = await sendMessageWithFallback(messageData);
      
      if (result.status === 'sent') {
        // Clear input and add to UI immediately with temporary ID
        setInputMessage('');
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
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
    // Check multiple possible user ID fields from the user object
    const userIds = [
      user?.user_id?.toString(),
      user?.id?.toString(),
      user?.sub?.toString(),
      user?.user?.user_id?.toString(),
      user?.user?.id?.toString()
    ];
    
    return userIds.some(id => id && senderId === id);
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
                    key={msg.id || msg.client_id || Math.random()} // Fallback key
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
                  disabled={loading || (connectionStatus !== 'connected' && connectionStatus !== 'disconnected')}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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