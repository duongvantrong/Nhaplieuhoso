import React, { useState, useMemo } from "react";
import { 
  Download, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Award, 
  CheckCircle2, 
  Calendar,
  AlertCircle,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
  Briefcase,
  TrendingUp,
  Filter
} from "lucide-react";
import { PersonnelRecord, SortOption } from "../types";
import { exportPersonnelToExcel } from "../utils/excelExport";
import { sortRecords, getVietnameseNameParts } from "../utils/recordHelpers";

interface DataTableProps {
  records: PersonnelRecord[];
  onUpdateRecord: (record: PersonnelRecord) => void;
  onDeleteRecord: (id: string) => void;
  onAddRecord: () => void;
  onClearAll: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  records,
  onUpdateRecord,
  onDeleteRecord,
  onAddRecord,
  onClearAll
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("Danh_sach_can_bo_trich_xuat.xlsx");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");

  // Filter and sort records
  const processedRecords = useMemo(() => {
    let list = records;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = records.filter((r) => {
        const matchName = r.fullName?.toLowerCase().includes(term);
        const matchPos = r.position?.toLowerCase().includes(term);
        const matchAddr = r.address?.toLowerCase().includes(term);
        const matchAch = r.achievements?.some(
          (a) => a.title.toLowerCase().includes(term) || a.year.includes(term)
        );
        const matchEval = r.evaluationTitles?.some(
          (e) => e.title.toLowerCase().includes(term) || e.schoolYear.includes(term)
        );
        return matchName || matchPos || matchAddr || matchAch || matchEval;
      });
    }

    return sortRecords(list, sortBy);
  }, [records, searchTerm, sortBy]);

  // Export to Excel handler using sorted records
  const handleExportExcel = () => {
    if (processedRecords.length === 0) return;
    const validFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
    exportPersonnelToExcel(processedRecords, validFileName);
  };

  // Copy as TSV for pasting into Google Sheets / Excel
  const handleCopyTSV = () => {
    if (processedRecords.length === 0) return;
    const headers = [
      "STT",
      "Họ và tên",
      "Ngày sinh",
      "Địa chỉ",
      "Chức vụ",
      "Thời gian làm việc / Thâm niên",
      "Bậc lương",
      "Hệ số lương",
      "Thành tích & Năm đạt",
      "Danh hiệu năm học",
      "Ghi chú"
    ].join("\t");

    const rows = processedRecords.map((r, i) => {
      const ach = (r.achievements || []).map((a) => `${a.title} (${a.year})`).join("; ");
      const ev = (r.evaluationTitles || []).map((e) => `${e.schoolYear}: ${e.title}`).join("; ");
      return [
        i + 1,
        r.fullName,
        r.dateOfBirth,
        r.address,
        r.position,
        r.workingPeriod,
        r.salaryGrade,
        r.salaryCoefficient,
        ach,
        ev,
        r.notes || ""
      ].join("\t");
    }).join("\n");

    navigator.clipboard.writeText(`${headers}\n${rows}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleNameSort = () => {
    setSortBy((prev) => (prev === "name_asc" ? "name_desc" : "name_asc"));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Action Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search and Sort controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, chức vụ, năm, thành tích..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 border border-slate-200 rounded-xl shrink-0 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-semibold text-slate-700 bg-transparent border-0 focus:outline-none cursor-pointer pr-1 py-1"
            >
              <option value="name_asc">Tên A ➔ Z (Chuẩn Tiếng Việt)</option>
              <option value="name_desc">Tên Z ➔ A (Chuẩn Tiếng Việt)</option>
              <option value="seniority_desc">Thâm niên công tác (Cao ➔ Thấp)</option>
              <option value="salary_desc">Hệ số lương (Cao ➔ Thấp)</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onAddRecord}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Thêm cán bộ</span>
          </button>

          <button
            onClick={handleCopyTSV}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-50 transition-colors shadow-2xs"
            title="Sao chép dạng bảng để dán trực tiếp vào Google Sheets hoặc Excel"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? "Đã chép vào clipboard" : "Chép bảng (TSV)"}</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={records.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/25 disabled:opacity-50 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất file Excel (.xlsx)</span>
          </button>

          {records.length > 0 && (
            <button
              onClick={onClearAll}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Xóa tất cả danh sách"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Active Sorting Banner */}
      {records.length > 0 && (
        <div className="px-4 py-2 bg-emerald-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              {sortBy === "name_asc" && (
                <>Đang sắp xếp: <strong className="text-emerald-800">Tên A ➔ Z theo chuẩn Tiếng Việt</strong> (Tên chính được ưu tiên xếp trước, trùng tên xếp theo Họ)</>
              )}
              {sortBy === "name_desc" && (
                <>Đang sắp xếp: <strong className="text-emerald-800">Tên Z ➔ A theo chuẩn Tiếng Việt</strong></>
              )}
              {sortBy === "seniority_desc" && (
                <>Đang sắp xếp: <strong className="text-emerald-800">Thâm niên công tác từ cao xuống thấp</strong></>
              )}
              {sortBy === "salary_desc" && (
                <>Đang sắp xếp: <strong className="text-emerald-800">Hệ số lương từ cao xuống thấp</strong></>
              )}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Thành tích mỗi cán bộ được tự động sắp xếp theo thứ tự thời gian năm đạt
          </span>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider">
              <th className="py-3.5 px-3 text-center w-12">STT</th>
              
              {/* Họ và tên column with clickable sort toggle */}
              <th 
                onClick={handleToggleNameSort}
                className="py-3.5 px-4 min-w-[200px] cursor-pointer hover:bg-slate-200/60 transition-colors select-none group"
                title="Bấm để chuyển đổi sắp xếp A-Z hoặc Z-A"
              >
                <div className="flex items-center gap-1.5">
                  <span>Họ và tên</span>
                  {sortBy === "name_asc" ? (
                    <ArrowDownAZ className="w-4 h-4 text-emerald-600" />
                  ) : sortBy === "name_desc" ? (
                    <ArrowUpAZ className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-50 group-hover:opacity-100" />
                  )}
                </div>
              </th>

              <th className="py-3.5 px-3 min-w-[110px]">Ngày sinh</th>
              <th className="py-3.5 px-4 min-w-[180px]">Địa chỉ / Thường trú</th>
              <th className="py-3.5 px-4 min-w-[160px]">Chức vụ / Vị trí</th>
              
              <th 
                onClick={() => setSortBy("seniority_desc")}
                className="py-3.5 px-3 min-w-[150px] cursor-pointer hover:bg-slate-200/60 transition-colors select-none"
                title="Bấm để sắp xếp theo thâm niên"
              >
                <div className="flex items-center gap-1">
                  <span>Thời gian làm việc</span>
                  {sortBy === "seniority_desc" && <span className="text-[10px] text-emerald-600 font-bold">▼</span>}
                </div>
              </th>

              <th 
                onClick={() => setSortBy("salary_desc")}
                className="py-3.5 px-3 min-w-[120px] cursor-pointer hover:bg-slate-200/60 transition-colors select-none"
                title="Bấm để sắp xếp theo hệ số lương"
              >
                <div className="flex items-center gap-1">
                  <span>Ngạch bậc / Hệ số</span>
                  {sortBy === "salary_desc" && <span className="text-[10px] text-emerald-600 font-bold">▼</span>}
                </div>
              </th>

              <th className="py-3.5 px-4 min-w-[240px]">
                <div className="flex items-center gap-1">
                  <span>Thành tích & Năm đạt</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Xếp theo năm)</span>
                </div>
              </th>

              <th className="py-3.5 px-4 min-w-[220px]">
                <div className="flex items-center gap-1">
                  <span>Danh hiệu năm học</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Xếp theo năm học)</span>
                </div>
              </th>

              <th className="py-3.5 px-3 text-center w-20">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processedRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">
                      {searchTerm ? "Không tìm thấy cán bộ phù hợp với từ khóa" : "Chưa có dữ liệu cán bộ được trích xuất"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Vui lòng tải lên một hoặc nhiều tài liệu hoặc nhập nội dung văn bản ở phía trên để bắt đầu
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              processedRecords.map((record, index) => {
                const { firstName, middleAndLastName } = getVietnameseNameParts(record.fullName);
                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-700">{middleAndLastName ? `${middleAndLastName} ` : ""}</span>
                        <span className="text-emerald-950 font-bold underline decoration-emerald-300 underline-offset-2">
                          {firstName}
                        </span>
                        {record.gender && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-normal shrink-0">
                            {record.gender}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-mono text-xs">
                      {record.dateOfBirth || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs line-clamp-2 max-w-[220px]">
                      {record.address || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium text-xs">
                      {record.position || "—"}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 text-xs">
                      {record.workingPeriod || "—"}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 text-xs">
                      <div className="flex flex-col gap-0.5 font-mono">
                        <span className="font-semibold text-slate-900">{record.salaryGrade || "—"}</span>
                        {record.salaryCoefficient && (
                          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded w-fit font-bold">
                            HS: {record.salaryCoefficient}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {record.achievements && record.achievements.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {record.achievements.map((ach, aIdx) => (
                            <span
                              key={aIdx}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 font-medium shadow-2xs"
                            >
                              <Award className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{ach.title}</span>
                              <span className="text-amber-800 font-mono font-bold bg-amber-100/70 px-1 rounded text-[10px]">
                                {ach.year}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {record.evaluationTitles && record.evaluationTitles.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {record.evaluationTitles.map((evalItem, eIdx) => {
                            const isExcellent = evalItem.title.toLowerCase().includes("xuất sắc");
                            const isGood = evalItem.title.toLowerCase().includes("tốt");
                            return (
                              <div
                                key={eIdx}
                                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-medium ${
                                  isExcellent
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/70"
                                    : isGood
                                    ? "bg-blue-50 text-blue-800 border-blue-200/70"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="font-mono text-[10px] opacity-75 font-semibold">{evalItem.schoolYear}:</span>
                                <span>{evalItem.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onUpdateRecord(record)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa hồ sơ này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {records.length > 0 && (
        <div className="p-3.5 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span>
              Hiển thị <strong>{processedRecords.length}</strong> / <strong>{records.length}</strong> cán bộ
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-medium">
              Đã gộp thành tích cùng người theo năm & sắp xếp bảng theo Tên A-Z
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Tên file khi xuất:</span>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-md font-mono text-slate-700 focus:outline-none focus:border-emerald-500 w-64"
            />
          </div>
        </div>
      )}
    </div>
  );
};
