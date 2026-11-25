import { useRef, useState } from 'react';
import { Camera, FileUp, Mic, Search as SearchIcon, Square, X } from 'lucide-react';
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
  const [focused, setFocused] = useState(false);
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
    <div className="no-print w-full">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 px-2">
          {attachments.map((att) => (
            <span key={att.id} className="inline-flex items-center gap-2 rounded-full bg-[#f1f3f4] px-3 py-1 text-xs text-[#3c4043]">
              {att.kind === 'image' ? 'Imagem' : att.kind === 'audio' ? 'Áudio' : 'Arquivo'}: {att.name}
              <button type="button" onClick={() => setAttachments((p) => p.filter((x) => x.id !== att.id))} aria-label={`Remover ${att.name}`}>
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div
        className={`flex items-center gap-2 bg-white border border-[#dfe1e5] rounded-full px-4 transition-shadow ${
          focused || !compact ? 'hover:shadow-[0_1px_6px_rgba(32,33,36,.28)] hover:border-transparent' : ''
        } ${focused ? 'shadow-[0_1px_6px_rgba(32,33,36,.28)] border-transparent' : ''} ${compact ? 'h-11' : 'h-12 sm:h-[46px]'}`}
      >
        <SearchIcon className="shrink-0 text-[#9aa0a6]" size={20} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={1}
          placeholder="Pesquise no MultiM ou digite uma URL"
          className="flex-1 resize-none border-0 bg-transparent text-base text-[#202124] outline-none placeholder:text-[#9aa0a6] py-2 leading-6"
        />
        <div className="flex items-center gap-0.5 shrink-0">
          {text && (
            <button type="button" onClick={() => setText('')} className="p-2 text-[#70757a] hover:text-[#202124]" aria-label="Limpar">
              <X size={20} />
            </button>
          )}
          <IconBtn icon={recording ? Square : Mic} active={!!recording} onClick={() => void toggleRecording()} label="Pesquisa por voz" />
          <IconBtn icon={Camera} onClick={() => imageRef.current?.click()} label="Pesquisa por imagem" />
          <IconBtn icon={FileUp} onClick={() => fileRef.current?.click()} label="Anexar arquivo" />
        </div>
      </div>

      <input ref={imageRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
      <input ref={fileRef} type="file" accept=".pdf,.csv,.txt,.md,.json,image/*,audio/*" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />

      {error && <p className="mt-2 px-4 text-sm text-[#d93025]">{error}</p>}
    </div>
  );
}

function IconBtn({ icon: Icon, onClick, active, label }: { icon: React.ElementType; onClick: () => void; active?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${active ? 'text-[#d93025] bg-red-50' : 'text-[#4285f4] hover:bg-[#f1f3f4]'}`}
    >
      <Icon size={20} />
    </button>
  );
}
