import { useCallback, useRef, useState } from 'react';
import { getStoredEditorName, saveEditorName } from './editorName';
import { defaultData, TABLE_CONFIG } from './defaultData';
import { useCloudSync } from './useCloudSync';
import { supabaseConfigured } from './supabaseClient';
import EditableHtml from './components/EditableHtml';
import DataTable from './components/DataTable';
import NivelesCards from './components/NivelesCards';
import './App.css';

const TABS = [
  { key: 'niveles', staticId: 'tab-niveles', label: 'Niveles de Banda' },
  { key: 'robos', staticId: 'tab-robos', label: 'Robos por Clase' },
  { key: 'materiales', staticId: 'tab-materiales', label: 'Materiales' },
  { key: 'crafteo', staticId: 'tab-crafteo', label: 'Crafteo' },
  { key: 'mesas', staticId: 'tab-mesas', label: 'Mesas y NPCs' },
  { key: 'licencias', staticId: 'tab-licencias', label: 'Ammu-Nation legal' },
];

export default function App() {
  const [data, setData] = useState(defaultData);
  const [activeTab, setActiveTab] = useState('niveles');
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const [editorName, setEditorName] = useState(getStoredEditorName);
  const [nameDraft, setNameDraft] = useState('');
  const syncStatus = useCloudSync(data, setData, showToast, editorName);

  const confirmName = () => {
    setEditorName(saveEditorName(nameDraft));
  };

  const updateStatic = useCallback((id, html) => {
    setData((prev) => ({ ...prev, estatico: { ...prev.estatico, [id]: html } }));
  }, []);

  const updateNote = useCallback((id, html) => {
    setData((prev) => ({ ...prev, notas: { ...prev.notas, [id]: html } }));
  }, []);

  const updateCell = useCallback((tableKey, idx, col, value) => {
    setData((prev) => {
      const rows = prev[tableKey].slice();
      rows[idx] = { ...rows[idx], [col]: value };
      return { ...prev, [tableKey]: rows };
    });
  }, []);

  const addRow = useCallback((tableKey) => {
    setData((prev) => ({ ...prev, [tableKey]: [...prev[tableKey], { ...TABLE_CONFIG[tableKey].empty }] }));
    showToast('Fila añadida');
  }, [showToast]);

  const deleteRow = useCallback((tableKey, idx) => {
    setData((prev) => {
      const rows = prev[tableKey].slice();
      rows.splice(idx, 1);
      return { ...prev, [tableKey]: rows };
    });
    showToast('Fila eliminada');
  }, [showToast]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proyecto-s-faccion-ilegal.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON exportado');
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        setData(parsed);
        showToast('JSON importado correctamente');
      } catch {
        showToast('Error al leer el JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const statusLabel = {
    connecting: '● Conectando…',
    live: '● En vivo',
    offline: supabaseConfigured ? '● Sin conexión' : '● Sin conexión (Supabase no configurado)',
  }[syncStatus];

  return (
    <>
      <header>
        <div className="brand">
          <div className="mark">S</div>
          <div>
            <EditableHtml as="h1" singleLine html={data.estatico['brand-title']} onChange={(h) => updateStatic('brand-title', h)} />
            <EditableHtml as="p" html={data.estatico['brand-tagline']} onChange={(h) => updateStatic('brand-tagline', h)} />
          </div>
        </div>
        <div className="toolbar">
          <span className={`sync-status ${syncStatus === 'live' ? 'sync-on' : 'sync-off'}`}>{statusLabel}</span>
          <button className="ghost" onClick={handleExport}>⬇ Exportar JSON</button>
          <button className="ghost" onClick={() => fileInputRef.current?.click()}>⬆ Importar JSON</button>
          <input ref={fileInputRef} type="file" className="import-input" accept="application/json" onChange={handleImportFile} />
          <button className="primary" onClick={() => window.print()}>🖨 Imprimir / PDF</button>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
            <EditableHtml
              as="span"
              singleLine
              className="tab-label"
              html={data.estatico[t.staticId]}
              onChange={(h) => updateStatic(t.staticId, h)}
            />
          </button>
        ))}
      </nav>

      <main>
        <section className={`view${activeTab === 'niveles' ? ' active' : ''}`}>
          <SectionHead data={data} id="sh1" updateStatic={updateStatic} />
          <Note data={data} id="n01" updateNote={updateNote} />
          <Note data={data} id="n02" updateNote={updateNote} />
          <Note data={data} id="n03" updateNote={updateNote} />
          <NivelesCards niveles={data.niveles} onCellChange={(idx, field, v) => updateCell('niveles', idx, field, v)} />

          <SectionHead data={data} id="sh2" updateStatic={updateStatic} />
          <Note data={data} id="n04" updateNote={updateNote} />

          <SectionHead data={data} id="sh3" hintId="hint3" updateStatic={updateStatic} />
          <Note data={data} id="n05" updateNote={updateNote} />
          <Note data={data} id="n06" updateNote={updateNote} />

          <SectionHead data={data} id="sh4" hintId="hint4" updateStatic={updateStatic} />
          <DataTable
            tableKey="niveles"
            config={TABLE_CONFIG.niveles}
            rows={data.niveles}
            estatico={data.estatico}
            onHeaderChange={updateStatic}
            onCellChange={(idx, col, v) => updateCell('niveles', idx, col, v)}
            onDeleteRow={(idx) => deleteRow('niveles', idx)}
            onAddRow={() => addRow('niveles')}
          />
        </section>

        <section className={`view${activeTab === 'robos' ? ' active' : ''}`}>
          <Note data={data} id="n12" updateNote={updateNote} />
          <Note data={data} id="n07" updateNote={updateNote} />
          <SectionHead data={data} id="sh5" hintId="hint5" updateStatic={updateStatic} />
          <DataTable
            tableKey="reglasClase"
            config={TABLE_CONFIG.reglasClase}
            rows={data.reglasClase}
            estatico={data.estatico}
            onHeaderChange={updateStatic}
            onCellChange={(idx, col, v) => updateCell('reglasClase', idx, col, v)}
            onDeleteRow={(idx) => deleteRow('reglasClase', idx)}
            onAddRow={() => addRow('reglasClase')}
          />

          <Note data={data} id="n13" updateNote={updateNote} />
          <SectionHead data={data} id="sh6" hintId="hint6" updateStatic={updateStatic} />
          <DataTable
            tableKey="robos"
            config={TABLE_CONFIG.robos}
            rows={data.robos}
            estatico={data.estatico}
            onHeaderChange={updateStatic}
            onCellChange={(idx, col, v) => updateCell('robos', idx, col, v)}
            onDeleteRow={(idx) => deleteRow('robos', idx)}
            onAddRow={() => addRow('robos')}
          />
        </section>

        <section className={`view${activeTab === 'materiales' ? ' active' : ''}`}>
          <SectionHead data={data} id="sh7" hintId="hint7" updateStatic={updateStatic} />
          <Note data={data} id="n08" updateNote={updateNote} />
          <Note data={data} id="n14" updateNote={updateNote} />
          <Note data={data} id="n09" updateNote={updateNote} />
          <DataTable
            tableKey="materiales"
            config={TABLE_CONFIG.materiales}
            rows={data.materiales}
            estatico={data.estatico}
            onHeaderChange={updateStatic}
            onCellChange={(idx, col, v) => updateCell('materiales', idx, col, v)}
            onDeleteRow={(idx) => deleteRow('materiales', idx)}
            onAddRow={() => addRow('materiales')}
          />
        </section>

        <section className={`view${activeTab === 'crafteo' ? ' active' : ''}`}>
          <SectionHead data={data} id="sh8" hintId="hint8" updateStatic={updateStatic} />
          <DataTable
            tableKey="crafteo"
            config={TABLE_CONFIG.crafteo}
            rows={data.crafteo}
            estatico={data.estatico}
            onHeaderChange={updateStatic}
            onCellChange={(idx, col, v) => updateCell('crafteo', idx, col, v)}
            onDeleteRow={(idx) => deleteRow('crafteo', idx)}
            onAddRow={() => addRow('crafteo')}
          />
        </section>

        <section className={`view${activeTab === 'mesas' ? ' active' : ''}`}>
          <SectionHead data={data} id="sh9" hintId="hint9" updateStatic={updateStatic} />
          <Note data={data} id="n10" updateNote={updateNote} />
          <DataTable
            tableKey="mesas"
            config={TABLE_CONFIG.mesas}
            rows={data.mesas}
            estatico={data.estatico}
            onHeaderChange={updateStatic}
            onCellChange={(idx, col, v) => updateCell('mesas', idx, col, v)}
            onDeleteRow={(idx) => deleteRow('mesas', idx)}
            onAddRow={() => addRow('mesas')}
          />

          <Note data={data} id="n15" updateNote={updateNote} />
          <SectionHead data={data} id="sh10" hintId="hint10" updateStatic={updateStatic} />
          <DataTable
            tableKey="npcs"
            config={TABLE_CONFIG.npcs}
            rows={data.npcs}
            estatico={data.estatico}
            onHeaderChange={updateStatic}
            onCellChange={(idx, col, v) => updateCell('npcs', idx, col, v)}
            onDeleteRow={(idx) => deleteRow('npcs', idx)}
            onAddRow={() => addRow('npcs')}
          />
        </section>

        <section className={`view${activeTab === 'licencias' ? ' active' : ''}`}>
          <SectionHead data={data} id="sh11" hintId="hint11" updateStatic={updateStatic} />
          <Note data={data} id="n11" updateNote={updateNote} />
          <DataTable
            tableKey="licencias"
            config={TABLE_CONFIG.licencias}
            rows={data.licencias}
            estatico={data.estatico}
            onHeaderChange={updateStatic}
            onCellChange={(idx, col, v) => updateCell('licencias', idx, col, v)}
            onDeleteRow={(idx) => deleteRow('licencias', idx)}
            onAddRow={() => addRow('licencias')}
          />
        </section>
      </main>

      <EditableHtml as="footer" singleLine html={data.estatico.footer} onChange={(h) => updateStatic('footer', h)} />

      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>

      {!editorName && (
        <div className="name-modal-backdrop">
          <div className="name-modal">
            <h2>¿Cómo te llamas?</h2>
            <p>Se usa solo para el registro interno de cambios, no aparece en la web.</p>
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && nameDraft.trim() && confirmName()}
              placeholder="Tu nombre"
            />
            <button className="primary" disabled={!nameDraft.trim()} onClick={confirmName}>
              Continuar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SectionHead({ data, id, hintId, updateStatic }) {
  return (
    <div className="section-head">
      <EditableHtml as="h2" singleLine html={data.estatico[id]} onChange={(h) => updateStatic(id, h)} />
      {hintId && (
        <EditableHtml as="span" singleLine className="hint" html={data.estatico[hintId]} onChange={(h) => updateStatic(hintId, h)} />
      )}
    </div>
  );
}

function Note({ data, id, updateNote }) {
  return <EditableHtml as="div" className="note" html={data.notas[id]} onChange={(h) => updateNote(id, h)} />;
}
