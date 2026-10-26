'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTrip } from '@/lib/state/TripContext';
import { generateCompanionResponse } from '@/lib/agents/companionAgent';
import { ChatMessage } from '@/types';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  User,
  ShieldCheck,
  CheckCircle2,
  Mic,
  MicOff,
} from 'lucide-react';

export default function PersonalAssistantDrawer() {
  const {
    isAssistantOpen,
    setIsAssistantOpen,
    currentUser,
    itinerary,
    polls,
    expenses,
    travelStatus,
    documents,
    users,
    speakText,
    isSpeaking,
    stopSpeaking,
  } = useTrip();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drawerRecognitionRef = useRef<any>(null);

  // Initialize greeting whenever current user changes
  useEffect(() => {
    const greeting =
      currentUser.id === 'dadaji'
        ? `Pranam Dadaji! I am your personal Jaipur assistant. All our timings, low-sodium meals, and zero-stair paths are verified. How may I assist you?`
        : currentUser.id === 'kabir'
        ? `Hey Captain Kabir! 🌟 Ready for today's adventures? Ask me when we get ice cream, what animals we'll see, or how to earn more explorer XP!`
        : currentUser.id === 'priya'
        ? `Hi Priya! I am pre-loaded with your strict Jain dietary boundaries. I have verified all restaurant kitchens so you don't have to worry about root vegetables or onion/garlic.`
        : currentUser.id === 'rohan'
        ? `Executive Briefing for Trip Leader Rohan: Group is 88% aligned. Dadaji's Amber Fort golf cart is confirmed, Priya's lunch venue is vetted, and 2 net payments settle all trip expenses.`
        : `Hi ${currentUser.name}! I am your personal Sahyatri AI assistant with complete trip context. Ask me anything about timings, venues, or expenses.`;

    const quickReplies =
      currentUser.id === 'dadaji'
        ? ['Will there be stairs tonight?', 'When should I take my BP medicine?', 'Where is our hotel?']
        : currentUser.id === 'kabir'
        ? ['When do we see the camel?', 'Where is Uncle Vikram?', 'When do we get ice cream?']
        : currentUser.id === 'priya'
        ? ['Is lunch safe for Jain diet?', 'What time is our next stop?', 'See my expense share']
        : currentUser.id === 'rohan'
        ? ['Give me group alignment briefing', 'Resolve afternoon poll', 'Show debt settlement graph']
        : ['What is the itinerary for today?', 'Who owes what on expenses?', 'Where is the rendezvous?'];

    setMessages([
      {
        id: `greet-${currentUser.id}`,
        sender: 'assistant',
        content: greeting,
        timestamp: 'Just now',
        suggestedQuickReplies: quickReplies,
      },
    ]);
  }, [currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAssistantOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const agentContext = {
      currentUser,
      itinerary,
      polls,
      expenses,
      travelStatus,
      documents,
      allUsers: users,
    };

    try {
      const apiRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          persona: currentUser.personaType,
          userId: currentUser.id,
          allUsers: users,
          itinerary,
          polls,
        }),
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        let replyText = data.reply || data.data?.text;
        if (!replyText || replyText.startsWith('Command confirmed.')) {
          replyText = data.data?.text || generateCompanionResponse(query, agentContext).text;
        }
        if (replyText) {
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            content: replyText,
            timestamp: 'Just now',
            suggestedQuickReplies: data.data?.quickReplies || [
              'What is the next stop on the plan?',
              'How is the weather today?',
              'Who pays next for group expenses?'
            ],
          };

          setMessages((prev) => [...prev, botMsg]);
          setLoading(false);

          if (currentUser.personaType === 'elderly') {
            speakText(replyText);
          }
          return;
        }
      }
    } catch {
      // Fallback seamlessly to local intelligent agent
    }

    const res = generateCompanionResponse(query, agentContext);
    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: 'assistant',
      content: res.text,
      timestamp: 'Just now',
      suggestedQuickReplies: res.quickReplies,
    };

    setMessages((prev) => [...prev, botMsg]);
    setLoading(false);

    if (currentUser.personaType === 'elderly') {
      speakText(res.text);
    }
  };

  const toggleVoiceInput = () => {
    if (isListeningVoice) {
      try {
        drawerRecognitionRef.current?.abort();
      } catch {}
      setIsListeningVoice(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          drawerRecognitionRef.current = rec;
          rec.continuous = false;
          rec.interimResults = true;
          rec.lang = 'en-IN';

          rec.onstart = () => {
            setIsListeningVoice(true);
          };

          rec.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            if (event.results[0].isFinal) {
              setIsListeningVoice(false);
              handleSend(transcript);
            }
          };

          rec.onerror = () => {
            setIsListeningVoice(false);
          };

          rec.onend = () => {
            setIsListeningVoice(false);
          };

          rec.start();
        } catch {
          setIsListeningVoice(false);
        }
      }
    }
  };

  if (!isAssistantOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/20 backdrop-blur-[2px] flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EBE6DE] bg-[#3A332C] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D97746] flex items-center justify-center text-white shrink-0 shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">
                  {currentUser.role === 'planner'
                    ? 'Planner Super-Agent'
                    : `${currentUser.name.split(' ')[0]}'s Assistant`}
                </h3>
                <span className="text-[9px] uppercase font-bold bg-white/10 text-[#FAF8F5] px-2 py-0.2 rounded-full">
                  Sahyatri AI
                </span>
              </div>
              <p className="text-[11px] text-[#8C847A]">
                Context: {currentUser.relationship} &bull; {currentUser.preferences.dietary[0] || 'Standard'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSpeaking ? (
              <button
                onClick={stopSpeaking}
                title="Stop Audio"
                className="p-1.5 rounded-lg bg-[#C46435] text-white transition"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => speakText(messages[messages.length - 1]?.content || '')}
                title="Read Last Message"
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsAssistantOpen(false)}
              className="p-1.5 rounded-lg text-[#8C847A] hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#FAF8F5]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#D97746] text-white font-medium shadow-2xs'
                    : 'bg-white text-[#1C1A18] border border-[#EBE6DE] shadow-2xs'
                }`}
              >
                <p>{msg.content}</p>

                {msg.sender === 'assistant' && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#EBE6DE] text-[10px] text-[#8C847A]">
                    <span className="flex items-center gap-1 text-[#4D7C5F] font-semibold">
                      <ShieldCheck className="w-3 h-3" /> Trip Context Ingested
                    </span>
                    <button
                      onClick={() => speakText(msg.content)}
                      className="hover:text-[#1C1A18] flex items-center gap-1 font-medium"
                    >
                      <Volume2 className="w-3 h-3" /> Listen
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Replies */}
              {msg.suggestedQuickReplies && msg.suggestedQuickReplies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.suggestedQuickReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(reply)}
                      className="text-[11px] font-semibold bg-white border border-[#EBE6DE] text-[#5E5851] hover:text-[#1C1A18] hover:border-[#D97746] px-3 py-1.5 rounded-full shadow-2xs transition"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#5E5851] bg-white p-3 rounded-2xl w-fit border border-[#EBE6DE]">
              <Sparkles className="w-3.5 h-3.5 text-[#D97746] animate-spin" />
              <span>Analyzing trip state &amp; personal constraints...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#EBE6DE]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListeningVoice ? 'Listening to voice query...' : `Ask ${currentUser.name.split(' ')[0]}'s AI assistant...`}
              className="flex-1 text-xs sm:text-sm p-3 border border-[#EBE6DE] rounded-xl focus:border-[#D97746] focus:outline-none"
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isListeningVoice ? 'Listening... click to stop' : 'Speak to AI'}
              className={`p-3 rounded-xl transition active:scale-95 shrink-0 ${
                isListeningVoice
                  ? 'bg-emerald-500 text-white animate-pulse shadow-md'
                  : 'bg-stone-100 hover:bg-stone-200 text-[#5E5851]'
              }`}
            >
              {isListeningVoice ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-3 bg-[#D97746] hover:bg-[#C46435] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-2xs transition active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
