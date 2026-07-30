import React, { useState } from 'react';
import { InferenceEngineConfig, EngineStats } from '../types';
import { ArrowLeft, Cpu, Settings, Zap, HardDrive, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

interface DeveloperSetupScreenProps {
  config: InferenceEngineConfig;
  onUpdateConfig: (newConfig: InferenceEngineConfig) => void;
  onClose: () => void;
  stats: EngineStats;
  isConnected: boolean;
}

export const DeveloperSetupScreen: React.FC<DeveloperSetupScreenProps> = ({
  config,
  onUpdateConfig,
  onClose,
  stats,
  isConnected,
}) => {
  const [localConfig, setLocalConfig] = useState<InferenceEngineConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdateConfig(localConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 border border-cyan-500/30 px-2 py-0.5 rounded-full uppercase">
            Ajustes Ocultos (5s Hold)
          </span>
          <h2 className="text-sm font-bold text-slate-100">DeveloperSetupScreen</h2>
        </div>

        <div className="w-9" />
      </div>

      {/* Secret Access Warning Notice */}
      <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Menú Técnico Gemma On-Device</span>
          <p className="text-[11px] text-amber-300/80 mt-0.5">
            Esta pantalla está oculta para el usuario final. Permite ajustar los parámetros de inferencia local en Android.
          </p>
        </div>
      </div>

      {/* Engine Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Motor de Inferencia Local</span>
        </h3>

        <div
          className={`p-3 rounded-xl border ${
            isConnected ? 'bg-emerald-950/40 border-emerald-600/50' : 'bg-red-950/30 border-red-700/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-100">{stats.activeModel}</span>
            {isConnected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isConnected
              ? 'Conectado a Ollama en la notebook.'
              : 'Sin conexión. Iniciá Ollama con el modelo gemma4:e4b.'}
          </p>
        </div>
      </div>

      {/* Model Weights Path */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>Ruta del Archivo de Pesos (.bin / .tflite)</span>
        </h3>

        <input
          type="text"
          value={localConfig.modelPath}
          onChange={(e) => setLocalConfig({ ...localConfig, modelPath: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Hyperparameters Sliders */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Settings className="w-4 h-4 text-cyan-400" />
          <span>Parámetros de Inferencia</span>
        </h3>

        {/* Temperature */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Temperatura (Creatividad):</span>
            <span className="font-mono text-cyan-400 font-bold">{localConfig.temperature}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localConfig.temperature}
            onChange={(e) =>
              setLocalConfig({ ...localConfig, temperature: parseFloat(e.target.value) })
            }
            className="w-full accent-cyan-400"
          />
        </div>

        {/* Max Tokens */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Tokens Máximos de Respuesta:</span>
            <span className="font-mono text-cyan-400 font-bold">{localConfig.maxTokens}</span>
          </div>
          <input
            type="range"
            min="128"
            max="2048"
            step="64"
            value={localConfig.maxTokens}
            onChange={(e) =>
              setLocalConfig({ ...localConfig, maxTokens: parseInt(e.target.value) })
            }
            className="w-full accent-cyan-400"
          />
        </div>

        {/* Quantization Selector */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 block">Formato de Cuantización:</label>
          <div className="grid grid-cols-3 gap-2">
            {(['int4', 'int8', 'fp16'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setLocalConfig({ ...localConfig, quantization: q })}
                className={`py-1.5 text-xs font-mono font-bold rounded-xl border uppercase transition-colors ${
                  localConfig.quantization === q
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* NPU Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              Aceleración NPU / Hexagon DSP
            </span>
            <span className="text-[10px] text-slate-500">
              Aprovecha el procesador neural del dispositivo
            </span>
          </div>
          <input
            type="checkbox"
            checked={localConfig.useNPU}
            onChange={(e) =>
              setLocalConfig({ ...localConfig, useNPU: e.target.checked })
            }
            className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* System Prompt Tuning */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
          System Prompt Interno
        </label>
        <textarea
          rows={3}
          value={localConfig.systemPrompt}
          onChange={(e) => setLocalConfig({ ...localConfig, systemPrompt: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Stats Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Última Respuesta</span>
        </h3>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-500 text-[10px] block">Latencia</span>
          <span className="font-mono font-bold text-slate-100">
            {stats.lastResponseLatencyMs > 0 ? `${stats.lastResponseLatencyMs} ms` : 'Sin datos aún'}
          </span>
        </div>
      </div>

      {/* Save Action */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2"
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Configuración guardada!</span>
            </>
          ) : (
            <span>Guardar cambios developer</span>
          )}
        </button>
      </div>
    </div>
  );
};
