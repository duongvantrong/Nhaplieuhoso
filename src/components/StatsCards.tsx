import React from "react";
import { Users, Award, CheckCircle2, TrendingUp } from "lucide-react";
import { PersonnelRecord } from "../types";

interface StatsCardsProps {
  records: PersonnelRecord[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ records }) => {
  if (records.length === 0) return null;

  const totalPersonnel = records.length;
  const totalAchievements = records.reduce(
    (acc, r) => acc + (r.achievements ? r.achievements.length : 0),
    0
  );
  const totalEvaluations = records.reduce(
    (acc, r) => acc + (r.evaluationTitles ? r.evaluationTitles.length : 0),
    0
  );
  const excellentEvaluations = records.reduce(
    (acc, r) =>
      acc +
      (r.evaluationTitles
        ? r.evaluationTitles.filter((e) => e.title.toLowerCase().includes("xuất sắc")).length
        : 0),
    0
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Số lượng cán bộ</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900 mt-2">{totalPersonnel}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Hồ sơ đã số hóa</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Thành tích & Khen thưởng</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-amber-600 mt-2">{totalAchievements}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">LĐTT, CSTĐ, Bằng khen</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Đánh giá năm học</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-emerald-600 mt-2">{totalEvaluations}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {excellentEvaluations} lần xếp loại Xuất sắc
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Sẵn sàng xuất Excel</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900 mt-2">100%</p>
        <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Định dạng .xlsx đa trang</p>
      </div>
    </div>
  );
};
