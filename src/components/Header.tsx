import React from "react";
import { FileSpreadsheet, Sparkles, Award, ShieldCheck, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  recordCount: number;
}

export const Header: React.FC<HeaderProps> = ({ recordCount }) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Trích Xuất Hồ Sơ & Xuất Excel
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                AI Thông Minh
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Tự động nhận diện họ tên, ngày sinh, chức vụ, bậc lương, thành tích và danh hiệu thi đua từ văn bản
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Đã trích xuất:</span>
            <span className="font-semibold text-slate-900 px-1.5 py-0.5 rounded bg-white border border-slate-200">
              {recordCount} cán bộ
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-1.5 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chuẩn mẫu báo cáo hành chính</span>
          </div>
        </div>
      </div>
    </header>
  );
};
