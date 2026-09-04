'use client';

import { FileSpreadsheet, FileText } from 'lucide-react';
import { exportToExcel, exportToPdf } from '@/lib/utils/export';

interface ExportBarProps {
  data: Record<string, unknown>[];
  filename: string;
  pdfElementId: string;
}

export function ExportBar({ data, filename, pdfElementId }: ExportBarProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportToExcel(data, filename)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <FileSpreadsheet className="h-4 w-4 text-green-600" />
        Excel
      </button>
      <button
        onClick={() => exportToPdf(pdfElementId, filename)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <FileText className="h-4 w-4 text-red-600" />
        PDF
      </button>
    </div>
  );
}
