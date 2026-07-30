import { useEffect, useState } from 'react';
import { ChatMessage, InferenceEngineConfig, MedicalDocument, TabType } from './types';
import { INITIAL_DOCUMENTS } from './data/initialData';
import {
  FakeLocalInferenceEngine,
  LocalInferenceEngine,
  OllamaLocalInferenceEngine,
} from './services/LocalInferenceEngine';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HistoryScreen } from './screens/HistoryScreen';
import { AddDocumentScreen } from './screens/AddDocumentScreen';
import { ChatScreen } from './screens/ChatScreen';
import { DeveloperSetupScreen } from './screens/DeveloperSetupScreen';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { ReferenceModal } from './components/ReferenceModal';

export default function App() {
  const [engine, setEngine] = useState<LocalInferenceEngine>(() => new FakeLocalInferenceEngine());
  const [documents, setDocuments] = useState<MedicalDocument[]>(() => {
    try {
      const stored = localStorage.getItem('historia-clara-documents-v2');
      return stored ? (JSON.parse(stored) as MedicalDocument[]) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<MedicalDocument | null>(null);
  const [selectedDocForReference, setSelectedDocForReference] = useState<MedicalDocument | null>(null);
  const [showDeveloperSetup, setShowDeveloperSetup] = useState(false);
  const [engineConfig, setEngineConfig] = useState<InferenceEngineConfig>({
    engineType: 'fake',
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
    localStorage.setItem('historia-clara-documents-v2', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    const ollamaEngine = new OllamaLocalInferenceEngine('/ollama', 'gemma4:e4b');
    void ollamaEngine.isAvailable().then((available) => {
      if (!available) return;
      setEngine(ollamaEngine);
      setEngineConfig((current) => ({ ...current, engineType: 'gemma-local' }));
      void ollamaEngine.warmUp();
    });
  }, []);

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
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8F7] text-[#17243A]">
      <Header
        onOpenDeveloperSetup={() => setShowDeveloperSetup(true)}
        engineMode={engineConfig.engineType}
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
            isDemo={engineConfig.engineType === 'fake'}
            engineLabel={
              engineConfig.engineType === 'gemma-local'
                ? 'Gemma 4 E4B · ejecución local en la notebook'
                : 'Respuestas programadas · sin modelo conectado'
            }
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
