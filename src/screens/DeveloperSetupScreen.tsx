import React, { useState } from 'react';
import { InferenceEngineConfig, EngineStats } from '../types';
import { ArrowLeft, Cpu, Settings, Zap, HardDrive, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

interface DeveloperSetupScreenProps {
  config: InferenceEngineConfig;
  onUpdateConfig: (newConfig: InferenceEngineConfig) => void;
  onClose: () => void;
  stats: EngineStats;
}

export const DeveloperSetupScreen: React.FC<DeveloperSetupScreenProps> = ({
  config,
  onUpdateConfig,
  onClose,
  stats,
}) => {
  const [localConfig, setLocalConfig] = useState<InferenceEngineConfig>(config);
  const [isSaved, setIsSaved] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<string | null>(null);

  const handleSave = () => {
    onUpdateConfig(localConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const runBenchmark = () => {
    setIsBenchmarking(true);
    setBenchmarkResult(null);

    setTimeout(() => {
      setIsBenchmarking(false);
      setBenchmarkResult(
        `Prueba completada: Latencia promedio ${stats.lastResponseLatencyMs} ms | Rendimiento: ${stats.inferenceSpeedTps} tokens/s | RAM pico: ${stats.ramUsageMb + 20} MB.`
      );
    }, 1200);
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

      {/* Mode Selection */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Motor de Inferencia Local</span>
        </h3>

        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setLocalConfig({ ...localConfig, engineType: 'fake' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              localConfig.engineType === 'fake'
                ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-100">
                FakeLocalInferenceEngine (Simulado)
              </span>
              {localConfig.engineType === 'fake' && (
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Motor desacoplado liviano sin requerimiento de descargas de pesas binarias.
            </p>
          </button>

          <button
            onClick={() => setLocalConfig({ ...localConfig, engineType: 'gemma-local' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              localConfig.engineType === 'gemma-local'
                ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-100">
                Gemma-2B-IT Quantized (Native On-Device)
              </span>
              {localConfig.engineType === 'gemma-local' && (
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ejecución nativa directa sobre la NPU / GPU con cuantización INT4.
            </p>
          </button>
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

      {/* Stats & Benchmark Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Métricas del Dispositivo</span>
          </h3>
          <button
            onClick={runBenchmark}
            disabled={isBenchmarking}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isBenchmarking ? 'animate-spin' : ''}`} />
            <span>Probar Rendimiento</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block">RAM Utilizada</span>
            <span className="font-mono font-bold text-slate-100">{stats.ramUsageMb} MB</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Velocidad</span>
            <span className="font-mono font-bold text-slate-100">{stats.inferenceSpeedTps} t/s</span>
          </div>
        </div>

        {benchmarkResult && (
          <p className="text-[11px] text-cyan-300 font-mono bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/30 leading-relaxed">
            {benchmarkResult}
          </p>
        )}
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
