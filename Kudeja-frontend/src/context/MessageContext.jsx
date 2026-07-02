import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getUnreadCount, getAdminUnreadCount, markAllAsReadByUser } from '../services/messageService';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const MessageContext = createContext();

export const useMessages = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [adminUnreadCount, setAdminUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();
    // Use ref to always have the latest user inside socket callbacks without re-creating socket
    const userRef = useRef(user);
    useEffect(() => { userRef.current = user; }, [user]);

    const fetchUnreadCount = useCallback(async () => {
        if (!userRef.current) return;
        try {
            const res = await getUnreadCount();
            if (res.data?.success) {
                setUnreadCount(res.data.count);
            }
            if (userRef.current?.role === 'admin') {
                const adminRes = await getAdminUnreadCount();
                if (adminRes.data?.success) {
                    setAdminUnreadCount(adminRes.data.count);
                }
            }
        } catch (err) {
            console.error('Failed to fetch unread message count:', err);
        }
    }, []); // ← no deps: stable reference, uses ref internally

    const clearUnreadCount = async () => {
        try {
            await markAllAsReadByUser();
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to clear unread messages:', err);
        }
    };

    // ── Socket lifecycle: only recreate socket when user changes ─────────────
    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            setAdminUnreadCount(0);
            setSocket(prev => {
                if (prev) prev.disconnect();
                return null;
            });
            return;
        }

        // Fetch counts on login/user-change
        fetchUnreadCount();

        const socketUrl = import.meta.env.MODE === 'development'
            ? window.location.origin   // goes through Vite proxy → backend
            : (import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:5000')); // production: use env var

        const s = io(socketUrl, {
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            transports: ['websocket', 'polling'], // try websocket first, fall back to polling
        });

        setSocket(s);

        s.on('connect', () => {
            console.log('🔌 Connected to notification server');
            s.emit('join', user.id);
            if (user.role === 'admin') {
                s.emit('join_admin');
            }
        });

        s.on('disconnect', (reason) => {
            console.warn('⚠️ Socket disconnected:', reason);
            // Socket.io will auto-reconnect unless the server explicitly closed it
        });

        s.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });

        s.on('notification', (data) => {
            console.log('🔔 New notification:', data);
            fetchUnreadCount();
            toast(data.message, {
                icon: '💬',
                duration: 4000,
                position: 'bottom-right'
            });
        });

        return () => {
            s.disconnect();
            setSocket(null);
        };
    }, [user]); // ← ONLY re-run when user changes, not on every render

    return (
        <MessageContext.Provider value={{ unreadCount, adminUnreadCount, fetchUnreadCount, clearUnreadCount, socket }}>
            {children}
        </MessageContext.Provider>
    );
};
