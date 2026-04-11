import React, { useEffect, useState } from 'react';
import { getMessages, markMessageAsRead, deleteMessage, replyMessage } from '../../services/messageService';
import { LuTrash, LuCheck, LuMail, LuMessageSquare, LuCornerDownRight } from 'react-icons/lu';
import toast from 'react-hot-toast';
import '../../styles/admin.css';

export default function AdminMessages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Reply states
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const res = await getMessages();
            setMessages(res.data?.data || []);
            setError('');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await markMessageAsRead(id);
            toast.success('Message marked as read');
            load();
        } catch (err) {
            toast.error('Failed to update message');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            await deleteMessage(id);
            toast.success('Message deleted');
            load();
        } catch (err) {
            toast.error('Failed to delete message');
        }
    };

    const submitReply = async (id) => {
        if (!replyText.trim()) return toast.error('Reply cannot be empty');
        setSubmittingReply(true);
        try {
            await replyMessage(id, { reply: replyText });
            toast.success('Reply saved successfully!');
            setReplyingTo(null);
            setReplyText('');
            load();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to send reply');
        } finally {
            setSubmittingReply(false);
        }
    };

    if (loading && messages.length === 0) {
        return <div className="admin-loading">Loading messages...</div>;
    }

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <div style={{ flex: 1 }}></div>
                <button onClick={load} className="admin-btn admin-btn--primary">Refresh</button>
            </div>

            {error && <div className="admin-error-message">{error}</div>}

            {messages.length === 0 && !loading && !error ? (
                <div className="admin-empty-state">
                    <LuMail size={48} style={{ color: '#ccc', marginBottom: '1rem' }} />
                    <p>No messages yet.</p>
                </div>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Sender</th>
                                <th>Message</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.map((msg) => (
                                <React.Fragment key={msg.id}>
                                    <tr style={{ background: msg.status === 'unread' ? '#f0f9ff' : 'transparent' }}>
                                        <td style={{ whiteSpace: 'nowrap' }}>{new Date(msg.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <strong>{msg.name}</strong><br />
                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>{msg.email}</span>
                                        </td>
                                        <td style={{ maxWidth: '400px' }}>
                                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem', color: '#333', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px' }}>
                                                {msg.message}
                                            </div>

                                            {/* Thread view in table cell (simplified) */}
                                            {msg.replies && msg.replies.length > 0 && (
                                                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {msg.replies.map(r => (
                                                        <div key={r.id} style={{
                                                            fontSize: '0.8rem',
                                                            padding: '6px 10px',
                                                            background: r.senderRole === 'admin' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                                                            borderLeft: `2px solid ${r.senderRole === 'admin' ? '#3b82f6' : '#10b981'}`,
                                                            borderRadius: '4px'
                                                        }}>
                                                            <span style={{ fontWeight: 700, color: r.senderRole === 'admin' ? '#3b82f6' : '#10b981' }}>
                                                                {r.senderRole === 'admin' ? 'Staff' : 'Customer'}:
                                                            </span> {r.content}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Compatibility for old reply field */}
                                            {msg.reply && (!msg.replies || msg.replies.length === 0) && (
                                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderLeft: '3px solid #667eea', borderRadius: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#667eea', fontWeight: 'bold', marginBottom: '4px' }}>
                                                        <LuCornerDownRight size={14} /> Admin Reply:
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#4b5563', whiteSpace: 'pre-wrap' }}>{msg.reply}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`admin-status-badge status-${msg.status === 'unread' ? 'pending' : msg.status === 'replied' ? 'success' : 'delivered'}`}>
                                                {msg.status}
                                            </span>
                                        </td>
                                        <td className="admin-table-actions">
                                            {msg.status === 'unread' && (
                                                <button
                                                    title="Mark as Read"
                                                    onClick={() => handleMarkAsRead(msg.id)}
                                                    className="admin-icon-btn action-approve"
                                                >
                                                    <LuCheck size={18} />
                                                </button>
                                            )}

                                            <button
                                                title="Reply"
                                                onClick={() => {
                                                    setReplyingTo(replyingTo === msg.id ? null : msg.id);
                                                    setReplyText('');
                                                }}
                                                className="admin-icon-btn action-edit"
                                                style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}
                                            >
                                                <LuMessageSquare size={18} />
                                            </button>

                                            <button
                                                title="Delete Message"
                                                onClick={() => handleDelete(msg.id)}
                                                className="admin-icon-btn action-delete"
                                            >
                                                <LuTrash size={18} />
                                            </button>
                                        </td>
                                    </tr>

                                    {replyingTo === msg.id && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '1rem 2rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '600px', margin: '0 auto' }}>
                                                    <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Replying to {msg.name}:</label>
                                                    <textarea
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="Type your response here..."
                                                        rows="4"
                                                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
                                                    />
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                                                        <button
                                                            onClick={() => setReplyingTo(null)}
                                                            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => submitReply(msg.id)}
                                                            disabled={submittingReply}
                                                            className="admin-btn admin-btn--primary"
                                                            style={{ padding: '0.5rem 1rem' }}
                                                        >
                                                            {submittingReply ? 'Sending...' : 'Send Reply'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
