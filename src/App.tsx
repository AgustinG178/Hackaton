import { useEffect, useState } from 'react';
import { ChatMessage, InferenceEngineConfig, MedicalDocument, TabType } from './types';
import { OllamaLocalInferenceEngine } from './services/LocalInferenceEngine';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HistoryScreen } from './screens/HistoryScreen';
import { AddDocumentScreen } from './screens/AddDocumentScreen';
import { ChatScreen } from './screens/ChatScreen';
import { DeveloperSetupScreen } from './screens/DeveloperSetupScreen';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { ReferenceModal } from './components/ReferenceModal';

export default function App() {
  const [engine] = useState(() => new OllamaLocalInferenceEngine('/ollama', 'gemma4:e4b'));
  const [isEngineConnected, setIsEngineConnected] = useState(false);
  const [documents, setDocuments] = useState<MedicalDocument[]>(() => {
    try {
      const stored = localStorage.getItem('historia-clara-documents-v2');
      return stored ? (JSON.parse(stored) as MedicalDocument[]) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<MedicalDocument | null>(null);
  const [selectedDocForReference, setSelectedDocForReference] = useState<MedicalDocument | null>(null);
  const [showDeveloperSetup, setShowDeveloperSetup] = useState(false);
  const [engineConfig, setEngineConfig] = useState<InferenceEngineConfig>({
    modelPath: '',
    temperature: 0.1,
    maxTokens: 384,
    topK: 20,
    quantization: 'int4',
    useNPU: false,
    systemPrompt:
      'Respondé únicamente con información confirmada de los documentos locales. Citá cada afirmación con [D#]. Si el dato no está, respondé: Ese dato no consta en los documentos guardados. No diagnostiques ni recomiendes tratamientos.',
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Hola. Puedo ayudarte a encontrar información dentro de tus documentos. Cada respuesta personal muestra su fuente.',
      timestamp: 'Ahora',
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('historia-clara-documents-v2', JSON.stringify(documents));
    } catch {
      // localStorage ronda los 5 MB y las vistas previas son lo más pesado.
      // Antes que perder los datos clínicos confirmados, se reintenta sin ellas.
      try {
        const withoutPreviews = documents.map(({ imagePreviewUrls: _ignored, ...rest }) => rest);
        localStorage.setItem('historia-clara-documents-v2', JSON.stringify(withoutPreviews));
      } catch {
        // Si aun así no entra, se sigue trabajando en memoria.
      }
    }
  }, [documents]);

  useEffect(() => {
    void engine.isAvailable().then((available) => {
      setIsEngineConnected(available);
      if (available) void engine.warmUp();
    });
  }, [engine]);

  const handleDocumentAdded = (newDocument: MedicalDocument) => {
    setDocuments((current) => [newDocument, ...current]);
    setActiveTab('history');
  };

  const handleSendMessage = async (userText: string) => {
    const time = new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, sender: 'user', text: userText, timestamp: time },
    ]);
    setIsGenerating(true);

    try {
      const response = await engine.queryHistory(userText, documents);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: response.answer,
          timestamp: new Date().toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          referencedDocIds: response.referencedDocIds,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          sender: 'assistant',
          text: 'No pude consultar Gemma en este momento. Comprobá que Ollama siga abierto en la notebook y volvé a intentarlo.',
          timestamp: new Date().toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReferenceClick = (docId: string) => {
    const document = documents.find((item) => item.id === docId);
    if (document) setSelectedDocForReference(document);
  };

  const handleAskAboutDocument = (document: MedicalDocument) => {
    setActiveTab('chat');
    void handleSendMessage(`Resumí el documento ${document.id}`);
  };

  if (showDeveloperSetup) {
    return (
      <DeveloperSetupScreen
        config={engineConfig}
        onUpdateConfig={setEngineConfig}
        onClose={() => setShowDeveloperSetup(false)}
        stats={engine.getStats()}
        isConnected={isEngineConnected}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8F7] text-[#17243A]">
      <Header
        onOpenDeveloperSetup={() => setShowDeveloperSetup(true)}
        isConnected={isEngineConnected}
      />

      <main>
        {activeTab === 'history' && (
          <HistoryScreen
            documents={documents}
            onSelectDocument={setSelectedDocForDetail}
            onNavigateToAdd={() => setActiveTab('add')}
          />
        )}
        {activeTab === 'add' && (
          <AddDocumentScreen
            engine={engine}
            onDocumentAdded={handleDocumentAdded}
            nextDocNumber={
              Math.max(0, ...documents.map((document) => Number(document.id.replace('D', '')) || 0)) + 1
            }
          />
        )}
        {activeTab === 'chat' && (
          <ChatScreen
            documents={documents}
            messages={messages}
            onSendMessage={handleSendMessage}
            onReferenceClick={handleReferenceClick}
            isGenerating={isGenerating}
            onClearChat={() => setMessages([])}
            isConnected={isEngineConnected}
            onNavigateToAdd={() => setActiveTab('add')}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        documentCount={documents.length}
      />

      <DocumentDetailModal
        document={selectedDocForDetail}
        onClose={() => setSelectedDocForDetail(null)}
        onAskAboutDocument={handleAskAboutDocument}
      />
      <ReferenceModal
        document={selectedDocForReference}
        onClose={() => setSelectedDocForReference(null)}
        onOpenFullDoc={setSelectedDocForDetail}
      />
    </div>
  );
}
