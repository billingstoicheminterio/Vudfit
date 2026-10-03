"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import {
  MessageSquare,
  X,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  Search,
  Users,
  Building2,
  Phone,
  Video,
  MoreVertical,
  Circle,
  Sparkles,
  MessageCircle,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTimeAgo, cn } from "@/lib/utils";

function formatWhatsAppTime(dateString?: string): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return "Yesterday";
  }

  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const EMOJI_LIST = [
  "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😊", "😎", "😍",
  "😘", "💖", "👍", "👎", "👏", "🔥", "🎉", "⭐", "💡", "📌",
  "📍", "📐", "📸", "🎨", "📁", "💼", "✅", "🚀", "❤️", "🙏", "💯", "👌"
];

export const WhatsAppChatWidget: React.FC = () => {
  const {
    isChatOpen,
    setChatOpen,
    users,
    currentUser,
    chatMessages,
    chatChannels,
    activeChatUserId,
    setActiveChatUser,
    activeChannelId,
    setActiveChannel,
    sendChatMessage,
    markMessagesAsRead,
    syncChatMessages,
    syncUsersFromServer,
  } = useAppStore();

  const [messageInput, setMessageInput] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLanConnected, setIsLanConnected] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeChatUserId, activeChannelId, isChatOpen]);

  // Real-time LAN Chat message polling
  useEffect(() => {
    let isMounted = true;
    const pollChat = async () => {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages) && isMounted) {
            syncChatMessages(data.messages);
            setIsLanConnected(true);
          }
        }
      } catch (err) {
        if (isMounted) setIsLanConnected(false);
      }
    };

    pollChat();
    const interval = setInterval(pollChat, isChatOpen ? 1200 : 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isChatOpen, syncChatMessages]);

  // Synchronize users across LAN devices
  useEffect(() => {
    let isMounted = true;
    const pollUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.users) && isMounted) {
            syncUsersFromServer(data.users);
          }
        }
      } catch (err) {
        // silent
      }
    };

    pollUsers();
    const interval = setInterval(pollUsers, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [syncUsersFromServer]);

  // Mark messages as read when active chat is open
  useEffect(() => {
    if (isChatOpen && activeChatUserId) {
      markMessagesAsRead(activeChatUserId);
    } else if (isChatOpen && activeChannelId) {
      markMessagesAsRead(undefined, activeChannelId);
    }
  }, [isChatOpen, activeChatUserId, activeChannelId, chatMessages.length, markMessagesAsRead]);

  // Auto-reset invalid activeChatUserId
  useEffect(() => {
    if (activeChatUserId && !users.some((u) => u.id === activeChatUserId)) {
      setActiveChatUser(null);
    }
  }, [activeChatUserId, users, setActiveChatUser]);

  const activeChatPartner = users.find((u) => u.id === activeChatUserId);
  const activeChannel = chatChannels.find((c) => c.id === activeChannelId);
  const hasActiveConversation = Boolean(activeChatPartner || activeChannel);

  const handleClose = () => {
    setActiveChatUser(null);
    setActiveChannel(null);
    setChatOpen(false);
  };

  // Helper to count unread messages from a specific user
  const getUnreadCountForUser = (targetUser: typeof users[0]) => {
    return chatMessages.filter((m) => {
      if (m.isRead) return false;
      const isReceiver =
        m.receiverId === currentUser.id ||
        (currentUser.email && m.receiverEmail?.toLowerCase() === currentUser.email.toLowerCase());
      if (!isReceiver) return false;

      const isFromUser =
        m.senderId === targetUser.id ||
        (targetUser.email && m.senderEmail?.toLowerCase() === targetUser.email.toLowerCase()) ||
        (targetUser.name && m.senderName?.toLowerCase() === targetUser.name.toLowerCase());

      return isFromUser;
    }).length;
  };

  // Total unread messages for currentUser
  const totalUnreadCount = chatMessages.filter((m) => {
    if (m.isRead) return false;
    const isReceiver =
      m.receiverId === currentUser.id ||
      (currentUser.email && m.receiverEmail?.toLowerCase() === currentUser.email.toLowerCase());
    return isReceiver;
  }).length;

  // Filter messages for current active conversation
  const currentConversationMessages = chatMessages.filter((m) => {
    if (activeChannelId) {
      return m.channelId === activeChannelId;
    }
    if (activeChatUserId && activeChatPartner) {
      // 1. Direct ID match
      if (
        (m.senderId === currentUser.id && m.receiverId === activeChatUserId) ||
        (m.senderId === activeChatUserId && m.receiverId === currentUser.id)
      ) {
        return true;
      }

      // 2. Email matching (resilient across multiple browser devices)
      const myEmail = currentUser.email?.toLowerCase().trim();
      const partnerEmail = activeChatPartner.email?.toLowerCase().trim();
      const mSenderEmail = m.senderEmail?.toLowerCase().trim();
      const mReceiverEmail = m.receiverEmail?.toLowerCase().trim();

      if (myEmail && partnerEmail) {
        if (
          (mSenderEmail === myEmail && mReceiverEmail === partnerEmail) ||
          (mSenderEmail === partnerEmail && mReceiverEmail === myEmail)
        ) {
          return true;
        }
      }

      // 3. Name fallback matching (e.g. Altaf vs Shahil)
      const myName = currentUser.name?.toLowerCase().trim();
      const partnerName = activeChatPartner.name?.toLowerCase().trim();
      const mSenderName = m.senderName?.toLowerCase().trim();

      if (partnerName && myName && mSenderName) {
        const isFromPartner = mSenderName.includes(partnerName) || partnerName.includes(mSenderName);
        const isFromMe = mSenderName.includes(myName) || myName.includes(mSenderName);
        if (isFromPartner && (m.receiverId === currentUser.id || mReceiverEmail === myEmail)) {
          return true;
        }
        if (isFromMe && (m.receiverId === activeChatUserId || mReceiverEmail === partnerEmail)) {
          return true;
        }
      }

      return false;
    }
    return false;
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = evt.target?.result as string;
      if (res) {
        setSelectedImage(res);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedImage) return;

    sendChatMessage({
      receiverId: activeChatUserId || undefined,
      channelId: activeChannelId || undefined,
      content: messageInput.trim() || (selectedImage ? "📷 Image Attachment" : ""),
      imageUrl: selectedImage || undefined,
    });

    setMessageInput("");
    setSelectedImage(null);
    setShowEmojiPicker(false);
  };

  // Other users list (excluding self and excluding Admin accounts)
  const otherUsers = users.filter(
    (u) =>
      u.id !== currentUser.id &&
      u.role !== "admin" &&
      u.name?.toLowerCase() !== "admin" &&
      u.email?.toLowerCase() !== "admin@vudfit.com"
  );

  return (
    <>
      {/* Floating WhatsApp Action Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xl shadow-emerald-600/40 transition-all hover:scale-105 active:scale-95 group"
        title="Open Team Chat"
      >
        <div className="relative">
          <MessageCircle className="w-5 h-5 fill-white text-emerald-600 group-hover:rotate-12 transition-transform" />
          {totalUnreadCount > 0 ? (
            <span className="absolute -top-2.5 -right-2.5 min-w-[20px] h-[20px] px-1.5 bg-rose-500 text-white rounded-full text-[10px] font-black border-2 border-emerald-600 flex items-center justify-center animate-bounce shadow-md">
              {totalUnreadCount}
            </span>
          ) : (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-emerald-600 animate-ping" />
          )}
        </div>
        <span className="tracking-wide">Team Chat</span>
        {totalUnreadCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-white text-emerald-700 text-[11px] font-black shadow">
            {totalUnreadCount}
          </span>
        )}
      </button>

      {/* WhatsApp Modal / Drawer Dialog */}
      <AnimatePresence>
        {isChatOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/60 backdrop-blur-md"
            onClick={handleClose}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-5xl h-[94vh] sm:h-[85vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto"
            >
              {/* Left Column: Chat Contacts & Channels Sidebar */}
              <div
                className={cn(
                  "w-full md:w-80 border-r border-border bg-secondary/20 flex flex-col shrink-0 h-full",
                  hasActiveConversation ? "hidden md:flex" : "flex"
                )}
              >
                {/* Header */}
                <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white/40"
                    />
                    <div>
                      <h3 className="font-bold text-xs leading-tight flex items-center gap-1">
                        Team Chat
                      </h3>
                      <p className="text-[10px] text-emerald-100/80">Online as {currentUser.name}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                    title="Close Chat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="p-3 border-b border-border bg-card">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      placeholder="Search team members or channels..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                {/* Contacts & Channels Scroll List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                  {/* Department Group Channels */}
                  <div>
                    <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Department Group Channels
                    </span>
                    <div className="space-y-1">
                      {chatChannels.map((chan) => {
                        const isSelected = activeChannelId === chan.id;
                        return (
                          <button
                            key={chan.id}
                            onClick={() => setActiveChannel(chan.id)}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                              isSelected
                                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold"
                                : "hover:bg-secondary/60 text-foreground"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30">
                              #
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-semibold block truncate">
                                {chan.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                Team Department Channel
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Direct 1-on-1 Messages (Team Members) */}
                  <div>
                    <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Direct Messages ({otherUsers.length})
                    </span>
                    <div className="space-y-1">
                      {otherUsers.map((user) => {
                        const isSelected = activeChatUserId === user.id;
                        const userMessages = chatMessages.filter((m) => {
                          if (
                            (m.senderId === user.id && m.receiverId === currentUser.id) ||
                            (m.senderId === currentUser.id && m.receiverId === user.id)
                          ) {
                            return true;
                          }
                          const myEmail = currentUser.email?.toLowerCase().trim();
                          const uEmail = user.email?.toLowerCase().trim();
                          const mSEmail = m.senderEmail?.toLowerCase().trim();
                          const mREmail = m.receiverEmail?.toLowerCase().trim();
                          if (myEmail && uEmail) {
                            if (
                              (mSEmail === uEmail && mREmail === myEmail) ||
                              (mSEmail === myEmail && mREmail === uEmail)
                            ) {
                              return true;
                            }
                          }
                          return false;
                        });

                        const userLastMsg = userMessages[userMessages.length - 1];
                        const unreadCount = getUnreadCountForUser(user);

                        return (
                          <button
                            key={user.id}
                            onClick={() => {
                              setActiveChatUser(user.id);
                              markMessagesAsRead(user.id);
                            }}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                              isSelected
                                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold"
                                : "hover:bg-secondary/60 text-foreground"
                            }`}
                          >
                            <div className="relative shrink-0">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-9 h-9 rounded-full object-cover border border-emerald-500/40"
                              />
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card absolute bottom-0 right-0" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className={cn("text-xs truncate", unreadCount > 0 ? "font-bold text-foreground" : "font-semibold text-foreground")}>
                                  {user.name}
                                </span>
                                {userLastMsg && (
                                  <span className={cn("text-[10px] shrink-0 font-medium", unreadCount > 0 ? "text-emerald-500 font-bold" : "text-muted-foreground")}>
                                    {formatWhatsAppTime(userLastMsg.createdAt)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-1 mt-0.5">
                                <span className={cn("text-[11px] block truncate", unreadCount > 0 ? "text-foreground font-bold" : "text-muted-foreground")}>
                                  {userLastMsg ? userLastMsg.content : "Tap to start team chat"}
                                </span>
                                {unreadCount > 0 && (
                                  <span className="min-w-[19px] h-[19px] px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/40 animate-pulse">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Active Conversation Area */}
              <div
                className={cn(
                  "flex-1 flex flex-col bg-card h-full min-w-0",
                  !hasActiveConversation ? "hidden md:flex" : "flex"
                )}
              >
                {/* Active Chat Header */}
                <div className="p-3.5 border-b border-border bg-secondary/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Mobile Back to Contacts Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveChatUser(null);
                        setActiveChannel(null);
                      }}
                      className="md:hidden p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0 mr-0.5"
                      title="Back to Contacts"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    {activeChatPartner ? (
                      <>
                        <div className="relative">
                          <img
                            src={activeChatPartner.avatar}
                            alt={activeChatPartner.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500"
                          />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card absolute bottom-0 right-0" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <span>{activeChatPartner.name}</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              LAN Live
                            </span>
                          </h4>
                          <p className="text-[10px] text-muted-foreground">
                            {activeChatPartner.department || activeChatPartner.role.replace("_", " ")}
                          </p>
                        </div>
                      </>
                    ) : activeChannel ? (
                      <div>
                        <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                          <span>#{activeChannel.name}</span>
                        </h4>
                        <p className="text-[10px] text-muted-foreground">Department Team Channel</p>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Close Chat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Messages Stream Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]">
                  {currentConversationMessages.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                      <MessageSquare className="w-8 h-8 text-emerald-500/40 mx-auto" />
                      <p>No messages yet. Send a message to start team conversation!</p>
                    </div>
                  ) : (
                    currentConversationMessages.map((msg) => {
                      const isMe =
                        msg.senderId === currentUser.id ||
                        (msg.senderEmail && currentUser.email && msg.senderEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
                        (msg.senderName && currentUser.name && msg.senderName.toLowerCase().trim() === currentUser.name.toLowerCase().trim());
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {!isMe && (
                            <img
                              src={msg.senderAvatar}
                              alt={msg.senderName}
                              className="w-6 h-6 rounded-full object-cover border border-border mb-1"
                            />
                          )}

                          <div
                            className={`max-w-[75%] p-3 rounded-2xl text-xs space-y-1 shadow-sm ${
                              isMe
                                ? "bg-emerald-600 text-white rounded-br-none"
                                : "bg-card border border-border text-foreground rounded-bl-none"
                            }`}
                          >
                            {!isMe && (
                              <span className="font-bold text-[10px] text-emerald-500 block">
                                {msg.senderName}
                              </span>
                            )}

                            {/* PNG / Image Attachment Render */}
                            {msg.imageUrl && (
                              <div className="my-1 rounded-xl overflow-hidden border border-white/20 shadow-md">
                                <img
                                  src={msg.imageUrl}
                                  alt="Chat attachment"
                                  className="max-h-56 max-w-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                  onClick={() => window.open(msg.imageUrl, "_blank")}
                                />
                              </div>
                            )}

                            {msg.content && (
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}

                            <div
                              className={`flex items-center justify-end gap-1 text-[9px] pt-0.5 ${
                                isMe ? "text-emerald-100/80" : "text-muted-foreground"
                              }`}
                            >
                              <span>{formatTimeAgo(msg.createdAt)}</span>
                              {isMe && <CheckCheck className="w-3 h-3 text-sky-200" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Selected PNG/Image Attachment Preview Bar */}
                {selectedImage && (
                  <div className="px-4 py-2 bg-emerald-500/10 border-t border-emerald-500/30 flex items-center justify-between animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedImage}
                        alt="Selected attachment preview"
                        className="w-10 h-10 rounded-lg object-cover border border-emerald-500/40"
                      />
                      <div>
                        <span className="text-xs font-bold text-emerald-500 block flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" /> PNG / Image Attached
                        </span>
                        <span className="text-[10px] text-muted-foreground">Ready to send in chat</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-500 transition-colors"
                      title="Remove Attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Emoji Picker Popover Box */}
                {showEmojiPicker && (
                  <div className="p-3 border-t border-border bg-card/95 backdrop-blur-md grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto animate-in slide-in-from-bottom-2 duration-150">
                    {EMOJI_LIST.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMessageInput((prev) => prev + emoji);
                        }}
                        className="text-lg p-1.5 rounded-lg hover:bg-secondary transition-transform hover:scale-125 text-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Message Input Box with Emoji & Image Attachment Controls */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex items-center gap-2 relative">
                  {/* PNG/Image Attachment File Picker Button */}
                  <label
                    htmlFor="chat-image-file-input"
                    className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-emerald-500 transition-colors cursor-pointer shrink-0"
                    title="Attach PNG / Image File"
                  >
                    <Paperclip className="w-4 h-4" />
                    <input
                      id="chat-image-file-input"
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>

                  {/* Emoji Picker Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 rounded-xl transition-colors shrink-0 ${
                      showEmojiPicker
                        ? "bg-amber-500/20 text-amber-500 font-bold"
                        : "hover:bg-secondary text-muted-foreground hover:text-amber-500"
                    }`}
                    title="Insert Emojis"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Message ${
                      activeChatPartner ? activeChatPartner.name : activeChannel?.name || "team..."
                    }`}
                    className="flex-1 px-4 py-2 rounded-xl border border-border bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />

                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 shrink-0"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
