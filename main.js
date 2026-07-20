function handleSttError(err, settings) {
  console.log('[stt] error', err.provider, err.status, err.code, err.message);
  if (sttDisabled) return;
  // Treat 401/403/404/model_not_found as no-access so we stop hammering providers
  const noAccess = err.status === 403 || err.status === 401 || err.code === 'model_not_found' || err.status === 404 || String(err.status).toUpperCase && String(err.status).toUpperCase().includes('NOT_FOUND') || err.code === 404;
  sttDisabled = true; // stop hammering the API every few seconds
  if (noAccess) {
    send('status', { message: 'Transcription off: your ' + err.provider + ' key has no access to a speech-to-text model (403/404). Screen + LeetCode still work. To enable listening: give the key Whisper/transcription access, or add a Google Speech service account JSON in Settings.' });
  } else {
    send('status', { message: 'Transcription error (' + err.provider + '): ' + err.message });
  }
}
