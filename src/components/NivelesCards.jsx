import EditableHtml from './EditableHtml';

const STAGE_COLORS = ['#8fa3b0', '#8fd15b', '#e8a13f', '#f0754f', '#e64fe6'];
const FIELDS = [
  ['miembros', 'Miembros'],
  ['requisito', 'Requisito'],
  ['desbloquea', 'Desbloquea'],
  ['limite', 'Límite semanal'],
];

export default function NivelesCards({ niveles, onCellChange }) {
  return (
    <div className="cards">
      {niveles.map((n, idx) => (
        <div className="card" key={idx} style={{ '--stage-color': STAGE_COLORS[idx % STAGE_COLORS.length] }}>
          <EditableHtml
            as="h3"
            singleLine
            html={n.nivel}
            onChange={(html) => onCellChange(idx, 'nivel', html)}
          />
          <dl>
            {FIELDS.map(([field, label]) => (
              <div key={field}>
                <dt>{label}</dt>
                <EditableHtml
                  as="dd"
                  singleLine
                  html={n[field]}
                  onChange={(html) => onCellChange(idx, field, html)}
                />
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
