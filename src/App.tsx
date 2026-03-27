import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, CheckCircle, ChevronRight, User, Bot, Loader2, Maximize2, RefreshCw, Smartphone, Monitor, Layout } from 'lucide-react';
import { getChatResponse, generatePrototype } from './services/geminiService';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import ErrorBoundary from './components/ErrorBoundary';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      text: "Welcome to Silk Road Professionals. I'm your AI advisor. **What software idea are we exploring today?**",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [prototypeHtml, setPrototypeHtml] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const createInitialLead = async () => {
      const path = 'leads';
      try {
        const docRef = await addDoc(collection(db, path), {
          status: 'started',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setLeadId(docRef.id);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    };
    createInitialLead();
  }, []);

  const parseResponse = (text: string) => {
    let buttons: string[] = [];
    const buttonMatch = text.match(/\[BUTTONS:\s*(\[.*?\])\]/);
    if (buttonMatch) {
      try {
        buttons = JSON.parse(buttonMatch[1]);
      } catch (e) {
        console.error('Failed to parse buttons', e);
      }
    }
    const cleanText = text
      .replace(/\[BUTTONS:\s*\[.*?\]\s*\]/g, '')
      .replace('[GENERATE_UI_PROTOTYPE]', '')
      .replace('[GENERATE_TECH_SPEC]', '')
      .trim();
    return { cleanText, buttons };
  };

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const botResponse = await getChatResponse(messageText, messages);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: botResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      if (botResponse.includes('[GENERATE_UI_PROTOTYPE]') || botResponse.includes('[GENERATE_TECH_SPEC]')) {
        setIsGenerating(true);
        const type = botResponse.includes('[GENERATE_UI_PROTOTYPE]') ? 'UI' : 'TECH';
        
        // Find the summary message (usually 2 messages back)
        const summaryMessage = [...messages].reverse().find(m => m.role === 'bot' && m.text.includes('**Does this accurately capture your vision?**'));
        const projectSummary = summaryMessage ? summaryMessage.text.split('**')[0].trim() : botResponse;
        
        const html = await generatePrototype(projectSummary, type);
        setPrototypeHtml(html);
        setIsGenerating(false);
      }

      if (leadId) {
        const convPath = 'conversations';
        try {
          await setDoc(doc(db, convPath, leadId), {
            leadId,
            messages: [...messages, userMessage, botMessage].map(m => ({
              role: m.role,
              text: m.text,
              timestamp: m.timestamp.toISOString()
            })),
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, convPath);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const renderText = (text: string) => {
    const { cleanText } = parseResponse(text);
    return cleanText.split('\n').map((line, i) => {
      // Simple bolding support
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className={line.trim() === '' ? 'h-2' : 'mb-1'}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="font-bold text-srp-teal">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="h-screen bg-srp-bg font-sans text-srp-navy flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-srp-border px-8 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-srp-navy rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
            <Sparkles className="text-srp-teal w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-xl tracking-tight leading-none text-srp-navy uppercase">SRP Advisor</span>
            <span className="text-[10px] text-srp-teal font-bold uppercase tracking-[0.3em] mt-1">Idea-to-MVP Engine</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-6">
            <button className="text-xs font-bold text-srp-navy/60 hover:text-srp-teal transition-colors uppercase tracking-widest">Services</button>
            <button className="text-xs font-bold text-srp-navy/60 hover:text-srp-teal transition-colors uppercase tracking-widest">Portfolio</button>
            <button className="text-xs font-bold text-srp-navy/60 hover:text-srp-teal transition-colors uppercase tracking-widest">About</button>
          </nav>
          <button className="bg-srp-teal text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#008A93] transition-all shadow-[0_4px_14px_0_rgba(0,163,173,0.39)] hover:shadow-[0_6px_20px_rgba(0,163,173,0.23)] active:scale-95 uppercase tracking-widest">
            Book Consultation
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left: Preview Area */}
        <div className="flex-1 bg-[#F1F5F9] flex flex-col border-r border-srp-border overflow-hidden relative">
          <div className="bg-white border-b border-srp-border px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-srp-teal animate-pulse shadow-[0_0_10px_rgba(0,163,173,0.5)]"></div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-srp-navy/40">Live Concept Canvas</span>
              {isGenerating && (
                <div className="flex items-center gap-2 text-srp-teal ml-6">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Orchestrating Prototype...</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-srp-bg p-1 rounded-xl border border-srp-border">
              <button 
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-white shadow-md text-srp-teal' : 'text-srp-navy/30 hover:text-srp-navy/50'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'mobile' ? 'bg-white shadow-md text-srp-teal' : 'text-srp-navy/30 hover:text-srp-navy/50'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-12 flex items-center justify-center overflow-hidden">
            {prototypeHtml ? (
              <div className={`bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-1000 ease-in-out overflow-hidden rounded-3xl border border-srp-border ${
                viewMode === 'desktop' ? 'w-full h-full' : 'w-[375px] h-[667px]'
              }`}>
                <iframe
                  srcDoc={prototypeHtml}
                  className="w-full h-full border-none"
                  title="Prototype Preview"
                />
              </div>
            ) : (
              <div className="text-center max-w-md animate-in fade-in zoom-in duration-700">
                <div className="relative w-32 h-32 mx-auto mb-12">
                  <div className="absolute inset-0 bg-srp-teal/10 rounded-[2.5rem] animate-pulse"></div>
                  <div className="absolute inset-4 bg-white rounded-[2rem] shadow-2xl border border-srp-border flex items-center justify-center transform rotate-6 hover:rotate-0 transition-transform duration-500">
                    <Layout className="w-12 h-12 text-srp-teal" />
                  </div>
                </div>
                <h3 className="text-3xl font-display font-black text-srp-navy mb-6 uppercase tracking-tighter">Concept Canvas</h3>
                <p className="text-base text-srp-navy/40 leading-relaxed font-medium max-w-xs mx-auto">
                  Share your vision in the chat. I'll orchestrate a high-fidelity prototype or technical spec right here.
                </p>
              </div>
            )}
          </div>
          
          {prototypeHtml && (
            <div className="absolute bottom-8 right-8 flex gap-4">
              <button className="p-4 bg-white rounded-2xl shadow-xl border border-srp-border hover:bg-srp-bg transition-all hover:-translate-y-1 group">
                <RefreshCw className="w-6 h-6 text-srp-navy group-hover:rotate-180 transition-transform duration-500" />
              </button>
              <button className="p-4 bg-srp-navy rounded-2xl shadow-xl hover:bg-srp-navy/90 transition-all hover:-translate-y-1 group">
                <Maximize2 className="w-6 h-6 text-white group-scale-110 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Chat Area */}
        <div className="w-[480px] flex flex-col bg-white overflow-hidden relative shadow-[-20px_0_50px_rgba(0,0,0,0.03)]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-10 space-y-10">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const { buttons } = parseResponse(msg.text);
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col gap-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transform ${
                        msg.role === 'bot' ? 'bg-srp-bg text-srp-teal -rotate-6' : 'bg-srp-navy text-white rotate-6'
                      }`}>
                        {msg.role === 'bot' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                      </div>
                      <div className={`max-w-[85%] p-5 rounded-3xl text-[15px] leading-relaxed font-medium ${
                        msg.role === 'bot' 
                          ? 'bg-srp-bg text-srp-navy rounded-tl-none border border-srp-border' 
                          : 'bg-srp-navy text-white rounded-tr-none shadow-xl'
                      }`}>
                        {renderText(msg.text)}
                      </div>
                    </div>
                    
                    {/* Interactive Buttons */}
                    {msg.role === 'bot' && buttons.length > 0 && messages[messages.length - 1].id === msg.id && (
                      <div className="flex flex-wrap gap-3 ml-14 mt-2">
                        {buttons.map((btn, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(btn)}
                            disabled={isLoading}
                            className="bg-white border-2 border-srp-teal/20 text-srp-teal px-6 py-2 rounded-2xl text-xs font-bold hover:bg-srp-teal hover:text-white hover:border-srp-teal transition-all shadow-sm hover:shadow-md active:scale-95 uppercase tracking-widest"
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-srp-bg flex items-center justify-center shrink-0 -rotate-6">
                  <Bot className="w-6 h-6 text-srp-teal animate-pulse" />
                </div>
                <div className="bg-srp-bg p-5 rounded-3xl rounded-tl-none border border-srp-border">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-srp-teal rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-srp-teal rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-srp-teal rounded-full animate-bounce"></div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-8 border-t border-srp-border bg-white">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="w-full bg-srp-bg border-2 border-srp-border rounded-[1.5rem] py-4.5 pl-8 pr-16 text-sm font-semibold focus:outline-none focus:ring-8 focus:ring-srp-teal/5 focus:border-srp-teal transition-all placeholder:text-srp-navy/20"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="absolute right-3 p-3 bg-srp-navy text-white rounded-2xl hover:bg-srp-navy/90 disabled:bg-srp-border disabled:text-srp-navy/20 transition-all shadow-xl active:scale-95 group"
              >
                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-srp-teal shadow-[0_0_8px_rgba(0,163,173,0.5)]"></div>
                <p className="text-[11px] text-srp-navy/30 uppercase tracking-[0.3em] font-extrabold">
                  SRP Intelligence
                </p>
              </div>
              <p className="text-[11px] text-srp-navy/20 font-extrabold tracking-widest">V1.3</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ChatApp />
    </ErrorBoundary>
  );
}
