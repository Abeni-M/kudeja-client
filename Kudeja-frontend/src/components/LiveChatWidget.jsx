import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { sendMessage, getUserMessages, sendAIChat } from '../services/messageService';
import { LuMessageSquare, LuX, LuSend, LuLoader } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import './LiveChat.css';

const LiveChatWidget = () => {
    const navigate = useNavigate();
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
                const res = await api.get('/health/ai');
                if (res.data) {
                    setBotStatus(res.data.geminiActive ? ' Online' : '🤖 Assistant Online');
                } else {
                    setBotStatus(' Online');
                }
            } catch (err) {
                setBotStatus(' Online');
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

    const renderTextWithBreaks = (text, keyPrefix) => {
        const lines = text.split('\n');
        return (
            <span key={keyPrefix}>
                {lines.map((line, idx) => (
                    <React.Fragment key={idx}>
                        {line}
                        {idx < lines.length - 1 && <br />}
                    </React.Fragment>
                ))}
            </span>
        );
    };

    const formatMessage = (content) => {
        if (!content) return content;
        
        // Clean up common AI malformations like [url[url]] or duplicated brackets
        let cleaned = content.replace(/\[\s*(https?:\/\/[^\s\]]+)\s*\[\s*(?:https?:\/\/[^\s\]]+)\s*\]\s*\]/g, '$1');
        cleaned = cleaned.replace(/\[\s*(https?:\/\/[^\s\]]+)\s*\]/g, '$1');

        // Regex to match:
        // 1. Markdown link: [text](url)
        // 2. Standalone URL or relative product link
        const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+|\/product\/[^\s\)]+)\)|(https?:\/\/[^\s<>"'{}|\\^`\[\]]+|\/product\/[a-zA-Z0-9_-]+)/g;

        const elements = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(cleaned)) !== null) {
            if (match.index > lastIndex) {
                const textChunk = cleaned.substring(lastIndex, match.index);
                // Clean up any orphan bracket right before the link (e.g. "here: [")
                const cleanChunk = textChunk.replace(/\[\s*$/, '');
                if (cleanChunk) {
                    elements.push(renderTextWithBreaks(cleanChunk, `txt-${lastIndex}`));
                }
            }

            const isMarkdown = Boolean(match[1] && match[2]);
            const label = isMarkdown ? match[1] : null;
            let rawUrl = isMarkdown ? match[2] : match[3];

            if (!isMarkdown) {
                rawUrl = rawUrl.replace(/[.,;:!?)]+$/, '');
            }

            // Extract clean product ID to guarantee 100% correct navigation
            const productMatch = rawUrl.match(/\/product\/([a-zA-Z0-9_-]+)/);
            if (productMatch) {
                const productId = productMatch[1];
                elements.push(
                    <button
                        key={`prod-${match.index}`}
                        onClick={() => navigate(`/product/${productId}`)}
                        className="chat-product-link"
                    >
                        🛍️ {label && !label.startsWith('http') ? label : 'View Product Details'}
                    </button>
                );
            } else {
                elements.push(
                    <a
                        key={`link-${match.index}`}
                        href={rawUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chat-url"
                    >
                        {label || rawUrl}
                    </a>
                );
            }

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < cleaned.length) {
            const remaining = cleaned.substring(lastIndex).replace(/^\]/, '');
            if (remaining) {
                elements.push(renderTextWithBreaks(remaining, `txt-${lastIndex}`));
            }
        }

        return elements;
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
