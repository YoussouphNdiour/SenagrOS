'use client';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  mobileRender?: (row: T) => React.ReactNode;
  /**
   * Cle stable d'une ligne. Par defaut `row.id` quand il existe.
   *
   * Les lignes etaient indexees par leur position : apres un tri, un filtre
   * ou une suppression, React reutilisait l'etat d'une ligne pour une autre
   * — champ de saisie garni de la mauvaise valeur, case cochee qui se
   * deplace.
   */
  rowKey?: (row: T, index: number) => string | number;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'Aucune donnée',
  onRowClick,
  mobileRender,
  rowKey,
}: DataTableProps<T>) {
  const keyOf = (row: T, index: number): string | number => {
    if (rowKey) return rowKey(row, index);
    const id = row.id;
    if (typeof id === 'string' || typeof id === 'number') return id;
    // Jeu de donnees sans identifiant : la position reste le seul repere.
    return index;
  };

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 py-12 text-center text-sm text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-medium text-gray-600 ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={keyOf(row, idx)}
                className={`border-b border-gray-100 last:border-0 ${
                  onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${col.className ?? ''}`}
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {data.map((row, idx) =>
          mobileRender ? (
            <div
              key={keyOf(row, idx)}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {mobileRender(row)}
            </div>
          ) : (
            <div
              key={keyOf(row, idx)}
              className={`rounded-xl border border-gray-200 bg-white p-4 ${
                onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between py-1 text-sm">
                  <span className="text-gray-500">{col.header}</span>
                  <span className="ml-4 text-right font-medium text-gray-800">
                    {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                  </span>
                </div>
              ))}
            </div>
          ),
        )}
      </div>
    </>
  );
}
