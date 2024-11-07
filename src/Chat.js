import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { twilight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ChatComponent = () => {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hi, how can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [savedMessageId, setSavedMessageId] = useState(null); // To track the saved message
    const [savedContext, setSavedContext] = useState(''); // State to store saved context
    const messagesEndRef = useRef(null); // Create a ref for auto-scrolling

    // Scroll to the latest message when the messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom(); // Call scrollToBottom whenever messages change
    }, [messages]); // This effect will run whenever `messages` is updated

    // Function to append new messages to the chat
    const appendMessage = (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    // Save the context when the "Save Context" button is clicked
    const saveContext = (text, index) => {
        if (!savedContext) { // Only save if there is no context already saved
            setSavedContext(text);
            setSavedMessageId(index); // Save the ID of the message where context is saved
        }
    };

    // Handle form submission to send a message
    const handleSubmit = async (e) => {
        e.preventDefault();

        const userMessage = input;
        appendMessage({ sender: 'user', text: userMessage });
        setInput('');
        setLoading(true);

        // If there's saved context, prepend it to the user message
        const prompt = savedContext ? `"${savedContext}", ${userMessage}` : userMessage;

        try {
            const response = await axios.post('https://api.cohere.ai/v1/generate', {
                prompt: prompt,
                max_tokens: 1000,
                model: 'command-xlarge-nightly',
                temperature: 0.7,
            }, {
                headers: {
                    'Authorization': `Bearer gDfZncDRH2Ow4jlG6Kiqcv0ED5JbfuKLKhVrQPqD`,
                    'Content-Type': 'application/json',
                }
            });

            const botMessage = response.data.generations[0].text.trim();
            appendMessage({ sender: 'bot', text: botMessage });
            setSavedContext('');
        } catch (error) {
            console.error("Error fetching data from Cohere:", error);
            appendMessage({ sender: 'bot', text: "Sorry, I couldn't respond to that." });
        } finally {
            setLoading(false);
        }
    };

    // Function to parse the message and format code blocks separately
    const parseMessage = (message) => {
        const codeBlockRegex = /```([\s\S]+?)```/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        let blockIndex = 0;

        while ((match = codeBlockRegex.exec(message)) !== null) {
            if (match && match[1]) {
                if (match.index > lastIndex) {
                    const textBeforeCode = message.slice(lastIndex, match.index);
                    parts.push(
                        <span key={lastIndex}>
                            {textBeforeCode.split('\n').map((line, i) => (
                                <React.Fragment key={i}>
                                    {line}
                                    <br />
                                </React.Fragment>
                            ))}
                        </span>
                    );
                }

                const blockTag = `code-block-${blockIndex}`;
                parts.push(
                    <div key={match.index} className="code-block-container" id={blockTag}>
                        <CopyButton blockTag={blockTag} />
                        <SyntaxHighlighter language="python" style={twilight}>
                            {match[1].trim()}
                        </SyntaxHighlighter>
                    </div>
                );

                lastIndex = codeBlockRegex.lastIndex;
                blockIndex++;
            }
        }

        if (lastIndex < message.length) {
            const remainingText = message.slice(lastIndex);
            parts.push(
                <span key={lastIndex}>
                    {remainingText.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            <br />
                        </React.Fragment>
                    ))}
                </span>
            );
        }

        return parts;
    };

    // Copy button component
    const CopyButton = ({ blockTag }) => {
        const [isCopied, setIsCopied] = useState(false);

        const handleCopy = () => {
            const block = document.getElementById(blockTag);
            if (block) {
                const codeBlock = block.querySelector('pre');
                if (codeBlock) {
                    const text = codeBlock.textContent || codeBlock.innerText;
                    navigator.clipboard.writeText(text)
                        .then(() => {
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                        })
                        .catch((error) => {
                            console.error("Error copying code: ", error);
                            alert("Failed to copy code.");
                        });
                }
            }
        };

        return (
            <button className="copy-button" onClick={handleCopy}>
                {isCopied ? 'Copied' : 'Copy Code'}
            </button>
        );
    };

    const renderMessages = () => {
        return messages.map((message, index) => (
            <div
                key={index}
                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
                <strong>{message.sender === 'user' ? 'You: ' : ''}</strong>
                {message.sender === 'bot' ? (
                    <>
                        {parseMessage(message.text)}
                        <button
                            className="save-context-button"
                            onClick={() => saveContext(message.text, index)}
                        >
                            {savedMessageId === index ? 'Saved' : 'Save Context'} {/* Change button text */}
                        </button>
                    </>
                ) : (
                    message.text
                )}
            </div>
        ));
    };

    return (
        <div className="chat-container">
            <div className='head'>
            <h3>TestBot</h3>
                <lottie-player
                src="https://lottie.host/ee444fb9-0dc0-4e61-a000-f64dbb4ec06b/lluvKlxBJj.json"
                background="transparent"
                speed="1"
                style={{ width: '80px', height: '80px' }}
                loop
                autoplay
            ></lottie-player>
            </div>
            
            <div className="messages-container">
                {renderMessages()}
                {loading && (
                    <div className="message bot-message">
                        <lottie-player
                            src="https://lottie.host/d802d167-d470-4071-b3db-19b0a8b89d8a/vKKsvifO0d.json"
                            background="transparent"
                            speed="1"
                            style={{ width: '140px', height: '80px' }}
                            loop
                            autoplay
                        ></lottie-player>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message here"
                    disabled={loading}
                    autoCorrect="on" // Enable auto-correct
                    spellCheck="true" // Enable spell check
                />
                <button type="submit" disabled={loading || !input}>
                    {loading ? 'Loading...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default ChatComponent;
