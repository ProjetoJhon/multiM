import type { MediaAttachment } from '../types';

const uid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

export async function fileToAttachment(file: File): Promise<MediaAttachment> {
  const isImage = file.type.startsWith('image/');
  const isAudio = file.type.startsWith('audio/');
  const processed = isImage ? await compressImage(file) : file;
  const base64 = await blobToBase64(processed);
  return {
    id: uid(),
    kind: isImage ? 'image' : isAudio ? 'audio' : 'file',
    name: file.name,
    mimeType: processed.type || file.type || 'application/octet-stream',
    base64,
    previewUrl: isImage ? URL.createObjectURL(processed) : undefined,
    size: processed.size,
  };
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return dataUrl.split(',')[1] ?? '';
}

export async function compressImage(
  file: File,
  maxWidth = 1600,
  quality = 0.82,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  bitmap.close();
  return blob ?? file;
}

export async function startAudioRecording(): Promise<{
  stop: () => Promise<MediaAttachment>;
  cancel: () => void;
}> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start();

  const cleanup = () => stream.getTracks().forEach((t) => t.stop());

  return {
    stop: () =>
      new Promise<MediaAttachment>((resolve, reject) => {
        recorder.onerror = () => {
          cleanup();
          reject(new Error('Erro durante a gravação de áudio.'));
        };
        recorder.onstop = async () => {
          cleanup();
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const base64 = await blobToBase64(blob);
          resolve({
            id: uid(),
            kind: 'audio',
            name: `gravacao-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.webm`,
            mimeType: blob.type,
            base64,
            size: blob.size,
          });
        };
        if (recorder.state !== 'inactive') recorder.stop();
      }),
    cancel: () => {
      if (recorder.state !== 'inactive') recorder.stop();
      cleanup();
    },
  };
}
