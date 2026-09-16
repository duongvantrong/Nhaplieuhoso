import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  Sparkles, 
  FileCheck, 
  Trash2, 
  BookOpen, 
  Image as ImageIcon, 
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  CheckCircle,
  Layers,
  Plus,
  Files
} from "lucide-react";
import { SAMPLE_DOCUMENTS, SampleDoc } from "../data/sampleDocuments";
import { UploadedFileItem } from "../types";

export interface FilePayload {
  fileBase64: string;
  mimeType: string;
  fileName: string;
}

export interface ProcessPayload {
  text?: string;
  files?: FilePayload[];
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}

interface InputSectionProps {
  onScanToMarkdown: (payload: ProcessPayload) => Promise<void>;
  onAutoProcessAll: (payload: ProcessPayload) => Promise<void>;
  isLoading: boolean;
  loadingStepText?: string;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  onScanToMarkdown, 
  onAutoProcessAll, 
  isLoading,
  loadingStepText 
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "text">("upload");
  const [inputText, setInputText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<UploadedFileItem[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Convert a File object to base64 and return UploadedFileItem
  const readFileAsBase64 = (file: File): Promise<UploadedFileItem> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1] || "";
        resolve({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          base64: base64Data,
          previewUrl: file.type.startsWith("image/") ? result : undefined,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          status: "idle"
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // Process incoming files (from input or drop) and append to state
  const handleAddFiles = async (newFileList: FileList | File[]) => {
    const filesArray = Array.from(newFileList);
    if (filesArray.length === 0) return;

    const processed = await Promise.all(filesArray.map(readFileAsBase64));
    setSelectedFiles((prev) => {
      // Avoid duplicate file objects with identical name and size
      const existingKeys = new Set(prev.map((f) => `${f.fileName}_${f.fileSize}`));
      const uniqueNew = processed.filter((p) => !existingKeys.has(`${p.fileName}_${p.fileSize}`));
      return [...prev, ...uniqueNew];
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAddFiles(e.target.files);
      // Reset input value so same files can be re-selected if user removed them
      e.target.value = "";
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
      setActiveTab("upload");
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
  };

  const handleLoadSample = (sample: SampleDoc) => {
    setInputText(sample.content);
    setActiveTab("text");
  };

  const getPayload = (): ProcessPayload | null => {
    if (activeTab === "upload" && selectedFiles.length > 0) {
      const filesPayload: FilePayload[] = selectedFiles.map((item) => ({
        fileBase64: item.base64,
        mimeType: item.mimeType,
        fileName: item.fileName
      }));

      return {
        files: filesPayload,
        // Backward compatibility if single file
        fileBase64: filesPayload[0]?.fileBase64,
        mimeType: filesPayload[0]?.mimeType,
        fileName: filesPayload[0]?.fileName
      };
    } else if (activeTab === "text" && inputText.trim()) {
      return {
        text: inputText
      };
    }
    return null;
  };

  const handleStartScanToMarkdown = async () => {
    const payload = getPayload();
    if (payload) {
      await onScanToMarkdown(payload);
    }
  };

  const handleStartAutoAll = async () => {
    const payload = getPayload();
    if (payload) {
      await onAutoProcessAll(payload);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.fileSize, 0);

  // Helper to determine file badge
  const getFileBadge = (fileName: string, mimeType: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".docx") || mimeType.includes("word")) {
      return { label: "DOCX", color: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
      return { label: "PDF", color: "bg-rose-50 text-rose-700 border-rose-200" };
    }
    if (mimeType.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(lower)) {
      return { label: "ẢNH", color: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (lower.endsWith(".csv") || lower.endsWith(".xlsx")) {
      return { label: "BẢNG", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    return { label: "VĂN BẢN", color: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".docx,.pdf,.txt,.md,.csv,.png,.jpg,.jpeg,.webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-4 sm:px-6 pt-3 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === "upload"
                ? "bg-white text-emerald-700 border-emerald-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-300"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Tải tệp lên ({selectedFiles.length > 0 ? `${selectedFiles.length} tệp` : "Hỗ trợ nhiều tệp"})</span>
          </button>
          <button
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === "text"
                ? "bg-white text-emerald-700 border-emerald-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Nhập hoặc dán văn bản</span>
          </button>
        </div>

        {/* Sample Docs Quick Dropdown/Buttons */}
        <div className="py-2 flex items-center gap-1.5">
          <span className="text-xs text-slate-400 hidden md:inline flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            Dữ liệu mẫu:
          </span>
          {SAMPLE_DOCUMENTS.map((sample, idx) => (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample)}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors shadow-2xs"
              title={sample.description}
            >
              Mẫu {idx + 1}: {sample.title.split("-")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-4">
        {activeTab === "upload" ? (
          <div>
            {selectedFiles.length === 0 ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-50/50 scale-[0.99]"
                    : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50/60"
                }`}
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Files className="w-7 h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-1">
                  Nhấp để chọn một hoặc nhiều tệp, hoặc kéo thả đồng thời vào đây
                </h3>
                <p className="text-xs text-slate-500 max-w-lg mx-auto mb-3">
                  Cho phép tải lên <strong>nhiều tệp cùng lúc</strong>: Quyết định nâng lương, danh sách khen thưởng, bằng khen ảnh chụp, trích ngang lý lịch (Word <strong>.docx</strong>, PDF <strong>.pdf</strong>, Ảnh <strong>.png, .jpg</strong>, Text <strong>.txt</strong>).
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-mono">Word (.docx)</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-mono">PDF Scan (.pdf)</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-mono">Ảnh (.png, .jpg)</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-mono">Text (.txt, .md)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Tải nhiều tệp đồng thời</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Header bar of selected files */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {selectedFiles.length}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-emerald-950">
                        Đã chọn {selectedFiles.length} tệp tài liệu
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Tổng dung lượng: {formatFileSize(totalBytes)} • Sẵn sàng quét và trích xuất
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Thêm tệp khác</span>
                    </button>
                    <button
                      onClick={handleClearAllFiles}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Xóa tất cả các tệp đã chọn"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Xóa hết</span>
                    </button>
                  </div>
                </div>

                {/* Grid of file items */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto p-1">
                  {selectedFiles.map((f, index) => {
                    const badge = getFileBadge(f.fileName, f.mimeType);
                    return (
                      <div
                        key={f.id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-2xs flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {f.previewUrl ? (
                            <img
                              src={f.previewUrl}
                              alt={f.fileName}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${badge.color}`}>
                                {badge.label}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate" title={f.fileName}>
                              <span className="text-slate-400 font-mono mr-1">#{index + 1}</span>
                              {f.fileName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {formatFileSize(f.fileSize)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveFile(f.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                          title="Bỏ tệp này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Dán nội dung văn bản, sơ yếu lý lịch, báo cáo thành tích, danh sách cán bộ công chức hoặc biên bản tại đây..."
              className="w-full p-4 text-xs sm:text-sm font-normal text-slate-900 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 leading-relaxed font-mono"
            />
            <div className="flex justify-between items-center text-xs text-slate-400 px-1">
              <span>Độ dài: {inputText.length} ký tự ({inputText.trim() ? inputText.trim().split(/\s+/).length : 0} từ)</span>
              {inputText && (
                <button
                  onClick={() => setInputText("")}
                  className="text-rose-600 hover:underline inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Xóa nội dung
                </button>
              )}
            </div>
          </div>
        )}

        {/* Features banner & Action Buttons */}
        <div className="pt-2 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Quy tắc sắp xếp & hợp nhất:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold">
              Cùng 1 người: Sắp xếp Thành tích theo thời gian (năm)
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/60 font-semibold">
              Cùng 1 người: Cập nhật Thâm niên & Hệ số mới nhất
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200/60 font-semibold">
              Nhiều người: Sắp xếp theo TÊN (A ➔ Z)
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Step 1 button */}
            <button
              onClick={handleStartScanToMarkdown}
              disabled={
                isLoading ||
                (activeTab === "upload" && selectedFiles.length === 0) ||
                (activeTab === "text" && !inputText.trim())
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Quét tài liệu và xuất ra văn bản Markdown trước để kiểm tra, chỉnh sửa"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{loadingStepText || "Đang xử lý..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>
                    1. Quét {selectedFiles.length > 1 ? `${selectedFiles.length} tệp` : "tệp"} & Chuyển sang Markdown
                  </span>
                </>
              )}
            </button>

            {/* Quick 1-click Auto flow */}
            <button
              onClick={handleStartAutoAll}
              disabled={
                isLoading ||
                (activeTab === "upload" && selectedFiles.length === 0) ||
                (activeTab === "text" && !inputText.trim())
              }
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Tự động quét toàn bộ tệp sang Markdown rồi xuất thẳng thành Bảng hồ sơ đã gộp và sắp xếp"
            >
              <span>Chạy tự động toàn bộ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
