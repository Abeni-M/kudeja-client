import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';
import { sendMessage, getUserMessages, sendAIChat } from '../services/messageService';
import { LuMessageSquare, LuX, LuSend, LuLoader } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import './LiveChat.css';

const LiveChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [botStatus, setBotStatus] = useState('Checking...');
    const { socket, unreadCount, fetchUnreadCount } = useMessages();
    const { user } = useAuth();
    const chatEndRef = useRef(null);

    useEffect(() => {
        // Check AI Health status on mount
        const checkAI = async () => {
            try {
                const res = await fetch('/api/health/ai');
                if (res.ok) {
                    const data = await res.json();
                    setBotStatus(data.geminiActive ? ' Online' : '🤖 Assistant Online');
                } else {
                    setBotStatus('🤖 Assistant Online');
                }
            } catch (err) {
                setBotStatus('🤖 Assistant Online');
            }
        };
        checkAI();
    }, []);

    useEffect(() => {
        console.log("🚀 LiveChat Initialized: Waiting for input...");
    }, []);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && user) {
            loadChatHistory();
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (socket) {
            socket.on('chat_message', (data) => {
                if (data.isAdmin) {
                    setChatHistory(prev => [...prev, {
                        content: data.message,
                        senderRole: 'admin',
                        createdAt: new Date().toISOString()
                    }]);
                    scrollToBottom();
                }
            });
        }
        return () => {
            if (socket) socket.off('chat_message');
        };
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const loadChatHistory = async () => {
        try {
            setLoading(true);
            const res = await getUserMessages();
            if (res.data?.success) {
                // Flatten conversations into a simple message list if needed
                const allMessages = res.data.data.flatMap(m => [
                    { content: m.message, senderRole: 'user', createdAt: m.createdAt },
                    ...(m.replies || []).map(r => ({ content: r.content, senderRole: r.senderRole, createdAt: r.createdAt }))
                ]).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                
                setChatHistory(allMessages);
            }
        } catch (err) {
            console.error('Failed to load chat history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        if (!user) {
            toast.error('Please log in to chat with support');
            return;
        }

        const msgContent = message;
        setMessage('');

        try {
            // 1. Show User Message Immediately
            setChatHistory(prev => [...prev, {
                content: msgContent,
                senderRole: 'user',
                createdAt: new Date().toISOString()
            }]);

            // 2. Show Typing Indicator
            setIsTyping(true);

            // 3. Call AI Chat
            const res = await sendAIChat({ message: msgContent });

            if (res.data?.success) {
                // 4. Emit real-time message to socket for Admin
                if (socket) {
                    socket.emit('chat_message', {
                        message: msgContent,
                        senderName: user.username || user.name,
                        isAdmin: false,
                        targetUserId: 'admin'
                    });
                }

                // 5. Update with AI reply from server
                if (res.data.reply) {
                    setChatHistory(prev => [...prev, {
                        content: res.data.reply,
                        senderRole: 'admin',
                        createdAt: new Date().toISOString()
                    }]);
                }
            }
        } catch (err) {
            toast.error('Failed to send message');
        } finally {
            setIsTyping(false);
        }
    };

    const formatMessage = (content) => {
        if (!content) return content;
        
        // Match standard links or my custom 🔗 link format
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = content.split(urlRegex);
        
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                // If it's a product link, make it a button
                if (part.includes('/product/')) {
                    return (
                        <a 
                            key={i} 
                            href={part} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="chat-product-link"
                        >
                            View Product Details
                        </a>
                    );
                }
                // Regular link
                return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className='chat-url'>{part}</a>;
            }
            return part;
        });
    };

    // No longer hiding for admins so they can test the AI features

    return (
        <div className="live-chat-container">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        className="chat-window"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="online-indicator"></div>
                                <div className='kud'>
                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Support Chat</h3>
                                    <p style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>{botStatus}</p>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setIsOpen(false)}>
                                <LuX size={20} />
                            </button>
                        </div>

                        <div className="chat-body">
                            {loading ? (
                                <div className="chat-loading">
                                    <LuLoader className="spinner" />
                                    Loading conversation...
                                </div>
                            ) : !user ? (
                                <div className="chat-welcome">
                                    <LuMessageSquare size={40} />
                                    <h3>Hello! 👋</h3>
                                    <p>Please log in to start a real-time conversation with our support team.</p>
                                    <a href="/login" className="btn-primary" style={{ marginTop: '1rem', width: '100%', textAlign: 'center' }}>Login</a>
                                </div>
                            ) : chatHistory.length === 0 ? (
                                <div className="chat-welcome">
                                    <LuMessageSquare size={40} />
                                    <h3>Start Chatting</h3>
                                    <p>Send a message and an agent will be with you shortly.</p>
                                </div>
                            ) : (
                                <div className="messages-list">
                                    {chatHistory.map((msg, idx) => (
                                        <div key={idx} className={`message-bubble ${msg.senderRole === 'admin' ? 'admin' : 'user'}`}>
                                            <div className="bubble-content">{formatMessage(msg.content)}</div>
                                            <div className="bubble-time">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="message-bubble admin typing">
                                            <div className="bubble-content">
                                                <div className="typing-dots">
                                                    <span></span><span></span><span></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            )}
                        </div>

                        {user && (
                            <form className="chat-footer" onSubmit={handleSend}>
                                <input 
                                    type="text" 
                                    placeholder="Type your message..." 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <button type="submit" disabled={!message.trim()}>
                                    <LuSend size={18} />
                                </button>
                            </form>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button 
                className="chat-toggle"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <LuX size={24} /> : (
                    <>
                        <LuMessageSquare size={24} />
                        {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
                    </>
                )}
            </motion.button>
        </div>
    );
};

export default LiveChatWidget;
