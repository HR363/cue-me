// Speech-to-text factory. Decoupled from the LLM provider because Anthropic has
// no audio API — we transcribe with whatever audio-capable key is available, and
// fall back across providers. Returns { text, provider } or { text:'', error }.
const { pcmToWav } = require('./wav');

async function transcribeOpenAI(apiKey, wav, model) {
  const OpenAI = require('openai');
  const toFile = OpenAI.toFile || require('openai/uploads').toFile;
  const client = new OpenAI({ apiKey });
  const file = await toFile(wav, 'audio.wav', { type: 'audio/wav' });
  const res = await client.audio.transcriptions.create({ file, model: model || 'whisper-1' });
  return (res.text || '').trim();
}

async function transcribeGoogleSpeech(keyJson, wav) {
  // keyJson is expected to be a JSON string (service account) or an object with credentials
  try {
    const { SpeechClient } = require('@google-cloud/speech');
    let client;
    if (!keyJson) {
      client = new SpeechClient(); // rely on GOOGLE_APPLICATION_CREDENTIALS env var
    } else {
      let creds = keyJson;
      if (typeof keyJson === 'string') {
        try { creds = JSON.parse(keyJson); } catch (e) { creds = null; }
      }
      if (creds) client = new SpeechClient({ credentials: creds });
      else client = new SpeechClient();
    }

    const audio = { content: wav.toString('base64') };
    const config = { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'en-US', audioChannelCount: 1 };
    const request = { audio, config };
    const [response] = await client.recognize(request);
    if (!response || !response.results) return '';
    const transcript = response.results.map(r => (r.alternatives && r.alternatives[0] && r.alternatives[0].transcript) || '').join('\n').trim();
    return transcript;
  } catch (e) {
    // rethrow so caller captures structured info
    throw e;
  }
}

// NOTE: @google/genai (Gemini) does not provide a documented speech-to-text endpoint
// suitable for raw transcription; using it here for verbatim STT is unreliable. We
// therefore do not include Gemini as a primary STT provider. If you have a dedicated
// Google Cloud Speech-to-Text service account, set its JSON in the Settings ->
// "Google Speech" field (paste the service account JSON). The app will use that.

function createSTT(settings) {
  const keys = settings.apiKeys || {};
  const chain = [];
  if (keys.openai) chain.push({ p: 'openai', fn: (wav) => transcribeOpenAI(keys.openai, wav, settings.sttModel) });
  if (keys.google_speech) chain.push({ p: 'google_speech', fn: (wav) => transcribeGoogleSpeech(keys.google_speech, wav) });

  return {
    available: chain.length > 0,
    providers: chain.map((c) => c.p),
    async transcribe(pcm) {
      if (!chain.length || !pcm || pcm.length < 3200) return { text: '' };
      const wav = pcmToWav(pcm, 16000, 1);
      let lastErr = null;
      for (const c of chain) {
        try {
          const text = await c.fn(wav);
          return { text, provider: c.p };
        } catch (e) {
          // Normalize some useful fields for logging
          const status = e && (e.status || (e.code && (Number.isInteger(e.code) ? e.code : undefined)));
          const code = e && e.code;
          const message = (e && e.message) || (e && e.toString && e.toString()) || String(e);
          console.error('[stt] provider error', c.p, status, code, message, e && e.response ? e.response : 'no-response');
          lastErr = { status, code, message, provider: c.p };
        }
      }
      return { text: '', error: lastErr };
    }
  };
}

module.exports = { createSTT };