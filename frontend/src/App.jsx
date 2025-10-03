import { useState } from 'react';

function App() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            const res = await fetch('http://localhost:8080/api/ollama/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input }),
            });

            if (!res.ok) throw new Error('Errore nel contattare il backend');

            const data = await res.text();

            const modelMessage = { sender: 'model', text: data };
            setMessages(prev => [...prev, modelMessage]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { sender: 'error', text: 'Errore durante la comunicazione con il modello.' }]);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Chat</h1>
            <div
                style={{
                    height: '400px',
                    width: '100%',
                    border: '1px solid #ccc',
                    overflowY: 'scroll',
                    padding: '10px',
                    marginBottom: '10px',
                }}
            >
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className="message"
                        style={{
                            color: msg.sender === 'user' ? 'blue' : msg.sender === 'model' ? 'green' : 'red',
                            marginBottom: '10px',
                        }}
                    >
                        <strong>{msg.sender === 'user' ? 'Tu: ' : msg.sender === 'model' ? 'Modello: ' : 'Errore: '}</strong>
                        {msg.text}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Scrivi un messaggio..."
                style={{ width: '70%', padding: '8px' }}
            />
            <button onClick={sendMessage} style={{ padding: '8px 15px' }}>
                Invia
            </button>
        </div>
    );
}

export default App;