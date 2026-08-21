import { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import {
  getConsultations,
  getConsultationMessages,
  sendConsultationMessage,
  markConsultationRead,
} from "../api/Consultations";
import "./styles/Layout.css";
import "./styles/Messages.css";

const QUICK_REPLIES = [
  "Schedule follow-up",
  "Results are ready",
  "Continue medication",
  "Send Appointment Link",
];

// Polling instead of a real-time socket connection — matches the REST-only
// chat backend (no websocket/Firestore transport). Good enough for a chat
// that isn't expected to feel instant on both tabs at once.
const POLL_INTERVAL_MS = 8000;

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Message bubble ────────────────────────────────────── */
function MessageBubble({ msg, sent, otherInitials, selfInitials }) {
  return (
    <div className={`msg-row${sent ? " sent" : ""}`}>
      {!sent && <div className="msg-avatar">{otherInitials}</div>}
      <div>
        <div className={`msg-bubble${sent ? " sent" : " received"}`}>
          {msg.content}
        </div>
        <div className={`msg-time${sent ? " sent" : ""}`}>
          {formatTime(msg.created_at)}
        </div>
      </div>
      {sent && <div className="msg-avatar doctor">{selfInitials}</div>}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────── */
export default function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inboxFilter, setInboxFilter] = useState("All");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const CURRENT_USER = {
    name: user?.full_name || "",
    role: user?.role === "doctor" ? "Doctor Portal" : "Reception",
    initials: initialsOf(user?.full_name),
  };

  const TABS = [
    { to: "/dashboard", label: "Doctor Portal" },
    { to: "/reception", label: "Reception" },
    { to: "/analytics", label: "Analytics" },
  ];

  const activeThread = threads.find((th) => th.id === activeThreadId) || null;

  const loadInbox = useCallback(async () => {
    const res = await getConsultations();
    const list = res.data.data || [];
    setThreads(list);
    return list;
  }, []);

  const loadMessages = useCallback(async (appointmentId) => {
    const res = await getConsultationMessages(appointmentId);
    setMessages(res.data.data || []);
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const list = await loadInbox();
        if (list.length > 0) setActiveThreadId(list[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadInbox]);

  // Load messages + mark read whenever the active thread changes
  useEffect(() => {
    if (!activeThread) return;
    loadMessages(activeThread.appointment_id);
    markConsultationRead(activeThread.appointment_id).then(() => {
      setThreads((prev) =>
        prev.map((th) =>
          th.id === activeThread.id ? { ...th, unread_count: 0 } : th,
        ),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThread?.id]);

  // Poll for new messages on the open thread + refresh the inbox list
  useEffect(() => {
    const interval = setInterval(() => {
      loadInbox();
      if (activeThread) loadMessages(activeThread.appointment_id);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeThread, loadInbox, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !activeThread || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    try {
      const res = await sendConsultationMessage(
        activeThread.appointment_id,
        content,
      );
      setMessages((prev) => [...prev, res.data.data]);
      setThreads((prev) =>
        prev.map((th) =>
          th.id === activeThread.id
            ? {
                ...th,
                last_message: {
                  content,
                  sender_role: user?.role,
                  created_at: res.data.data.created_at,
                },
              }
            : th,
        ),
      );
    } catch {
      setInput(content); // put it back so nothing is silently lost
    } finally {
      setSending(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const visibleThreads =
    inboxFilter === "Unread"
      ? threads.filter((th) => th.unread_count > 0)
      : threads;

  if (loading) {
    return (
      <div className="layout-shell">
        <Sidebar user={CURRENT_USER} />
        <div className="layout-main">
          <Topbar
            user={CURRENT_USER}
            tabs={TABS}
            searchPlaceholder={t("topbar.searchDefault")}
          />
          <div style={{ padding: 40, textAlign: "center" }}>
            {t("messages.loading") || "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-shell">
      <Sidebar user={CURRENT_USER} />

      <div className="layout-main">
        <Topbar
          user={CURRENT_USER}
          tabs={TABS}
          searchPlaceholder={t("topbar.searchDefault")}
        />

        <div className="messages-layout">
          {/* ── Inbox panel ── */}
          <div className="inbox-panel">
            <div className="inbox-header">
              <div className="inbox-title-row">
                <span className="inbox-title">{t("messages.inbox")}</span>
                <span className="inbox-badge">
                  {threads.length} {t("messages.all")}
                </span>
              </div>
              <div className="inbox-filter-tabs">
                {[
                  { value: "All", label: t("messages.all") },
                  { value: "Unread", label: t("messages.unread") },
                ].map((f) => (
                  <button
                    key={f.value}
                    className={`inbox-filter-tab${inboxFilter === f.value ? " active" : ""}`}
                    onClick={() => setInboxFilter(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="inbox-list">
              {visibleThreads.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", opacity: 0.6 }}>
                  {t("messages.noConversations") || "No conversations yet."}
                </div>
              )}
              {visibleThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={`inbox-thread${activeThreadId === thread.id ? " active" : ""}`}
                  onClick={() => setActiveThreadId(thread.id)}
                >
                  <div className="thread-avatar">
                    {initialsOf(thread.other_party?.name)}
                  </div>
                  <div className="thread-body">
                    <div className="thread-top">
                      <span className="thread-name">
                        {thread.other_party?.name || "—"}
                      </span>
                      <span className="thread-time">
                        {formatTime(thread.last_message?.created_at)}
                      </span>
                    </div>
                    <div className="thread-preview">
                      {thread.last_message?.content || ""}
                    </div>
                    {thread.unread_count > 0 && (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <span className="thread-unread">
                          {thread.unread_count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Chat panel ── */}
          <div className="chat-panel">
            {!activeThread ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.6,
                }}
              >
                {t("messages.noConversations") || "No conversations yet."}
              </div>
            ) : (
              <>
                <div className="chat-topbar">
                  <div className="chat-patient-info">
                    <div className="chat-patient-avatar">
                      {initialsOf(activeThread.other_party?.name)}
                    </div>
                    <div>
                      <div className="chat-patient-name">
                        {activeThread.other_party?.name || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="chat-messages">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      sent={msg.sender_id === user?.id}
                      otherInitials={initialsOf(activeThread.other_party?.name)}
                      selfInitials={CURRENT_USER.initials}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="quick-replies">
                  {QUICK_REPLIES.map((r) => (
                    <button
                      key={r}
                      className="quick-reply"
                      onClick={() => setInput(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="compose-bar">
                  <input
                    className="compose-input"
                    type="text"
                    placeholder={t("messages.messagePlaceholder")}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    disabled={sending}
                  />
                  <button
                    className="compose-send"
                    onClick={handleSend}
                    aria-label="Send message"
                    disabled={sending}
                  >
                    <i className="ti ti-send" aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
