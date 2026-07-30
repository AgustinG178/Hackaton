# Historia Clara

MVP para organizar documentos personales de salud, revisarlos y consultarlos con
referencias verificables como `[D1]`, `[D2]` y `[D3]`.

## Estado actual

- La interfaz web funciona y compila sin servicios externos.
- La historia arranca vacía; los documentos se cargan agregándolos de verdad.
- El chat detecta automáticamente Ollama y usa `gemma4:e4b` cuando está
  disponible. Si no lo encuentra, muestra un error claro en vez de generar
  respuestas inventadas.
- No usa Gemini API, Firebase, claves, autenticación ni backend.
- La carpeta `android/` proveniente de Google AI Studio es solo un esqueleto:
  todavía no incluye una aplicación Android completa ni genera un APK.

La integración actual ejecuta Gemma en la notebook y permite usar el teléfono
como interfaz mediante USB. No debe presentarse como inferencia dentro del
teléfono. Para la versión Android final todavía hace falta LiteRT-LM y un modelo
`.litertlm`.

## Ejecutar la interfaz

Requisitos: Node.js 20 o superior.

```powershell
npm.cmd install
npm.cmd run dev
```

Ollama debe estar abierto y tener disponible el modelo:

```powershell
ollama run gemma4:e4b
```

Para verificar la versión de producción:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Conectar Gemma 4 E4B

El punto de integración web está en
`src/services/LocalInferenceEngine.ts`. Para Android, el equipo debe completar un
proyecto nativo y proveer una implementación de `LocalInferenceEngine` con
LiteRT-LM y un modelo `.litertlm`.

El comportamiento esperado es:

1. Extraer datos estructurados del documento.
2. Pedir confirmación antes de guardarlos.
3. Recuperar primero los eventos relevantes y ordenarlos por fecha.
4. Usar Gemma para redactar únicamente a partir de ese contexto.
5. Citar cada afirmación con `[D#]`.
6. Responder “Ese dato no consta en los documentos guardados” cuando falte
   evidencia.

No se debe mostrar el selector del modelo al usuario final ni generar
respuestas simuladas: si no hay modelo conectado, se debe mostrar un error.
# Hackaton
