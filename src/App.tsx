import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { InputSection } from "./components/InputSection";
import { MarkdownViewerSection } from "./components/MarkdownViewerSection";
import { DataTable } from "./components/DataTable";
import { StatsCards } from "./components/StatsCards";
import { RecordEditModal } from "./components/RecordEditModal";
import { PersonnelRecord, ExtractionResponse, OcrResponse } from "./types";
import { AlertCircle, CheckCircle2, Info, X, RotateCcw, Sparkles } from "lucide-react";
import { mergeAndSortPersonnelRecords } from "./utils/recordHelpers";
import { ProcessPayload } from "./components/InputSection";

export default function App() {
  const [records, setRecords] = useState<PersonnelRecord[]>(() => {
    try {
      const saved = localStorage.getItem("extracted_personnel_records");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentMarkdown, setCurrentMarkdown] = useState<string>(() => {
    try {
      return localStorage.getItem("extracted_markdown_content") || "";
    } catch {
      return "";
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<ProcessPayload | null>(null);
  const [editingRecord, setEditingRecord] = useState<PersonnelRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("extracted_personnel_records", JSON.stringify(records));
    } catch (e) {
      console.warn("Could not save records to localStorage", e);
    }
  }, [records]);

  useEffect(() => {
    try {
      if (currentMarkdown) {
        localStorage.setItem("extracted_markdown_content", currentMarkdown);
      } else {
        localStorage.removeItem("extracted_markdown_content");
      }
    } catch (e) {
      console.warn("Could not save markdown to localStorage", e);
    }
  }, [currentMarkdown]);

  // Helper: Scan a single file or text payload to markdown
  const scanSinglePayloadToMarkdown = async (singlePayload: {
    text?: string;
    fileBase64?: string;
    mimeType?: string;
    fileName?: string;
  }): Promise<string> => {
    const res = await fetch("/api/ocr-to-markdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(singlePayload)
    });

    const data: OcrResponse = await res.json();
    if (!res.ok || !data.success) {
      let msg = data.error || "Không thể quét và chuyển đổi tài liệu sang Markdown.";
      if (msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE")) {
        msg = "Máy chủ AI hiện đang chịu tải cao tạm thời. Tuyến dự phòng đã sẵn sàng, vui lòng bấm 'Thử lại ngay'.";
      }
      throw new Error(msg);
    }
    return data.markdown || "";
  };

  // Step 1: Scan Multi-file / Image / Text to Markdown
  const handleScanToMarkdown = async (payload: ProcessPayload) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setLastPayload(payload);

    try {
      if (payload.files && payload.files.length > 1) {
        // Multi-file batch scan
        const total = payload.files.length;
        const markdownSections: string[] = [];

        for (let i = 0; i < total; i++) {
          const f = payload.files[i];
          setLoadingStepText(`Bước 1: Đang quét tệp ${i + 1}/${total}: "${f.fileName}"...`);

          try {
            const md = await scanSinglePayloadToMarkdown({
              fileBase64: f.fileBase64,
              mimeType: f.mimeType,
              fileName: f.fileName
            });
            markdownSections.push(`## 📄 Tệp ${i + 1}/${total}: ${f.fileName}\n\n${md}`);
          } catch (fileErr: any) {
            console.warn(`Error scanning file ${f.fileName}:`, fileErr);
            markdownSections.push(`## 📄 Tệp ${i + 1}/${total}: ${f.fileName} (Lỗi đọc tệp)\n\n*Không thể quét tệp này: ${fileErr.message}*`);
          }
        }

        const combined = `# TÀI LIỆU TỔNG HỢP TỪ ${total} TỆP ĐÃ QUÉT\n\n` + markdownSections.join("\n\n---\n\n");
        setCurrentMarkdown(combined);
        setSuccessMessage(
          `Đã quét thành công toàn bộ ${total} tệp tài liệu! Mời bạn xem lại nội dung Markdown bên dưới và bấm "2. Chuyển thành Bảng hồ sơ".`
        );
      } else {
        // Single file or text
        setLoadingStepText("Bước 1: Đang quét OCR tệp & chuyển đổi thành Markdown...");
        const singlePayload = payload.files && payload.files.length === 1
          ? {
              fileBase64: payload.files[0].fileBase64,
              mimeType: payload.files[0].mimeType,
              fileName: payload.files[0].fileName
            }
          : {
              text: payload.text,
              fileBase64: payload.fileBase64,
              mimeType: payload.mimeType,
              fileName: payload.fileName
            };

        const md = await scanSinglePayloadToMarkdown(singlePayload);
        setCurrentMarkdown(md);
        setSuccessMessage(
          "Đã quét và chuyển đổi tài liệu thành Markdown thành công! Hãy kiểm tra nội dung và nhấn '2. Chuyển thành Bảng hồ sơ'."
        );
      }
    } catch (err: any) {
      console.error("Scan to Markdown error:", err);
      let errMsg = err.message || "Đã xảy ra lỗi khi quét tài liệu.";
      if (errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE")) {
        errMsg = "Máy chủ AI hiện đang chịu tải cao tạm thời. Hệ thống đã chuẩn bị tuyến dự phòng, vui lòng bấm 'Thử lại ngay'.";
      }
      setErrorMessage(errMsg);
    } finally {
      setIsLoading(false);
      setLoadingStepText("");
    }
  };

  // Step 2: Convert Markdown to structured Personnel Records Table
  const handleConvertToTable = async () => {
    if (!currentMarkdown.trim()) {
      setErrorMessage("Chưa có nội dung Markdown để chuyển đổi thành bảng.");
      return;
    }

    setIsLoading(true);
    setLoadingStepText("Bước 2: Đang phân tích Markdown và tạo bảng hồ sơ...");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/markdown-to-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: currentMarkdown })
      });

      const data: ExtractionResponse = await res.json();

      if (!res.ok || !data.success) {
        let msg = data.error || "Không thể chuyển đổi Markdown thành bảng hồ sơ.";
        if (msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE")) {
          msg = "Máy chủ AI hiện đang chịu tải cao. Vui lòng bấm thử lại sau vài giây.";
        }
        throw new Error(msg);
      }

      if (!data.records || data.records.length === 0) {
        setErrorMessage("Không tìm thấy thông tin cán bộ phù hợp trong nội dung Markdown để tạo bảng.");
      } else {
        // Merge records: If same person, combine achievements (sorted by year) and update seniority/salary; sort all by Vietnamese Name
        const merged = mergeAndSortPersonnelRecords(records, data.records);
        setRecords(merged);
        setSuccessMessage(
          `Đã chuyển đổi thành công ${data.records.length} hồ sơ! Danh sách tổng hợp gồm ${merged.length} cán bộ đã được tự động gộp theo người, sắp xếp thành tích theo thời gian và xếp thứ tự theo Tên (A-Z).`
        );
      }
    } catch (err: any) {
      console.error("Markdown to table error:", err);
      setErrorMessage(err.message || "Đã xảy ra lỗi khi chuyển đổi Markdown sang bảng.");
    } finally {
      setIsLoading(false);
      setLoadingStepText("");
    }
  };

  // Full Pipeline: Scan to Markdown then immediately Convert to Table
  const handleAutoProcessAll = async (payload: ProcessPayload) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setLastPayload(payload);

    try {
      let combinedMarkdown = "";

      if (payload.files && payload.files.length > 1) {
        const total = payload.files.length;
        const markdownSections: string[] = [];

        for (let i = 0; i < total; i++) {
          const f = payload.files[i];
          setLoadingStepText(`Đang quét tệp ${i + 1}/${total}: "${f.fileName}" sang Markdown...`);

          try {
            const md = await scanSinglePayloadToMarkdown({
              fileBase64: f.fileBase64,
              mimeType: f.mimeType,
              fileName: f.fileName
            });
            markdownSections.push(`## 📄 Tệp ${i + 1}/${total}: ${f.fileName}\n\n${md}`);
          } catch (fErr: any) {
            console.warn(`File ${f.fileName} error:`, fErr);
            markdownSections.push(`## 📄 Tệp ${i + 1}/${total}: ${f.fileName} (Lỗi đọc tệp)\n\n*Lỗi: ${fErr.message}*`);
          }
        }
        combinedMarkdown = `# TÀI LIỆU TỔNG HỢP TỪ ${total} TỆP ĐÃ QUÉT\n\n` + markdownSections.join("\n\n---\n\n");
      } else {
        setLoadingStepText("Đang quét OCR tài liệu sang Markdown...");
        const singlePayload = payload.files && payload.files.length === 1
          ? {
              fileBase64: payload.files[0].fileBase64,
              mimeType: payload.files[0].mimeType,
              fileName: payload.files[0].fileName
            }
          : {
              text: payload.text,
              fileBase64: payload.fileBase64,
              mimeType: payload.mimeType,
              fileName: payload.fileName
            };

        combinedMarkdown = await scanSinglePayloadToMarkdown(singlePayload);
      }

      setCurrentMarkdown(combinedMarkdown);

      // 2. Convert to Table
      setLoadingStepText("Đang trích xuất Markdown thành Bảng dữ liệu hồ sơ...");
      const tableRes = await fetch("/api/markdown-to-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: combinedMarkdown })
      });
      const tableData: ExtractionResponse = await tableRes.json();

      if (!tableRes.ok || !tableData.success) {
        throw new Error(tableData.error || "Lỗi khi chuyển đổi Markdown thành bảng.");
      }

      if (tableData.records && tableData.records.length > 0) {
        const merged = mergeAndSortPersonnelRecords(records, tableData.records);
        setRecords(merged);
        setSuccessMessage(
          `Hoàn tất tự động toàn bộ quy trình: Đã quét tài liệu, trích xuất ${tableData.records.length} hồ sơ và cập nhật danh sách (${merged.length} cán bộ đã được sắp xếp theo Tên A-Z, thành tích theo năm)!`
        );
      } else {
        setSuccessMessage("Đã đọc xong Markdown. Bạn có thể kiểm tra nội dung phía dưới.");
      }
    } catch (err: any) {
      console.error("Auto process error:", err);
      let errMsg = err.message || "Đã xảy ra lỗi trong quy trình tự động.";
      if (errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE")) {
        errMsg = "Máy chủ AI hiện đang chịu tải cao tạm thời. Hệ thống đã sẵn sàng, vui lòng bấm 'Thử lại ngay'.";
      }
      setErrorMessage(errMsg);
    } finally {
      setIsLoading(false);
      setLoadingStepText("");
    }
  };

  // Record CRUD
  const handleSaveRecord = (updatedRecord: PersonnelRecord) => {
    setRecords((prev) => {
      const remaining = prev.filter((r) => r.id !== updatedRecord.id);
      return mergeAndSortPersonnelRecords(remaining, [updatedRecord]);
    });
    setSuccessMessage(`Đã cập nhật hồ sơ của "${updatedRecord.fullName}"!`);
  };

  const handleDeleteRecord = (id: string) => {
    const target = records.find((r) => r.id === id);
    if (window.confirm(`Bạn có chắc muốn xóa hồ sơ của "${target?.fullName || "cán bộ này"}"?`)) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setSuccessMessage("Đã xóa hồ sơ khỏi danh sách.");
    }
  };

  const handleOpenAddRecord = () => {
    const curYear = new Date().getFullYear();
    const newRec: PersonnelRecord = {
      id: `new-${Date.now()}`,
      fullName: "",
      dateOfBirth: "",
      address: "",
      position: "",
      workingPeriod: "",
      salaryGrade: "Bậc 1",
      salaryCoefficient: "2.34",
      achievements: [
        { title: "Lao động tiên tiến", year: (curYear - 1).toString(), level: "Cơ sở" }
      ],
      evaluationTitles: [
        { title: "Hoàn thành tốt nhiệm vụ", schoolYear: `${curYear - 1}-${curYear}` }
      ],
      notes: ""
    };
    setEditingRecord(newRec);
    setIsModalOpen(true);
  };

  const handleOpenEditRecord = (record: PersonnelRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleClearAll = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả hồ sơ hiện tại khỏi danh sách?")) {
      setRecords([]);
      setSuccessMessage("Đã xóa toàn bộ dữ liệu hồ sơ.");
    }
  };

  const handleClearMarkdown = () => {
    setCurrentMarkdown("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Application Header */}
      <Header recordCount={records.length} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Alert if any */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-semibold">Lỗi xử lý</p>
                <p className="text-xs text-rose-700">{errorMessage}</p>
                {lastPayload && (
                  <button
                    onClick={() => handleScanToMarkdown(lastPayload)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    {isLoading ? "Đang xử lý lại..." : "Thử lại ngay"}
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 text-rose-500 hover:text-rose-700 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Thông báo thành công</p>
                <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="p-1 text-emerald-500 hover:text-emerald-700 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input and File Upload Section: Step 1 */}
        <InputSection
          onScanToMarkdown={handleScanToMarkdown}
          onAutoProcessAll={handleAutoProcessAll}
          isLoading={isLoading}
          loadingStepText={loadingStepText}
        />

        {/* Step 2: Markdown Viewer & Editor Section (Only appears when markdown is available) */}
        {currentMarkdown && (
          <MarkdownViewerSection
            markdown={currentMarkdown}
            onMarkdownChange={setCurrentMarkdown}
            onConvertToTable={handleConvertToTable}
            isConverting={isLoading}
            onReset={handleClearMarkdown}
            hasRecords={records.length > 0}
          />
        )}

        {/* Statistical Overview Cards */}
        <StatsCards records={records} />

        {/* Step 3: Extracted Data Table with Excel Export */}
        <DataTable
          records={records}
          onUpdateRecord={handleOpenEditRecord}
          onDeleteRecord={handleDeleteRecord}
          onAddRecord={handleOpenAddRecord}
          onClearAll={handleClearAll}
        />
      </main>

      {/* Edit or Add Record Modal */}
      <RecordEditModal
        record={editingRecord}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
      />

      {/* App Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Quy trình chuẩn hóa: Quét tệp / ảnh ➔ Đọc & chuyển thành Markdown ➔ Bóc tách thành Bảng hồ sơ ➔ Xuất file Excel (.xlsx)
          </p>
          <p className="text-slate-400">
            Hỗ trợ chính xác: Họ tên, Ngày sinh, Địa chỉ, Chức vụ, Thâm niên nhà giáo 10%, Bậc lương, Hệ số, Thành tích & Đánh giá năm học
          </p>
        </div>
      </footer>
    </div>
  );
}
