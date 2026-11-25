import { useRef, useState } from 'react';
import { Camera, FileUp, Loader2, Mic, Send, Square, X } from 'lucide-react';
import type { MediaAttachment, OmniInputPayload, QuickMode } from '../types';
import { fileToAttachment, startAudioRecording } from '../services/mediaProcessor';

interface Props {
  mode: QuickMode;
  loading: boolean;
  onSubmit: (payload: OmniInputPayload) => Promise<void> | void;
}

export function OmniInputBar({ mode, loading, onSubmit }: Props) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [recording, setRecording] = useState<null | { stop: () => Promise<MediaAttachment>; cancel: () => void }>(null);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSend = !loading && (text.trim().length > 0 || attachments.length > 0);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    try {
      const next = await Promise.all(Array.from(files).map(fileToAttachment));
      setAttachments((prev) => [...prev, ...next].slice(0, 6));
    } catch {
      setError('Não foi possível processar o arquivo.');
    }
  }

  async function toggleRecording() {
    setError(null);
    if (recording) {
      try {
        const audio = await recording.stop();
        setAttachments((prev) => [...prev, audio]);
      } catch {
        setError('Falha ao finalizar gravação.');
      } finally {
        setRecording(null);
      }
      return;
    }
    try {
      const rec = await startAudioRecording();
      setRecording(rec);
    } catch {
      setError('Microfone indisponível ou permissão negada.');
    }
  }

  async function submit() {
    if (!canSend) return;
    setError(null);
    const payload: OmniInputPayload = { text: text.trim(), attachments, mode };
    await onSubmit(payload);
    setText('');
    setAttachments([]);
  }

  return (
    <div className="no-print rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,.06)]">
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 px-1">
          {attachments.map((att) => (
            <span key={att.id} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {att.kind === 'image' ? 'Imagem' : att.kind === 'audio' ? 'Áudio' : 'Arquivo'}: {att.name}
              <button type="button" onClick={() => setAttachments((p) => p.filter((x) => x.id !== att.id))} aria-label={`Remover ${att.name}`}>
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={1}
          placeholder="Descreva o problema, cole um texto, grave um áudio ou envie um arquivo..."
          className="max-h-40 min-h-[52px] flex-1 resize-none rounded-2xl border-0 bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-slate-200"
        />
        <button type="button" onClick={() => void submit()} disabled={!canSend} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white disabled:opacity-40" aria-label="Enviar">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
        <input ref={imageRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
        <input ref={fileRef} type="file" accept=".pdf,.csv,.txt,.md,.json,image/*,audio/*" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
        <ActionBtn icon={recording ? Square : Mic} label={recording ? 'Parar' : 'Áudio'} active={!!recording} onClick={() => void toggleRecording()} />
        <ActionBtn icon={Camera} label="Foto" onClick={() => imageRef.current?.click()} />
        <ActionBtn icon={FileUp} label="Arquivo" onClick={() => fileRef.current?.click()} />
        <span className="ml-auto text-xs text-slate-400">Enter envia · Shift+Enter quebra linha</span>
      </div>

      {error && <p className="mt-2 px-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, active }: { icon: React.ElementType; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${active ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
      <Icon size={16} /> {label}
    </button>
  );
}
