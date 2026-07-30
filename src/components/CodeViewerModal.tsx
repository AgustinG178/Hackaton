import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Layers } from 'lucide-react';

interface CodeViewerModalProps {
  onClose: () => void;
}

const ANDROID_FILES = [
  {
    name: 'MainActivity.kt',
    path: 'app/src/main/java/com/historiaclara/app/MainActivity.kt',
    code: `package com.historiaclara.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.historiaclara.app.ui.theme.HistoriaClaraTheme
import com.historiaclara.app.ui.screens.MainAppScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HistoriaClaraTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainAppScreen()
                }
            }
        }
    }
}`
  },
  {
    name: 'LocalInferenceEngine.kt',
    path: 'app/src/main/java/com/historiaclara/app/data/inference/LocalInferenceEngine.kt',
    code: `package com.historiaclara.app.data.inference

import com.historiaclara.app.data.model.MedicalDocument

data class QueryResult(
    val answer: String,
    val referencedDocIds: List<String>,
    val latencyMs: Long
)

interface LocalInferenceEngine {
    suspend fun queryHistory(
        prompt: String,
        documents: List<MedicalDocument>
    ): QueryResult

    suspend fun extractDocument(
        titleHint: String,
        category: String
    ): MedicalDocument
}`
  },
  {
    name: 'FakeLocalInferenceEngine.kt',
    path: 'app/src/main/java/com/historiaclara/app/data/inference/FakeLocalInferenceEngine.kt',
    code: `package com.historiaclara.app.data.inference

import com.historiaclara.app.data.model.MedicalDocument
import kotlinx.coroutines.delay

class FakeLocalInferenceEngine : LocalInferenceEngine {

    override suspend fun queryHistory(
        prompt: String,
        documents: List<MedicalDocument>
    ): QueryResult {
        val startTime = System.currentTimeMillis()
        delay(400) // Simula la latencia de inferencia local

        val lowerPrompt = prompt.lowercase()
        val referencedDocIds = mutableListOf<String>()

        val answer = when {
            lowerPrompt.contains("sangre") || lowerPrompt.contains("colesterol") -> {
                referencedDocIds.add("D1")
                "Según tu análisis de sangre [D1], tu colesterol total se encuentra en 210 mg/dL (levemente elevado) y tu glucemia en ayunas es de 92 mg/dL."
            }
            lowerPrompt.contains("columna") || lowerPrompt.contains("espalda") -> {
                referencedDocIds.add("D2")
                "En tu Resonancia Lumbar [D2] se observa una leve protrusión discal en L4-L5 sin compresión severa. Se recomienda kinesiología."
            }
            else -> {
                referencedDocIds.addAll(listOf("D1", "D2", "D3"))
                "Consultando tu historial registrado [D1] [D2] [D3]: Mantenés parámetros generales estables en tu celular."
            }
        }

        val latencyMs = System.currentTimeMillis() - startTime
        return QueryResult(answer, referencedDocIds, latencyMs)
    }

    override suspend fun extractDocument(
        titleHint: String,
        category: String
    ): MedicalDocument {
        delay(1200) // Simula procesamiento OCR
        return MedicalDocument(
            id = "D4",
            title = titleHint.ifEmpty { "Nuevo Estudio Clínico" },
            date = "Reciente",
            category = category,
            institution = "Centro Médico Local",
            summary = "Procesamiento local completado en el dispositivo.",
            extractedText = "Digitalizado 100% offline.",
            fields = emptyList()
        )
    }
}`
  },
  {
    name: 'DeveloperSetupScreen.kt',
    path: 'app/src/main/java/com/historiaclara/app/ui/screens/DeveloperSetupScreen.kt',
    code: `package com.historiaclara.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun DeveloperSetupScreen(
    onNavigateBack: () -> Unit
) {
    var temperature by remember { mutableStateOf(0.7f) }
    var maxTokens by remember { mutableStateOf(512f) }
    var useNPU by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Configuración Developer Gemma On-Device",
            style = MaterialTheme.typography.titleLarge
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text("Temperatura: \${"%.2f".format(temperature)}")
        Slider(
            value = temperature,
            onValueChange = { temperature = it },
            valueRange = 0f..1f
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text("Tokens Máximos: \${maxTokens.toInt()}")
        Slider(
            value = maxTokens,
            onValueChange = { maxTokens = it },
            valueRange = 128f..2048f
        )

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Aceleración NPU / Hexagon DSP")
            Switch(
                checked = useNPU,
                onCheckedChange = { useNPU = it }
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        Button(
            onClick = onNavigateBack,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Guardar y Volver")
        }
    }
}`
  },
  {
    name: 'build.gradle.kts',
    path: 'app/build.gradle.kts',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.historiaclara.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.historiaclara.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }
    kotlinOptions {
        jvmTarget = "21"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.navigation.compose)
}`
  }
];

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ onClose }) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const file = ANDROID_FILES[selectedFileIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(file.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Código Android Nativo (Kotlin / Jetpack Compose)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {file.path}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/80 border-b border-slate-800 overflow-x-auto no-scrollbar">
          {ANDROID_FILES.map((f, idx) => (
            <button
              key={f.name}
              onClick={() => setSelectedFileIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedFileIdx === idx
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{f.name}</span>
            </button>
          ))}
        </div>

        {/* Code Content View */}
        <div className="relative grow p-4 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-sans font-semibold flex items-center gap-1.5 shadow"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar código</span>
              </>
            )}
          </button>

          <pre className="whitespace-pre-wrap pr-24">{file.code}</pre>
        </div>
      </div>
    </div>
  );
};
