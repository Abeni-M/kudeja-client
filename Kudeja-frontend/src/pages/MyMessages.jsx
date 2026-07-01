import React, { useState, useEffect } from 'react';
import { getUserMessages, replyMessage } from '../services/messageService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { LuMail, LuMessageSquare, LuCornerDownRight, LuClock, LuSend, LuUser, LuShieldCheck } from 'react-icons/lu';
import { useMessages } from '../context/MessageContext';
import toast from 'react-hot-toast';

const MyMessages = () => {
    const [replyText, setReplyText] = useState({});
    const { clearUnreadCount } = useMessages();
    const queryClient = useQueryClient();

    const { data: messages = [], isLoading, error } = useQuery({
        queryKey: ['messages'],
        queryFn: async () => {
            const res = await getUserMessages();
            return res.data?.data || [];
        }
    });

    const replyMutation = useMutation({
        mutationFn: ({ messageId, text }) => replyMessage(messageId, { reply: text }),
        onSuccess: () => {
            toast.success('Reply sent!');
            queryClient.invalidateQueries(['messages']);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || 'Failed to send reply');
        }
    });

    useEffect(() => {
        clearUnreadCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleReply = async (messageId) => {
        const text = replyText[messageId];
        if (!text || !text.trim()) return toast.error('Reply cannot be empty');

        replyMutation.mutate({ messageId, text }, {
            onSuccess: () => setReplyText(prev => ({ ...prev, [messageId]: '' }))
        });
    };

    if (isLoading) return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            style={{ padding: '4rem', textAlign: 'center' }}
        >
            Loading your messages...
        </motion.div>
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', minHeight: '80vh' }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#4CAF50', color: 'white', padding: '12px', borderRadius: '12px', display: 'flex' }}>
                    <LuMail size={28} />
                </div>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#1a1a1a', margin: 0, fontWeight: 700 }}>My Messages</h1>
                    <p style={{ color: '#666', margin: '4px 0 0' }}>Track your inquiries and conversation with our staff</p>
                </div>
            </div>

            {error && <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '2rem' }}>{error}</div>}

            {messages.length === 0 ? (
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ textAlign: 'center', padding: '5rem 2rem', background: '#f9fafb', borderRadius: '24px', border: '2px dashed #e5e7eb' }}
                >
                    <LuMessageSquare size={56} style={{ color: '#9ca3af', marginBottom: '1.5rem' }} />
                    <h3 style={{ color: '#374151', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>No messages found</h3>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '1.1rem' }}>When you send us a message, it will appear here for tracking.</p>
                </motion.div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                >
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div 
                                key={msg.id} 
                                variants={itemVariants}
                                layout
                                style={{
                                    background: 'white',
                                    borderRadius: '20px',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.05)',
                                    padding: '1.5rem',
                                    border: '1px solid #f3f4f6',
                                    transition: 'transform 0.2s',
                                }}
                            >
                                {/* Original Message Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6b7280', fontSize: '0.9rem' }}>
                                        <LuClock size={16} />
                                        {new Date(msg.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' })}
                                    </div>
                                    <span style={{
                                        padding: '6px 14px',
                                        borderRadius: '50px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        backgroundColor: msg.status === 'replied' ? '#dcfce7' : msg.status === 'unread' ? '#fef3c7' : msg.status === 'seen' ? '#e0f2fe' : '#f3f4f6',
                                        color: msg.status === 'replied' ? '#166534' : msg.status === 'unread' ? '#92400e' : msg.status === 'seen' ? '#0369a1' : '#374151',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {msg.status}
                                    </span>
                                </div>

                                {/* Original Message Content */}
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem' }}>
                                    <div style={{ minWidth: '40px', height: '40px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#6b7280' }}>
                                        <LuUser size={20} />
                                    </div>
                                    <div style={{ fontSize: '1.05rem', color: '#1f2937', lineHeight: '1.6', background: '#f9fafb', padding: '1rem', borderRadius: '0 16px 16px 16px', flex: 1 }}>
                                        {msg.message}
                                    </div>
                                </div>

                                {/* Conversation Thread */}
                                {msg.replies && msg.replies.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        marginTop: '1.5rem',
                                        paddingLeft: '1rem',
                                        borderLeft: '2px solid #e5e7eb',
                                        marginBottom: '1.5rem'
                                    }}>
                                        {msg.replies.map((reply) => (
                                            <div key={reply.id} style={{
                                                alignSelf: reply.senderRole === 'admin' ? 'flex-start' : 'flex-end',
                                                maxWidth: '90%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontSize: '0.8rem',
                                                    color: reply.senderRole === 'admin' ? '#0284c7' : '#4b5563',
                                                    fontWeight: 600,
                                                    marginBottom: '2px',
                                                    justifyContent: reply.senderRole === 'admin' ? 'flex-start' : 'flex-end'
                                                }}>
                                                    {reply.senderRole === 'admin' ? <><LuShieldCheck size={14} /> Staff Body</> : reply.senderName}
                                                    <span style={{ fontWeight: 400, color: '#9ca3af' }}>• {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div style={{
                                                    padding: '0.85rem 1.1rem',
                                                    background: reply.senderRole === 'admin' ? '#f0f9ff' : '#f3f4f6',
                                                    borderRadius: reply.senderRole === 'admin' ? '0 16px 16px 16px' : '16px 0 16px 16px',
                                                    color: reply.senderRole === 'admin' ? '#0369a1' : '#1f2937',
                                                    fontSize: '0.95rem',
                                                    lineHeight: '1.5',
                                                    border: reply.senderRole === 'admin' ? '1px solid #bae6fd' : '1px solid #e5e7eb'
                                                }}>
                                                    {reply.content}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Compatibility for old single reply if it still exists */}
                                {msg.reply && (!msg.replies || msg.replies.length === 0) && (
                                    <div style={{ margin: '1rem 0 1.5rem 1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0 16px 16px 16px', borderLeft: '4px solid #0284c7' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#0284c7', fontWeight: 'bold', marginBottom: '8px' }}>
                                            <LuCornerDownRight size={16} /> Staff Response:
                                        </div>
                                        <div style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.6' }}>{msg.reply}</div>
                                    </div>
                                )}

                                {/* Reply Form */}
                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <textarea
                                        value={replyText[msg.id] || ''}
                                        onChange={(e) => setReplyText({ ...replyText, [msg.id]: e.target.value })}
                                        placeholder="Reply back to staff..."
                                        style={{
                                            flex: 1,
                                            padding: '0.85rem 1rem',
                                            borderRadius: '12px',
                                            border: '1px solid #e5e7eb',
                                            fontSize: '0.95rem',
                                            fontFamily: 'inherit',
                                            minHeight: '45px',
                                            maxHeight: '150px',
                                            resize: 'vertical',
                                            outline: 'none',
                                        }}
                                    />
                                    <button
                                        onClick={() => handleReply(msg.id)}
                                        disabled={replyMutation.isLoading || !(replyText[msg.id] || '').trim()}
                                        style={{
                                            background: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            opacity: (replyMutation.isLoading || !(replyText[msg.id] || '').trim()) ? 0.6 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {replyMutation.isLoading ? <div className="spinner"></div> : <LuSend size={20} />}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
            <style>{`
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default MyMessages;
