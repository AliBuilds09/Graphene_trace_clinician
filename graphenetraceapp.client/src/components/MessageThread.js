import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar.js';

const MessageThread = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!userId || !token) {
            setError('User not authenticated. Please log in.');
            setLoading(false);
            return;
        }
        fetchConversations();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const response = await axios.get(`http://localhost:5033/api/message/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(response.data);
            setLoading(false);
            return response.data; // Return data for immediate use after send
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Authentication failed. Please log in again.');
            } else if (err.response && err.response.status === 404) {
                if (role === 'patient') {
                    setError('No allocated clinician found. Please contact support.');
                } else if (role === 'clinician') {
                    setError('No allocated patients found.');
                } else {
                    setError('No allocations found.');
                }
            } else {
                setError('Failed to load conversations');
            }
            setLoading(false);
            return null;
        }
    };

    const selectConversation = (conv) => {
        if (conv.userID === 0) return;
        setSelectedConversation(conv);
        setMessages(conv.messages || []);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;
        setIsTyping(true);
        try {
            await axios.post('http://localhost:5033/api/message', {
                SenderID: parseInt(userId),
                ReceiverID: selectedConversation.userID,
                Content: newMessage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Immediately update UI by refetching and re-selecting
            const updatedConversations = await fetchConversations();
            if (updatedConversations) {
                const updatedConv = updatedConversations.find(c => c.userID === selectedConversation.userID);
                if (updatedConv) {
                    selectConversation(updatedConv);
                }
            }
            setNewMessage('');
        } catch (err) {
            setError('Failed to send message');
        } finally {
            setIsTyping(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            <div className="text-center text-white">
                <div className="spinner-border" role="status"></div>
                <p className="mt-3">Loading messages...</p>
            </div>
        </div>
    );
    if (error) return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'linear-gradient(135deg, #ff9a9e, #fecfef)' }}>
            <div className="alert alert-danger text-center shadow-lg" style={{ maxWidth: '500px' }}>
                <i className="bi bi-exclamation-triangle-fill fs-1 mb-3"></i>
                <h4>Oops!</h4>
                <p>{error}</p>
                <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>Retry</button>
            </div>
        </div>
    );

    return (
        <div className="d-flex vh-100" style={{ background: 'linear-gradient(135deg, #f5f7fa, #c9e6ff)' }}>
            <Sidebar role={role} />
            <div className="d-flex flex-grow-1">
                <div className="bg-white shadow-lg p-3" style={{ width: '350px', borderRight: '1px solid #e9ecef' }}>
                    <h5 className="text-center mb-4 fw-bold text-primary">
                        <i className="bi bi-chat-dots me-2"></i>Chats
                    </h5>
                    <div className="list-group list-group-flush">
                        {conversations.map((conv, index) => (
                            <button
                                key={index}
                                className={`list-group-item list-group-item-action d-flex align-items-center p-3 ${selectedConversation?.userID === conv.userID ? 'bg-primary text-white' : ''}`}
                                onClick={() => selectConversation(conv)}
                            >
                                <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px' }}>
                                    <i className="bi bi-person-fill"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <strong>{conv.name || 'Unknown'}</strong>
                                    <p className="mb-0 small text-muted">Last message...</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-grow-1 d-flex flex-column">
                    {selectedConversation ? (
                        <>
                            <div className="bg-primary text-white p-3 shadow-sm">
                                <h6 className="mb-0">
                                    <i className="bi bi-person-circle me-2"></i>{selectedConversation.name}
                                </h6>
                            </div>
                            <div className="flex-grow-1 p-3 overflow-auto" style={{ background: '#f8f9fa' }}>
                                {messages.map((msg, index) => (
                                    <div key={index} className={`d-flex mb-3 ${msg.senderID == userId ? 'justify-content-end' : 'justify-content-start'}`}>
                                        <div className={`p-3 rounded-3 shadow-sm ${msg.senderID == userId ? 'bg-primary text-white' : 'bg-white'}`} style={{ maxWidth: '70%' }}>
                                            <p className="mb-1">{msg.content}</p>
                                            <small className={`text-muted ${msg.senderID == userId ? 'text-light' : ''}`}>
                                                {new Date(msg.sentAt).toLocaleTimeString()}
                                            </small>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="d-flex justify-content-start mb-3">
                                        <div className="p-3 bg-white rounded-3 shadow-sm">
                                            <div className="typing-indicator">
                                                <span></span><span></span><span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-3 bg-white border-top">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control rounded-pill"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    />
                                    <button className="btn btn-primary rounded-pill ms-2" onClick={sendMessage}>
                                        <i className="bi bi-send"></i>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="d-flex align-items-center justify-content-center flex-grow-1 text-muted">
                            <div className="text-center">
                                <i className="bi bi-chat-dots fs-1 mb-3"></i>
                                <h5>Select a conversation to start chatting</h5>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageThread;