import { useRef, useState } from 'react';
import { Camera, FileUp, Loader2, Mic, Search as SearchIcon, Send, Square, X } from 'lucide-react';
import type { MediaAttachment, OmniInputPayload, QuickMode } from '../types';
import { fileToAttachment, startAudioRecording } from '../services/mediaProcessor';

interface Props {
  mode: QuickMode;
  loading: boolean;
  compact?: boolean;
  onSubmit: (payload: OmniInputPayload) => Promise<void> | void;
}

export function OmniInputBar({ mode, loading, compact, onSubmit }: Props) {
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
    <div className={`no-print rounded-2xl border border-slate-200 bg-white ${compact ? 'p-2 shadow-sm' : 'p-3 shadow-[0_2px_12px_rgba(0,0,0,.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,.12)]'} transition-shadow`}>
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 px-1">
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

      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-transparent px-2">
          <SearchIcon className="shrink-0 text-slate-400" size={18} />
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
            placeholder="Pesquise um problema, cole texto, grave áudio ou envie arquivo..."
            className={`max-h-32 w-full resize-none border-0 bg-transparent text-sm outline-none ${compact ? 'py-2' : 'py-3'}`}
          />
        </div>
        <div className="flex items-center gap-1 pr-1">
          <IconBtn icon={recording ? Square : Mic} active={!!recording} onClick={() => void toggleRecording()} label="Áudio" />
          <IconBtn icon={Camera} onClick={() => imageRef.current?.click()} label="Foto" />
          <IconBtn icon={FileUp} onClick={() => fileRef.current?.click()} label="Arquivo" />
          <button type="button" onClick={() => void submit()} disabled={!canSend} className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700" aria-label="Pesquisar">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      <input ref={imageRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
      <input ref={fileRef} type="file" accept=".pdf,.csv,.txt,.md,.json,image/*,audio/*" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />

      {error && <p className="mt-2 px-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function IconBtn({ icon: Icon, onClick, active, label }: { icon: React.ElementType; onClick: () => void; active?: boolean; label: string }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${active ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
      <Icon size={18} />
    </button>
  );
}
