import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [conversation, setConversation] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [language, setLanguage] = useState('chinese'); // 'chinese' or 'english'
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Language-specific content
  const content = {
    chinese: {
      title: '智能陪伴',
      subtitle: '老年人护理AI助手',
      startTalking: '🗣️ 开始对话',
      startTalkingSub: 'Start Talking',
      listening: '🎤 正在听...',
      listeningSub: 'Listening...',
      thinking: '⏳ 思考中...',
      thinkingSub: 'Thinking...',
      stop: '⏹️ 停止',
      stopSub: 'Stop',
      hideChat: '隐藏对话',
      showChat: '显示对话',
      clearChat: '清空对话',
      placeholder: '在这里输入中文消息...',
      send: '发送',
      emptyChat: '开始和AI陪伴聊天吧！',
      you: '您',
      aiCompanion: 'AI陪伴',
      speechLang: 'zh-CN',
      voiceLang: 'zh-CN'
    },
    english: {
      title: 'AI Companion',
      subtitle: 'Elderly Care AI Assistant',
      startTalking: '🗣️ Start Talking',
      startTalkingSub: '开始对话',
      listening: '🎤 Listening...',
      listeningSub: '正在听...',
      thinking: '⏳ Thinking...',
      thinkingSub: '思考中...',
      stop: '⏹️ Stop',
      stopSub: '停止',
      hideChat: 'Hide Chat',
      showChat: 'Show Chat',
      clearChat: 'Clear Chat',
      placeholder: 'Type your message here...',
      send: 'Send',
      emptyChat: 'Start chatting with your AI companion!',
      you: 'You',
      aiCompanion: 'AI Companion',
      speechLang: 'en-US',
      voiceLang: 'en-US'
    }
  };

  const currentContent = content[language];

  // Detect if text is primarily Chinese
  const isChineseText = (text) => {
    const chineseChars = text.match(/[\u4e00-\u9fff]/g);
    const totalChars = text.replace(/\s/g, '').length;
    return chineseChars && chineseChars.length > totalChars * 0.3;
  };

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
    recognitionRef.current.lang = currentContent.speechLang;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      handleMessage(spokenText);
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

  const handleMessage = async (message) => {
    if (!message.trim()) return;
    
    console.log('User said:', message);
    setConversation(prev => [...prev, { type: 'user', text: message }]);
    setIsProcessing(true);
    setTextInput(''); // Clear text input
    
    try {
      const response = await axios.post('http://localhost:3001/api/chat', {
        message: message,
        preferredLanguage: language
      });
      
      const botResponse = response.data.message;
      setConversation(prev => [...prev, { type: 'bot', text: botResponse }]);
      
      // Use smart text-to-speech based on content
      speakText(botResponse);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = language === 'chinese' 
        ? '抱歉，我没听清楚。请再说一遍。'
        : "Sorry, I didn't catch that. Please try again.";
      setConversation(prev => [...prev, { type: 'bot', text: errorMsg }]);
      speakText(errorMsg);
    }
    
    setIsProcessing(false);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleMessage(textInput);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Intelligent language detection for TTS
      if (isChineseText(text)) {
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8;
      } else {
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
      }
      
      // Set voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith(utterance.lang.split('-')[0])
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'chinese' ? 'english' : 'chinese');
  };

  const clearChat = () => {
    setConversation([]);
  };

  return (
    <div className="App">
      {/* Language Toggle */}
      <div className="language-toggle">
        <button 
          className={`language-btn ${language === 'chinese' ? 'active' : ''}`}
          onClick={() => setLanguage('chinese')}
        >
          中文
        </button>
        <button 
          className={`language-btn ${language === 'english' ? 'active' : ''}`}
          onClick={() => setLanguage('english')}
        >
          English
        </button>
      </div>

      <h1>
        {currentContent.title}
        <div className="subtitle">{currentContent.subtitle}</div>
      </h1>
      
      {/* Voice Controls */}
      <div className="voice-controls">
        <button 
          className={`talk-button ${isListening ? 'listening' : ''}`}
          onClick={startListening}
          disabled={isProcessing || isListening}
        >
          <div className="button-text">
            {isListening ? currentContent.listening : 
             isProcessing ? currentContent.thinking : 
             currentContent.startTalking}
          </div>
          <div className="button-subtitle">
            {isListening ? currentContent.listeningSub : 
             isProcessing ? currentContent.thinkingSub : 
             currentContent.startTalkingSub}
          </div>
        </button>
        
        {isListening && (
          <button className="stop-button" onClick={stopListening}>
            <div>{currentContent.stop}</div>
            <div className="button-subtitle">{currentContent.stopSub}</div>
          </button>
        )}
      </div>

      {/* Chat Controls */}
      <div className="chat-controls">
        <button 
          className="toggle-chat-button"
          onClick={() => setShowChat(!showChat)}
        >
          {showChat ? currentContent.hideChat : currentContent.showChat}
        </button>
        
        {conversation.length > 0 && (
          <button className="clear-chat-button" onClick={clearChat}>
            {currentContent.clearChat}
          </button>
        )}
      </div>

      {/* Text Input Form */}
      {showChat && (
        <form onSubmit={handleTextSubmit} className="text-input-form">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={currentContent.placeholder}
            className="text-input"
            disabled={isProcessing}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!textInput.trim() || isProcessing}
          >
            {currentContent.send}
          </button>
        </form>
      )}

      {/* Chat History */}
      {showChat && (
        <div className="conversation">
          {conversation.length === 0 ? (
            <div className="empty-chat">
              <p>{currentContent.emptyChat}</p>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                <div className="message-header">
                  <strong>
                    {msg.type === 'user' 
                      ? `${currentContent.you} (${currentContent.you === '您' ? 'You' : '您'})` 
                      : `${currentContent.aiCompanion} (${currentContent.aiCompanion === 'AI Companion' ? 'AI陪伴' : 'AI Companion'})`
                    }
                  </strong>
                  <span className="timestamp">
                    {new Date().toLocaleTimeString(language === 'chinese' ? 'zh-CN' : 'en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="message-content">{msg.text}</div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      )}
    </div>
  );
}

export default App;