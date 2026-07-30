import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, LoaderCircle, Send, Sparkles, Trash2, User } from 'lucide-react';
import { ChatMessage, MedicalDocument } from '../types';

interface ChatScreenProps {
  documents: MedicalDocument[];
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onReferenceClick: (docId: string) => void;
  isGenerating: boolean;
  onClearChat: () => void;
  isConnected: boolean;
}

export const ChatScreen = ({
  documents,
  messages,
  onSendMessage,
  onReferenceClick,
  isGenerating,
  onClearChat,
  isConnected,
}: ChatScreenProps) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestedPrompts = [
    '¿Cuál fue el último medicamento que me recetaron?',
    '¿Cómo estoy anímicamente?',
    '¿Cuál fue mi último estudio?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = inputPrompt.trim();
    if (!text || isGenerating) return;
    onSendMessage(text);
    setInputPrompt('');
  };

  const renderText = (text: string) =>
    text.split(/(\[D\d+\])/g).map((part, index) => {
      const match = part.match(/^\[(D\d+)\]$/);
      if (!match) return <span key={`${part}-${index}`}>{part}</span>;
      const docId = match[1];
      const exists = documents.some((document) => document.id === docId);
      return (
        <button
          key={`${docId}-${index}`}
          disabled={!exists}
          onClick={() => onReferenceClick(docId)}
          className="mx-1 inline-flex min-h-8 items-center rounded-lg bg-[#087F73] px-2.5 font-mono text-sm font-black text-white underline decoration-2 underline-offset-2 disabled:bg-[#9AA6AF]"
          aria-label={`Abrir documento ${docId}`}
        >
          [{docId}]
        </button>
      );
    });

  return (
    <div className="mx-auto flex h-[calc(100dvh-146px)] max-w-lg flex-col px-4 pb-2 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#087F73]">Consulta local</p>
          <h2 className="text-2xl font-black text-[#17243A]">Preguntá sobre tu historia</h2>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[#CAD5D2] bg-white px-3 text-sm font-bold text-[#526171]"
          >
            <Trash2 className="h-4 w-4" />
            Limpiar
          </button>
        )}
      </div>

      {isConnected ? (
        <div className="mb-3 rounded-xl border border-[#B9D9D4] bg-[#E7F5F2] px-3 py-2 text-sm font-bold text-[#174A45]">
          Gemma 4 E4B · ejecución local en la notebook · sin nube
        </div>
      ) : (
        <div className="mb-3 rounded-xl border border-[#F1CD82] bg-[#FFF7E4] px-3 py-2 text-sm font-bold text-[#664A12]">
          Sin conexión con Gemma · abrí Ollama en la notebook para consultar tu historia
        </div>
      )}

      {messages.length <= 1 && (
        <div className="mb-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#455465]">
            <Sparkles className="h-4 w-4 text-[#087F73]" />
            Preguntas de ejemplo
          </div>
          <div className="space-y-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onSendMessage(prompt)}
                disabled={isGenerating}
                className="min-h-12 w-full rounded-xl border border-[#B9D9D4] bg-white px-4 text-left text-base font-semibold text-[#23534E] hover:bg-[#EAF6F3]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grow space-y-4 overflow-y-auto pb-3" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'assistant' && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E0F2EF] text-[#087F73]">
                <Bot className="h-5 w-5" />
              </div>
            )}
            <div
              className={`max-w-[86%] rounded-2xl px-4 py-3 text-base leading-relaxed shadow-sm ${
                message.sender === 'user'
                  ? 'rounded-tr-sm bg-[#087F73] text-white'
                  : 'rounded-tl-sm border border-[#D4DEDB] bg-white text-[#26364B]'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {message.sender === 'assistant' ? renderText(message.text) : message.text}
              </div>
              <p
                className={`mt-2 text-xs font-semibold ${
                  message.sender === 'user' ? 'text-[#D7F1ED]' : 'text-[#74818D]'
                }`}
              >
                {message.timestamp}
              </p>
            </div>
            {message.sender === 'user' && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8ECEB] text-[#526171]">
                <User className="h-5 w-5" />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-2 text-base font-semibold text-[#526171]">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#087F73]" />
            Buscando en tus documentos…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-[#D4DEDB] bg-[#F5F8F7] pt-3">
        <label className="sr-only" htmlFor="history-question">Escribí tu pregunta</label>
        <input
          id="history-question"
          value={inputPrompt}
          onChange={(event) => setInputPrompt(event.target.value)}
          placeholder="Escribí una pregunta"
          disabled={isGenerating}
          className="min-h-14 min-w-0 grow rounded-2xl border-2 border-[#C8D5D2] bg-white px-4 text-base text-[#17243A] outline-none placeholder:text-[#6C7885] focus:border-[#087F73]"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isGenerating}
          aria-label="Enviar pregunta"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#087F73] text-white disabled:bg-[#A7B3B0]"
        >
          <Send className="h-6 w-6" />
        </button>
      </form>
    </div>
  );
};
