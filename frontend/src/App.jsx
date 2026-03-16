import { useState, useRef } from 'react';

const API_BASE = 'http://localhost:8080/api';

function App() {
    const [mode, setMode] = useState('chat');        // 'chat' | 'rag'
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef(null);

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

    /* ── stili inline ─────────────────────────────────────────────── */
    const pill = (active) => ({
        padding: '8px 22px',
        background: active ? '#2563eb' : '#e5e7eb',
        color: active ? '#fff' : '#374151',
        border: 'none',
        borderRadius: '999px',
        cursor: 'pointer',
        fontWeight: active ? '700' : '400',
        fontSize: '14px',
        transition: 'background 0.2s',
    });

    const bubble = {
        user:  { background: '#dbeafe', color: '#1e3a8a' },
        model: { background: '#dcfce7', color: '#14532d' },
        error: { background: '#fee2e2', color: '#991b1b' },
    };

    const label = { user: '👤 Tu', model: '🤖 Modello', error: '⚠️ Errore' };

    return (
        <div style={{ maxWidth: '820px', margin: '32px auto', padding: '24px', fontFamily: 'Arial, sans-serif' }}>

            <h1 style={{ marginBottom: '24px', fontSize: '22px' }}>🤖 Spring AI — RAG Pipeline</h1>

            {/* ── toggle modalità ── */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button style={pill(mode === 'chat')} onClick={() => setMode('chat')}>
                    💬 Chat Normale
                </button>
                <button style={pill(mode === 'rag')} onClick={() => setMode('rag')}>
                    📚 Chat RAG
                </button>
            </div>

            {/* ── area upload (solo in modalità RAG) ── */}
            {mode === 'rag' && (
                <div style={{
                    background: '#f0f9ff',
                    border: '1.5px dashed #60a5fa',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    marginBottom: '18px',
                }}>
                    <p style={{ margin: '0 0 10px', color: '#1e40af', fontWeight: '700', fontSize: '14px' }}>
                        📎 Carica un documento per indicizzarlo (PDF, DOCX, TXT, HTML…)
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={uploadFile}
                            style={{ display: 'none' }}
                            accept=".pdf,.docx,.doc,.txt,.html,.md,.odt"
                        />
                        <button
                            onClick={() => fileInputRef.current.click()}
                            disabled={isUploading}
                            style={{
                                padding: '8px 18px',
                                background: isUploading ? '#93c5fd' : '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '7px',
                                cursor: isUploading ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                            }}
                        >
                            {isUploading ? '⏳ Indicizzazione…' : '📂 Scegli file'}
                        </button>
                        {uploadStatus && (
                            <span style={{ fontSize: '13px', color: uploadStatus.ok ? '#16a34a' : '#dc2626' }}>
                                {uploadStatus.msg}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* ── messaggi ── */}
            <div style={{
                height: '420px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                overflowY: 'auto',
                padding: '16px',
                marginBottom: '16px',
                background: '#f9fafb',
            }}>
                {messages.length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '160px', fontSize: '14px' }}>
                        {mode === 'rag'
                            ? '📄 Carica un documento, poi fai una domanda sul suo contenuto.'
                            : '💬 Scrivi un messaggio per iniziare la conversazione.'}
                    </p>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} style={{
                            marginBottom: '12px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            maxWidth: '85%',
                            marginLeft: msg.sender === 'user' ? 'auto' : '0',
                            ...bubble[msg.sender],
                        }}>
                            <strong style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                                {label[msg.sender]}
                            </strong>
                            <span style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                        </div>
                    ))
                )}
                {isSending && (
                    <div style={{ padding: '10px 14px', color: '#6b7280', fontSize: '13px' }}>
                        ⏳ Il modello sta elaborando…
                    </div>
                )}
            </div>

            {/* ── input ── */}
            <div style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={mode === 'rag'
                        ? 'Fai una domanda sul documento indicizzato…'
                        : 'Scrivi un messaggio…'}
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                    }}
                />
                <button
                    onClick={sendMessage}
                    disabled={isSending}
                    style={{
                        padding: '10px 24px',
                        background: isSending ? '#93c5fd' : '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isSending ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '14px',
                    }}
                >
                    Invia
                </button>
            </div>

            <p style={{ marginTop: '14px', fontSize: '11px', color: '#9ca3af' }}>
                Modalità attiva: <strong>{mode === 'rag' ? '📚 RAG (PGVector + nomic-embed-text + qwen3:8b)' : '💬 Chat diretta (qwen3:8b)'}</strong>
            </p>
        </div>
    );
}

export default App;

