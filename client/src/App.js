import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [conversation, setConversation] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'zh-CN'; // Chinese

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      handleSpeechResult(spokenText);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleSpeechResult = async (spokenText) => {
    console.log('User said:', spokenText);
    setConversation(prev => [...prev, { type: 'user', text: spokenText }]);
    setIsProcessing(true);
    
    try {
      const response = await axios.post('http://localhost:3001/api/chat', {
        message: spokenText
      });
      
      const botResponse = response.data.message;
      setConversation(prev => [...prev, { type: 'bot', text: botResponse }]);
      
      // Use native text-to-speech
      speakText(botResponse);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = '抱歉，我没听清楚。请再说一遍。';
      setConversation(prev => [...prev, { type: 'bot', text: errorMsg }]);
      speakText(errorMsg);
    }
    
    setIsProcessing(false);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="App">
      <h1>
        智能陪伴 AI Companion
        <div className="subtitle">Elderly Care AI Assistant</div>
      </h1>
      
      <button 
        className={`talk-button ${isListening ? 'listening' : ''}`}
        onClick={startListening}
        disabled={isProcessing || isListening}
      >
        <div className="button-text">
          {isListening ? '🎤 正在听...' : 
           isProcessing ? '⏳ 思考中...' : 
           '🗣️ 开始对话'}
        </div>
        <div className="button-subtitle">
          {isListening ? 'Listening...' : 
           isProcessing ? 'Thinking...' : 
           'Start Talking'}
        </div>
      </button>
      
      {isListening && (
        <button className="stop-button" onClick={stopListening}>
          <div>⏹️ 停止</div>
          <div className="button-subtitle">Stop</div>
        </button>
      )}
      
      <div className="conversation">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            <strong>{msg.type === 'user' ? '您 (You): ' : 'AI陪伴 (AI Companion): '}</strong>
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;