import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { 
  FileCode2, 
  Eye, 
  Edit3, 
  Copy, 
  Check, 
  TableProperties, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  RotateCcw,
  CheckCircle2
} from "lucide-react";

interface MarkdownViewerSectionProps {
  markdown: string;
  onMarkdownChange: (newMd: string) => void;
  onConvertToTable: () => Promise<void>;
  isConverting: boolean;
  onReset: () => void;
  hasRecords: boolean;
}

export const MarkdownViewerSection: React.FC<MarkdownViewerSectionProps> = ({
  markdown,
  onMarkdownChange,
  onConvertToTable,
  isConverting,
  onReset,
  hasRecords
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-200 shadow-md overflow-hidden animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="px-5 py-4 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800">
                Bước 1 hoàn thành
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Văn bản & Bảng Markdown đã quét từ tài liệu
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Nội dung đã được OCR chuyển thành Markdown. Bạn có thể kiểm tra, chỉnh sửa văn bản trước khi chuyển sang bảng dữ liệu.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Switch Tab */}
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "preview"
                  ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trực quan</span>
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "raw"
                  ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Mã nguồn / Sửa thô</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Sao chép Markdown"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Sao chép</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5">
        {activeTab === "preview" ? (
          <div className="prose prose-slate max-w-none text-xs sm:text-sm bg-slate-50/50 p-4 rounded-xl border border-slate-200 overflow-x-auto max-h-[480px] overflow-y-auto">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-base sm:text-lg font-bold text-slate-900 mb-2 border-b pb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm sm:text-base font-bold text-slate-800 mt-3 mb-1.5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mt-2 mb-1">{children}</h3>,
                p: ({ children }) => <p className="mb-2 leading-relaxed text-slate-700">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-slate-700">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-slate-700">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 rounded-lg border border-slate-300 shadow-2xs">
                    <table className="min-w-full divide-y divide-slate-300 text-xs text-left bg-white">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-slate-100 font-semibold text-slate-900">{children}</thead>,
                tbody: ({ children }) => <tbody className="divide-y divide-slate-200">{children}</tbody>,
                tr: ({ children }) => <tr className="hover:bg-slate-50/80 transition-colors">{children}</tr>,
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left font-bold text-slate-900 border border-slate-300 bg-slate-100 whitespace-nowrap">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-slate-800 border border-slate-200 align-top">
                    {children}
                  </td>
                ),
                strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={12}
              value={markdown}
              onChange={(e) => onMarkdownChange(e.target.value)}
              className="w-full p-4 text-xs sm:text-sm font-mono text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
              placeholder="Nội dung Markdown..."
            />
            <p className="text-[11px] text-slate-400 italic">
              * Bạn có thể sửa trực tiếp họ tên, số liệu, năm học hoặc thêm hàng vào bảng Markdown trước khi chuyển thành bảng dữ liệu hồ sơ.
            </p>
          </div>
        )}

        {/* Footer Step 2 Action */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Quy trình xử lý:</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              1. Đã quét xong Markdown
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={hasRecords ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
              2. Chuyển thành Bảng dữ liệu hồ sơ
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onReset}
              className="px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Quét tệp khác
            </button>

            <button
              onClick={onConvertToTable}
              disabled={isConverting || !markdown.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang chuyển thành Bảng dữ liệu...</span>
                </>
              ) : (
                <>
                  <TableProperties className="w-4 h-4 text-emerald-200" />
                  <span>2. Chuyển thành Bảng hồ sơ & Thống kê</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
