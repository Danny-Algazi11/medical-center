import { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./styles/Layout.css";
import "./styles/Messages.css";

/* ── Mock data ─────────────────────────────────────────── */
const CURRENT_USER = {
  name: "Dr. Ahmad",
  role: "Doctor Portal",
  initials: "DA",
};

const TABS = [
  { to: "/dashboard", label: "Doctor Portal" },
  { to: "/reception", label: "Reception" },
  { to: "/analytics", label: "Analytics" },
];

const THREADS = [
  {
    id: 1,
    name: "Eleanor Shellstrop",
    initials: "ES",
    time: "10:30 AM",
    preview: "Regarding the lab reports from yesterday...",
    tag: { label: "UPCOMING TODAY", type: "upcoming" },
    unread: 2,
    meta: { upcoming: "Follow-up @ 2:00 PM", lastVisit: "Oct 24" },
    messages: [
      {
        id: 1,
        from: "patient",
        text: "Doctor, I've attached the x-ray results from the imaging center. Can you take a look before our call today?",
        time: "10:28 AM",
        type: "text",
      },
      {
        id: 2,
        from: "patient",
        type: "image",
        filename: "chest_scan_02.png",
        time: "10:29 AM",
      },
      {
        id: 3,
        from: "doctor",
        text: "Hello Eleanor, I'm reviewing them now. The alignment looks much better than last month. I'll also need the formal report from the radiologist.",
        time: "10:45 AM",
        type: "text",
      },
      {
        id: 4,
        from: "patient",
        type: "file",
        filename: "Lab_Report_Full.pdf",
        size: "2.4 MB",
        time: "10:52 AM",
      },
    ],
  },
  {
    id: 2,
    name: "Michael Realman",
    initials: "MR",
    time: "09:15 AM",
    preview: "The prescription was sent to the ph...",
    tag: { label: "FOLLOW-UP TOMORROW", type: "followup" },
    unread: 0,
    meta: { upcoming: "Follow-up tomorrow", lastVisit: "Oct 20" },
    messages: [
      {
        id: 1,
        from: "doctor",
        text: "Good morning Michael. I've sent the updated prescription to your pharmacy. It should be ready by noon.",
        time: "09:10 AM",
        type: "text",
      },
      {
        id: 2,
        from: "patient",
        text: "The prescription was sent to the pharmacy. Thank you so much, doctor!",
        time: "09:15 AM",
        type: "text",
      },
      {
        id: 3,
        from: "doctor",
        text: "You're welcome. Please remember to take it with food. See you tomorrow.",
        time: "09:18 AM",
        type: "text",
      },
    ],
  },
  {
    id: 3,
    name: "Janet Porter",
    initials: "JP",
    time: "Yesterday",
    preview: "Thank you for your help, doctor.",
    tag: { label: "LAST VISIT: MAY 20", type: "last-visit" },
    unread: 0,
    meta: { upcoming: null, lastVisit: "May 20" },
    messages: [
      {
        id: 1,
        from: "patient",
        text: "Doctor, I wanted to check in. The new medication seems to be working well.",
        time: "Yesterday",
        type: "text",
      },
      {
        id: 2,
        from: "doctor",
        text: "That's great to hear, Janet! Keep monitoring your blood pressure daily and log the readings.",
        time: "Yesterday",
        type: "text",
      },
      {
        id: 3,
        from: "patient",
        text: "Thank you for your help, doctor.",
        time: "Yesterday",
        type: "text",
      },
    ],
  },
];

const QUICK_REPLIES = [
  "Schedule follow-up",
  "Results are ready",
  "Continue medication",
  "Send Appointment Link",
];

/* ── Message bubble ────────────────────────────────────── */
function MessageBubble({ msg }) {
  const sent = msg.from === "doctor";

  if (msg.type === "image") {
    return (
      <div className={`msg-row${sent ? " sent" : ""}`}>
        {!sent && <div className="msg-avatar">ES</div>}
        <div>
          <div className="msg-image">
            <div className="msg-image-placeholder">
              <i className="ti ti-x-ray" aria-hidden="true" />
            </div>
            <div className="msg-image-footer">
              <span>{msg.filename}</span>
              <button className="icon-btn" aria-label="Download">
                <i className="ti ti-download" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className={`msg-time${sent ? " sent" : ""}`}>{msg.time}</div>
        </div>
        {sent && <div className="msg-avatar doctor">DA</div>}
      </div>
    );
  }

  if (msg.type === "file") {
    return (
      <div className={`msg-row${sent ? " sent" : ""}`}>
        {!sent && <div className="msg-avatar">ES</div>}
        <div>
          <div className="msg-file">
            <div className="msg-file-icon">
              <i className="ti ti-file-type-pdf" aria-hidden="true" />
            </div>
            <div>
              <div className="msg-file-name">{msg.filename}</div>
              <div className="msg-file-size">{msg.size}</div>
            </div>
            <button className="icon-btn" aria-label="Download">
              <i className="ti ti-download" aria-hidden="true" />
            </button>
          </div>
          <div className={`msg-time${sent ? " sent" : ""}`}>{msg.time}</div>
        </div>
        {sent && <div className="msg-avatar doctor">DA</div>}
      </div>
    );
  }

  return (
    <div className={`msg-row${sent ? " sent" : ""}`}>
      {!sent && (
        <div className="msg-avatar">
          {THREADS.find((t) => t.messages.includes(msg))?.initials || "P"}
        </div>
      )}
      <div>
        <div className={`msg-bubble${sent ? " sent" : " received"}`}>
          {msg.text}
        </div>
        <div className={`msg-time${sent ? " sent" : ""}`}>{msg.time}</div>
      </div>
      {sent && <div className="msg-avatar doctor">DA</div>}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────── */
export default function MessagesPage() {
  const [activeThread, setActiveThread] = useState(THREADS[0]);
  const [inboxFilter, setInboxFilter] = useState("All");
  const [input, setInput] = useState("");
  const [threads, setThreads] = useState(THREADS);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread]);

  function sendMessage() {
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now(),
      from: "doctor",
      text: input.trim(),
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "text",
    };
    const updated = threads.map((t) =>
      t.id === activeThread.id
        ? { ...t, messages: [...t.messages, newMsg], preview: newMsg.text }
        : t,
    );
    setThreads(updated);
    setActiveThread(updated.find((t) => t.id === activeThread.id));
    setInput("");
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleQuickReply(text) {
    setInput(text);
  }

  const current = threads.find((t) => t.id === activeThread.id);

  return (
    <div className="layout-shell">
      <Sidebar user={CURRENT_USER} />

      <div className="layout-main">
        <Topbar
          user={CURRENT_USER}
          tabs={TABS}
          searchPlaceholder="Search patients..."
        />

        {/* Full-height messages layout — no page-content padding */}
        <div className="messages-layout">
          {/* ── Inbox panel ── */}
          <div className="inbox-panel">
            <div className="inbox-header">
              <div className="inbox-title-row">
                <span className="inbox-title">Inbox</span>
                <span className="inbox-badge">12 Active</span>
              </div>
              <div className="inbox-filter-tabs">
                {["All", "Unread", "Follow-up"].map((f) => (
                  <button
                    key={f}
                    className={`inbox-filter-tab${inboxFilter === f ? " active" : ""}`}
                    onClick={() => setInboxFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="inbox-list">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={`inbox-thread${activeThread.id === thread.id ? " active" : ""}`}
                  onClick={() => setActiveThread(thread)}
                >
                  <div className="thread-avatar">{thread.initials}</div>
                  <div className="thread-body">
                    <div className="thread-top">
                      <span className="thread-name">{thread.name}</span>
                      <span className="thread-time">{thread.time}</span>
                    </div>
                    <div className="thread-preview">{thread.preview}</div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span className={`thread-tag ${thread.tag.type}`}>
                        {thread.tag.label}
                      </span>
                      {thread.unread > 0 && (
                        <span className="thread-unread">{thread.unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Chat panel ── */}
          <div className="chat-panel">
            {/* Chat topbar */}
            <div className="chat-topbar">
              <div className="chat-patient-info">
                <div className="chat-patient-avatar">{current.initials}</div>
                <div>
                  <div className="chat-patient-name">{current.name}</div>
                  <div className="chat-patient-meta">
                    {current.meta.upcoming && (
                      <span className="chat-meta-item">
                        <i
                          className="ti ti-calendar-event"
                          aria-hidden="true"
                        />
                        Upcoming: {current.meta.upcoming}
                      </span>
                    )}
                    <span className="chat-meta-item">
                      <i className="ti ti-clock" aria-hidden="true" />
                      Last Visit: {current.meta.lastVisit}
                    </span>
                  </div>
                </div>
              </div>
              <div className="chat-topbar-actions">
                <button className="chat-action-btn">
                  <i className="ti ti-user" aria-hidden="true" />
                  Patient Profile
                </button>
                <button className="chat-action-btn">
                  <i className="ti ti-file-medical" aria-hidden="true" />
                  Medical Records
                </button>
                <button className="chat-action-btn dark">
                  <i className="ti ti-player-play" aria-hidden="true" />
                  Open Workflow
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              <div className="chat-date-divider">Yesterday, Oct 24</div>

              {current.messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            <div className="quick-replies">
              {QUICK_REPLIES.map((r) => (
                <button
                  key={r}
                  className="quick-reply"
                  onClick={() => handleQuickReply(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Compose */}
            <div className="compose-bar">
              <button className="compose-attach" aria-label="Attach file">
                <i className="ti ti-paperclip" aria-hidden="true" />
              </button>
              <input
                className="compose-input"
                type="text"
                placeholder="Type a secure medical message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <div className="compose-icons">
                <button className="compose-attach" aria-label="Emoji">
                  <i className="ti ti-mood-smile" aria-hidden="true" />
                </button>
              </div>
              <button
                className="compose-send"
                onClick={sendMessage}
                aria-label="Send message"
              >
                <i className="ti ti-send" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
