import { useState, useRef, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8080/api';

const LABELS = { user: '👤 Tu', model: '🤖 Modello', error: '⚠️ Errore' };
const BUBBLE_CLASS = { user: 'bubble bubble-user', model: 'bubble bubble-model', error: 'bubble bubble-error' };

function App() {
    const [mode, setMode]               = useState('chat');
    const [input, setInput]             = useState('');
    const [messages, setMessages]       = useState([]);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSending, setIsSending]     = useState(false);
    const fileInputRef  = useRef(null);
    const messagesEndRef = useRef(null);

    /* Scroll automatico all'ultimo messaggio */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    const sendMessage = async () => {
        if (!input.trim() || isSending) return;
        const userText = input.trim();
        setMessages(prev => [...prev, { sender: 'user', text: userText }]);
        setInput('');
        setIsSending(true);

        const endpoint = mode === 'rag'
            ? `${API_BASE}/rag/ask`
            : `${API_BASE}/ollama/ask`;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: userText }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.text();
            setMessages(prev => [...prev, { sender: 'model', text: data }]);
        } catch (err) {
            setMessages(prev => [...prev, { sender: 'error', text: `Errore: ${err.message}` }]);
        } finally {
            setIsSending(false);
        }
    };

    const uploadFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        setUploadStatus(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_BASE}/rag/ingest`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.status === 'success') {
                setUploadStatus({ ok: true, msg: `✅ "${data.filename}" indicizzato — ${data.chunks} chunk salvati` });
            } else {
                setUploadStatus({ ok: false, msg: `❌ ${data.message}` });
            }
        } catch (err) {
            setUploadStatus({ ok: false, msg: `❌ Errore durante l'upload: ${err.message}` });
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="app-wrapper">

            {/* ── Card principale ── */}
            <div className="card chat-card">

                {/* Header */}
                <div className="card-header">
                    <h1>🤖 Spring AI — RAG Pipeline</h1>
                </div>

                <div className="card-body p-4">

                    {/* ── Toggle modalità ── */}
                    <div className="d-flex gap-2 mb-4">
                        <button
                            className={`btn mode-pill ${mode === 'chat' ? 'btn-primary active' : 'btn-outline-secondary'}`}
                            onClick={() => setMode('chat')}
                        >
                            💬 Chat Normale
                        </button>
                        <button
                            className={`btn mode-pill ${mode === 'rag' ? 'btn-primary active' : 'btn-outline-secondary'}`}
                            onClick={() => setMode('rag')}
                        >
                            📚 Chat RAG
                        </button>
                    </div>

                    {/* ── Upload box (solo RAG) ── */}
                    {mode === 'rag' && (
                        <div className="card upload-box p-3 mb-4">
                            <p className="upload-label">
                                📎 Carica un documento per indicizzarlo (PDF, DOCX, TXT, HTML…)
                            </p>
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={uploadFile}
                                    className="d-none"
                                    accept=".pdf,.docx,.doc,.txt,.html,.md,.odt"
                                />
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => fileInputRef.current.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? '⏳ Indicizzazione…' : '📂 Scegli file'}
                                </button>
                                {uploadStatus && (
                                    <span className={`small fw-semibold ${uploadStatus.ok ? 'text-success' : 'text-danger'}`}>
                                        {uploadStatus.msg}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Area messaggi ── */}
                    <div className="messages-area mb-3">
                        {messages.length === 0 ? (
                            <p className="chat-placeholder">
                                {mode === 'rag'
                                    ? '📄 Carica un documento, poi fai una domanda sul suo contenuto.'
                                    : '💬 Scrivi un messaggio per iniziare la conversazione.'}
                            </p>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={`${BUBBLE_CLASS[msg.sender]} mb-2`}>
                                    <span className="bubble-label">{LABELS[msg.sender]}</span>
                                    {msg.text}
                                </div>
                            ))
                        )}
                        {isSending && (
                            <div className="typing-indicator">⏳ Il modello sta elaborando…</div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* ── Input + Invia ── */}
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder={mode === 'rag'
                                ? 'Fai una domanda sul documento indicizzato…'
                                : 'Scrivi un messaggio…'}
                            disabled={isSending}
                        />
                        <button
                            className="btn btn-primary send-btn"
                            onClick={sendMessage}
                            disabled={isSending}
                        >
                            {isSending ? (
                                <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" /> Invio…</>
                            ) : 'Invia ➤'}
                        </button>
                    </div>

                    {/* ── Badge modalità ── */}
                    <p className="mode-badge mt-3 mb-0">
                        Modalità attiva:{' '}
                        <strong>
                            {mode === 'rag'
                                ? '📚 RAG (PGVector + nomic-embed-text + qwen3:8b)'
                                : '💬 Chat diretta (qwen3:8b)'}
                        </strong>
                    </p>

                </div>
            </div>
        </div>
    );
}

export default App;

