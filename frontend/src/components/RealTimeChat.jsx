
import React, { useState, useEffect, useRef } from 'react';
import {
  Send, User as UserIcon, Heart, Loader, ArrowLeft, MessageSquare,
  Wifi, WifiOff, Home, Calendar, Clock, Activity, Smile, FileText, Settings, LogOut, Menu
} from 'lucide-react';
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
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, disconnected, error
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const messageIdsRef = useRef(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (appointmentId && token) {
      initializeChat();
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [appointmentId, token]);

  const initializeChat = async () => {
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
        connectToWebSocket(chatToken);
        fetchChatHistory();
      } else {
        console.error('Failed to get chat token, using regular token as fallback');
        connectToWebSocket(token);
        fetchChatHistory();
      }
    } catch (err) {
      console.error('Error fetching chat token:', err);
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
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) wsRef.current.close();

      setConnectionStatus('connecting');

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

          if (data.type === 'heartbeat') return;

          const messageId = data.message_id || data.client_message_id;
          if (messageId && messageIdsRef.current.has(messageId)) return;

          if (messageId) messageIdsRef.current.add(messageId);

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

        if (event.code === 1005 || event.code === 1006 || event.code >= 1007) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connectToWebSocket(useToken);
          }, 3000);
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

        formattedMessages.forEach(msg => {
          if (msg.id) messageIdsRef.current.add(msg.id);
        });

        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  const sendMessageWithFallback = async (messageData) => {
    const clientMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const enrichedMessageData = {
      ...messageData,
      client_message_id: clientMessageId
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(enrichedMessageData));
      return { method: 'websocket', status: 'sent' };
    }

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
    if (!inputMessage.trim() || loading) return;

    try {
      setLoading(true);
      const messageData = {
        message: inputMessage.trim(),
        type: 'text'
      };

      const result = await sendMessageWithFallback(messageData);

      if (result.status === 'sent') {
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
    const userIds = [
      user?.user_id?.toString(),
      user?.id?.toString(),
      user?.sub?.toString(),
      user?.user?.user_id?.toString(),
      user?.user?.id?.toString()
    ];
    return userIds.some(id => id && senderId === id);
  };

  // Sidebar Nav Item Helper
  const NavItem = ({ icon: Icon, label, view, active }) => (
    <button
      onClick={() => { setCurrentView(view); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
        ? 'bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 font-semibold shadow-sm border border-teal-100'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
      <span>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500"></div>}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Heart className="w-6 h-6 text-white text-bold" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent tracking-tight">Mentora</h1>
              <p className="text-xs text-gray-400 font-medium">Patient Portal</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
            <NavItem icon={Home} label="Overview" view="user-dashboard" />
            <NavItem icon={Calendar} label="Appointments" view="my-appointments" active={true} />
            <NavItem icon={Calendar} label="Book Session" view="book-appointment" />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Wellness</p>
            <NavItem icon={Activity} label="Assessment" view="severity-assessment" />
            <NavItem icon={Smile} label="Mood Tracker" view="mood-tracker" />
            <NavItem icon={FileText} label="Treatment Plan" view="treatment-plan" />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Account</p>
            <NavItem icon={UserIcon} label="Profile" view="user-profile" />
            <NavItem icon={Settings} label="Settings" view="settings" />
          </nav>
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || sessionStorage.getItem('user_name') || 'User'}</p>
                <button onClick={() => { sessionStorage.clear(); setCurrentView('landing'); }} className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1">
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center"><Heart className="w-4 h-4 text-white" fill="white" /></div>
            <span className="font-bold text-gray-800">Mentora</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"><Menu className="w-6 h-6" /></button>
        </header>

        <div className="flex-1 flex flex-col relative overflow-hidden bg-gray-50/50">
          {/* Chat Content */}
          <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full h-full md:p-6 p-2">

            {/* Chat Card */}
            <div className="bg-white md:rounded-3xl shadow-xl overflow-hidden flex flex-col h-full border border-gray-200">

              {/* Chat Header */}
              <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={onBack || (() => setCurrentView('my-appointments'))}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">Consultation Chat</h2>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                        <span className="text-xs text-gray-500 font-medium">
                          {connectionStatus === 'connected' ? 'Live Secure Connection' : 'Connecting...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Session ID</p>
                  <p className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded mt-1">#{appointmentId}</p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#FDFDFD]">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                    <MessageSquare className="w-16 h-16 mb-4 text-gray-200" />
                    <p className="font-medium text-gray-500">No messages yet</p>
                    <p className="text-sm">Start the conversation below.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = isCurrentUser(msg.sender_id);
                    return (
                      <div key={msg.id || msg.client_id || Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                          <div className={`
                                                px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed
                                                ${isMe
                              ? 'bg-teal-600 text-white rounded-br-none'
                              : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                            }
                                            `}>
                            {msg.content}
                          </div>
                          <div className="flex items-center gap-1 mt-1 px-1">
                            <span className="text-[10px] text-gray-400 font-medium">{formatTime(msg.timestamp)}</span>
                            {!isMe && <span className="text-[10px] text-teal-600 font-bold">• {msg.sender_role === 'doctor' ? 'Dr.' : 'User'}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="relative flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent border-0 focus:ring-0 p-3 max-h-32 min-h-[50px] resize-none text-gray-700 placeholder-gray-400"
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !inputMessage.trim()}
                    className={`
                                    p-3 rounded-xl mb-1 transition-all duration-200 flex items-center justify-center
                                    ${!inputMessage.trim()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg active:scale-95'
                      }
                                `}
                  >
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
                <div className="text-center mt-2 flex items-center justify-center gap-2">
                  <ShieldIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">End-to-End Encrypted Session</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper Icon for footer
const ShieldIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default RealTimeChat;