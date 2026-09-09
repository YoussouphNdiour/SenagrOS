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
}

function MobileCard<T extends Record<string, unknown>>({
  row,
  columns,
  onClick,
}: {
  row: T;
  columns: Column<T>[];
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-gray-200 bg-white p-4 ${
        onClick ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
    >
      {columns.map((col) => (
        <div key={col.key} className="flex items-start justify-between py-1 text-sm">
          <span className="font-medium text-gray-500">{col.header}</span>
          <span className="ml-4 text-right text-gray-800">
            {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = '—',
  onRowClick,
  mobileRender,
}: DataTableProps<T>) {
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
                  className={`px-4 py-3 text-left font-medium text-gray-600 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-gray-100 transition ${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                      {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">{emptyMessage}</p>
        ) : (
          data.map((row, idx) =>
            mobileRender ? (
              <div key={idx}>{mobileRender(row)}</div>
            ) : (
              <MobileCard
                key={idx}
                row={row}
                columns={columns}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              />
            ),
          )
        )}
      </div>
    </>
  );
}
