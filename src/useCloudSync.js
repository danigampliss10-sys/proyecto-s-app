import { useEffect, useRef, useState } from 'react';
import { supabase, supabaseConfigured } from './supabaseClient';

const TABLE = 'proyecto_s';
const LOG_TABLE = 'proyecto_s_log';
const ROW_ID = 1;
const WRITE_DEBOUNCE_MS = 600;

function isTyping() {
  const a = document.activeElement;
  if (!a || a === document.body) return false;
  const tag = a.tagName;
  return tag === 'TEXTAREA' || tag === 'INPUT' || a.isContentEditable === true;
}

/* Mantiene `data` sincronizado con una fila de Supabase (id=1, columna content jsonb).
   Escribe en la nube con un pequeño debounce tras cada cambio, y aplica los cambios
   que lleguen de otros usuarios en tiempo real — salvo que estés escribiendo en ese
   momento, en cuyo caso se aplican en cuanto sueltas el campo (blur). */
export function useCloudSync(data, setData, showToast, editorName) {
  const [status, setStatus] = useState(supabaseConfigured ? 'connecting' : 'offline');
  const suppressRef = useRef(false);
  const lastSyncedRef = useRef(null);
  const pendingRemoteRef = useRef(null);
  const writeTimerRef = useRef(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Carga inicial + suscripción en tiempo real
  useEffect(() => {
    if (!supabaseConfigured) return;
    let channel;
    let cancelled = false;

    async function init() {
      const { data: row, error } = await supabase.from(TABLE).select('content').eq('id', ROW_ID).maybeSingle();
      if (cancelled) return;
      if (error) {
        setStatus('offline');
        return;
      }
      if (row && row.content) {
        suppressRef.current = true;
        setData(row.content);
        lastSyncedRef.current = JSON.stringify(row.content);
        suppressRef.current = false;
      } else {
        const initial = dataRef.current;
        await supabase.from(TABLE).upsert({ id: ROW_ID, content: initial });
        lastSyncedRef.current = JSON.stringify(initial);
      }
      setStatus('live');

      channel = supabase
        .channel('proyecto-s-sync')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: TABLE, filter: `id=eq.${ROW_ID}` },
          (payload) => {
            const remote = payload.new?.content;
            if (!remote) return;
            const remoteStr = JSON.stringify(remote);
            if (remoteStr === lastSyncedRef.current) return; // eco de nuestro propio guardado
            if (isTyping()) {
              pendingRemoteRef.current = remote;
            } else {
              suppressRef.current = true;
              setData(remote);
              lastSyncedRef.current = remoteStr;
              suppressRef.current = false;
              showToast('Cambios de otro usuario aplicados');
            }
          }
        )
        .subscribe();
    }

    init();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aplica el cambio remoto en espera en cuanto el usuario deja de escribir en algún campo
  useEffect(() => {
    function onFocusOut() {
      if (pendingRemoteRef.current) {
        const v = pendingRemoteRef.current;
        pendingRemoteRef.current = null;
        suppressRef.current = true;
        setData(v);
        lastSyncedRef.current = JSON.stringify(v);
        suppressRef.current = false;
        showToast('Cambios de otro usuario aplicados');
      }
    }
    document.addEventListener('focusout', onFocusOut);
    return () => document.removeEventListener('focusout', onFocusOut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escribe en Supabase (con debounce) cada vez que cambian los datos localmente
  useEffect(() => {
    if (!supabaseConfigured) return;
    if (suppressRef.current) return;
    const str = JSON.stringify(data);
    if (str === lastSyncedRef.current) return;
    clearTimeout(writeTimerRef.current);
    writeTimerRef.current = setTimeout(async () => {
      lastSyncedRef.current = str;
      const { error } = await supabase.from(TABLE).update({ content: data }).eq('id', ROW_ID);
      if (error) {
        setStatus('offline');
        return;
      }
      supabase.from(LOG_TABLE).insert({ editor: editorName || 'Desconocido', content: data }).then(() => {});
    }, WRITE_DEBOUNCE_MS);
    return () => clearTimeout(writeTimerRef.current);
  }, [data]);

  return status;
}
