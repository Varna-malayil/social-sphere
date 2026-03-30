// src/pages/ChatPage.tsx — Real-time chat with Socket.IO
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, Input, Button, Spin } from 'antd';
import { SendOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { messagesAPI, usersAPI } from '@/api';
import { useConversations, useMessages } from '@/hooks/useQueries';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/context/SocketContext';
import type { Message, Conversation } from '@/types';

dayjs.extend(relativeTime);

const ConvItem: React.FC<{
  conv: Conversation; isActive: boolean; myId: string; onClick: () => void;
}> = ({ conv, isActive, myId, onClick }) => {
  const other = conv.participants.find((p) => p._id !== myId);
  const unread = conv.unreadCounts?.find((u) => u.user === myId)?.count || 0;
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
      style={{ background: isActive ? 'var(--accent-dim)' : 'transparent',
               border: isActive ? '1px solid rgba(124,106,247,0.3)' : '1px solid transparent' }}>
      <div className="relative flex-shrink-0">
        <Avatar src={other?.avatar} size={42} style={{ background: 'var(--accent)' }}>
          {other?.displayName?.[0]}
        </Avatar>
        {other?.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
            style={{ background: 'var(--online)', borderColor: 'var(--bg-card)' }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{other?.displayName}</span>
          {conv.lastMessageAt && (
            <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
              {dayjs(conv.lastMessageAt).fromNow(true)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {conv.lastMessageText || 'Start a conversation'}
          </p>
          {unread > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 font-semibold"
              style={{ background: 'var(--accent)', color: '#fff' }}>{unread}</span>
          )}
        </div>
      </div>
    </button>
  );
};

const MessageBubble: React.FC<{ msg: Message; isMe: boolean }> = ({ msg, isMe }) => (
  <div className={`flex items-end gap-2 mb-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
    {!isMe && (
      <Avatar src={msg.sender.avatar} size={28} style={{ background: 'var(--accent)', flexShrink: 0 }}>
        {msg.sender.displayName?.[0]}
      </Avatar>
    )}
    <div className={`max-w-xs lg:max-w-md flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
        style={{
          background: isMe ? 'var(--accent)' : 'var(--bg-elevated)',
          color: isMe ? '#fff' : 'var(--text-primary)',
          borderBottomRightRadius: isMe ? 4 : undefined,
          borderBottomLeftRadius: !isMe ? 4 : undefined,
        }}>{msg.content}</div>
      <span className="text-xs mt-1 px-1" style={{ color: 'var(--text-muted)' }}>
        {dayjs(msg.createdAt).format('h:mm A')}
      </span>
    </div>
  </div>
);

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socket } = useSocket();
  const [activeConvId, setActiveConvId] = useState(conversationId || '');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [newUserSearch, setNewUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convsLoading, refetch: refetchConvs } = useConversations();
  const { data: msgsData, isLoading: msgsLoading } = useMessages(activeConvId);

  useEffect(() => { if (msgsData) setLocalMessages(msgsData as any); }, [msgsData]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [localMessages]);

  useEffect(() => {
    if (!socket || !activeConvId) return;
    socket.emit('joinConversation', activeConvId);
    const onMsg = ({ message, conversationId: cid }: any) => {
      if (cid === activeConvId) { setLocalMessages((p) => [...p, message]); }
      refetchConvs();
    };
    const onTyping = ({ username, isTyping: t }: any) => {
      setTypingUser(username); setIsTyping(t);
    };
    socket.on('newMessage', onMsg);
    socket.on('userTyping', onTyping);
    return () => {
      socket.emit('leaveConversation', activeConvId);
      socket.off('newMessage', onMsg);
      socket.off('userTyping', onTyping);
    };
  }, [socket, activeConvId]);

  const handleInputChange = (val: string) => {
    setMsgInput(val);
    if (!socket || !activeConvId) return;
    socket.emit('typing', { conversationId: activeConvId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { conversationId: activeConvId, isTyping: false });
    }, 2000);
  };

  const handleSend = async () => {
    const content = msgInput.trim();
    if (!content || !activeConvId || sending) return;
    setSending(true);
    try {
      const { data } = await messagesAPI.sendMessage(activeConvId, content);
      setLocalMessages((p) => [...p, data.data]);
      setMsgInput('');
      refetchConvs();
    } finally { setSending(false); }
  };

  const handleUserSearch = async (q: string) => {
    setNewUserSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await usersAPI.searchUsers(q);
    setSearchResults(data.data || []);
  };

  const handleStartConv = async (userId: string) => {
    const { data } = await messagesAPI.getOrCreateConversation(userId);
    setActiveConvId(data.data._id);
    navigate(`/chat/${data.data._id}`);
    setNewUserSearch(''); setSearchResults([]);
    refetchConvs();
  };

  const activeConv = conversations?.find((c) => c._id === activeConvId);
  const otherUser = activeConv?.participants.find((p) => p._id !== user?._id);

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-2xl border"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r" style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Messages</h2>
          <div className="relative">
            <Input prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Search users..." value={newUserSearch}
              onChange={(e) => handleUserSearch(e.target.value)} style={{ borderRadius: 10 }} />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 card z-50 overflow-hidden">
                {searchResults.slice(0, 5).map((u) => (
                  <button key={u._id} onClick={() => handleStartConv(u._id)}
                    className="w-full flex items-center gap-2 p-3 hover:bg-white/5 transition-colors">
                    <Avatar src={u.avatar} size={32} style={{ background: 'var(--accent)' }}>{u.displayName?.[0]}</Avatar>
                    <div className="text-left">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.displayName}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {convsLoading ? <div className="flex justify-center py-8"><Spin size="small" /></div>
            : !conversations?.length ? (
              <p className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                No conversations yet
              </p>
            ) : conversations.map((conv) => (
              <ConvItem key={conv._id} conv={conv} isActive={conv._id === activeConvId}
                myId={user?._id || ''} onClick={() => { setActiveConvId(conv._id); navigate(`/chat/${conv._id}`); }} />
            ))}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConvId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">💬</div>
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Your messages</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Search a user to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              {otherUser && (
                <>
                  <div className="relative">
                    <Avatar src={otherUser.avatar} size={38} style={{ background: 'var(--accent)' }}>
                      {otherUser.displayName?.[0]}
                    </Avatar>
                    {otherUser.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                        style={{ background: 'var(--online)', borderColor: 'var(--bg-card)' }} />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{otherUser.displayName}</div>
                    <div className="text-xs" style={{ color: otherUser.isOnline ? 'var(--online)' : 'var(--text-muted)' }}>
                      {otherUser.isOnline ? 'Online' : `Last seen ${dayjs(otherUser.lastSeen).fromNow()}`}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {msgsLoading ? <div className="flex justify-center py-8"><Spin /></div>
                : localMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Say hello 👋</p>
                  </div>
                ) : (
                  <>
                    {localMessages.map((msg) => (
                      <MessageBubble key={msg._id} msg={msg} isMe={msg.sender._id === user?._id} />
                    ))}
                    {isTyping && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="px-4 py-2.5 rounded-2xl text-sm"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                          <span className="animate-pulse">{typingUser} is typing…</span>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </>
                )}
            </div>

            <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-2">
                <Input value={msgInput} onChange={(e) => handleInputChange(e.target.value)}
                  onPressEnter={handleSend} placeholder="Type a message…"
                  style={{ borderRadius: 20, flex: 1 }} maxLength={2000} />
                <Button type="primary" shape="circle" icon={<SendOutlined />}
                  loading={sending} onClick={handleSend} disabled={!msgInput.trim()} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
