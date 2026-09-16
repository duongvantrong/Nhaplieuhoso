import React, { useState } from "react";
import { X, Plus, Trash2, Save, Award, Calendar, User, Briefcase, MapPin, DollarSign, CheckCircle2 } from "lucide-react";
import { PersonnelRecord, AchievementItem, EvaluationItem } from "../types";

interface RecordEditModalProps {
  record: PersonnelRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PersonnelRecord) => void;
}

export const RecordEditModal: React.FC<RecordEditModalProps> = ({
  record,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !record) return null;

  const [formData, setFormData] = useState<PersonnelRecord>({
    ...record,
    achievements: record.achievements ? [...record.achievements] : [],
    evaluationTitles: record.evaluationTitles ? [...record.evaluationTitles] : []
  });

  const handleChange = (field: keyof PersonnelRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Achievement handlers
  const handleAddAchievement = () => {
    setFormData((prev) => ({
      ...prev,
      achievements: [
        ...prev.achievements,
        { title: "Lao động tiên tiến", year: new Date().getFullYear().toString(), level: "Cơ sở" }
      ]
    }));
  };

  const handleUpdateAchievement = (index: number, field: keyof AchievementItem, val: string) => {
    setFormData((prev) => {
      const updated = [...prev.achievements];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, achievements: updated };
    });
  };

  const handleRemoveAchievement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  // Evaluation handlers
  const handleAddEvaluation = () => {
    const curYear = new Date().getFullYear();
    setFormData((prev) => ({
      ...prev,
      evaluationTitles: [
        ...prev.evaluationTitles,
        { title: "Hoàn thành xuất sắc nhiệm vụ", schoolYear: `${curYear - 1}-${curYear}` }
      ]
    }));
  };

  const handleUpdateEvaluation = (index: number, field: keyof EvaluationItem, val: string) => {
    setFormData((prev) => {
      const updated = [...prev.evaluationTitles];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, evaluationTitles: updated };
    });
  };

  const handleRemoveEvaluation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      evaluationTitles: prev.evaluationTitles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {record.id.startsWith("new-") ? "Thêm mới cán bộ" : "Chỉnh sửa thông tin hồ sơ"}
              </h2>
              <p className="text-xs text-slate-500">
                Cập nhật thông tin lý lịch, ngạch bậc lương và danh hiệu thi đua
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Section 1: Thông tin cơ bản */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              1. Thông tin cá nhân & Công tác
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Ví dụ: NGUYỄN VĂN HÙNG"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ngày tháng năm sinh
                </label>
                <input
                  type="text"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  placeholder="Ví dụ: 15/08/1984"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Địa chỉ thường trú / Quê quán
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Chức vụ / Chức danh
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  placeholder="Ví dụ: Tổ trưởng chuyên môn, Hiệu phó..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Thời gian làm việc / Thâm niên
                </label>
                <input
                  type="text"
                  value={formData.workingPeriod}
                  onChange={(e) => handleChange("workingPeriod", e.target.value)}
                  placeholder="Ví dụ: Từ 01/09/2007 (17 năm)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Chế độ tiền lương */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              2. Chế độ ngạch bậc & Hệ số lương
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Bậc lương
                </label>
                <input
                  type="text"
                  value={formData.salaryGrade}
                  onChange={(e) => handleChange("salaryGrade", e.target.value)}
                  placeholder="Ví dụ: Bậc 4, Bậc 5/9"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Hệ số lương
                </label>
                <input
                  type="text"
                  value={formData.salaryCoefficient}
                  onChange={(e) => handleChange("salaryCoefficient", e.target.value)}
                  placeholder="Ví dụ: 3.66, 3.99, 4.98"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Thành tích & Năm đạt thành tích */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                3. Thành tích & Năm có thành tích
              </h3>
              <button
                type="button"
                onClick={handleAddAchievement}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm thành tích
              </button>
            </div>

            {formData.achievements.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 bg-slate-50 rounded-lg px-3 border border-dashed border-slate-200">
                Chưa có thông tin thành tích. Bấm "Thêm thành tích" để bổ sung.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.achievements.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="w-24">
                      <input
                        type="text"
                        placeholder="Năm"
                        value={item.year}
                        onChange={(e) => handleUpdateAchievement(idx, "year", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        placeholder="Tên thành tích (vd: Lao động tiên tiến, Chiến sĩ thi đua cơ sở...)"
                        value={item.title}
                        onChange={(e) => handleUpdateAchievement(idx, "title", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white"
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="text"
                        placeholder="Cấp khen thưởng"
                        value={item.level || ""}
                        onChange={(e) => handleUpdateAchievement(idx, "level", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAchievement(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors self-end sm:self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Danh hiệu trong năm học */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                4. Danh hiệu & Đánh giá trong năm học
              </h3>
              <button
                type="button"
                onClick={handleAddEvaluation}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm năm học
              </button>
            </div>

            {formData.evaluationTitles.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 bg-slate-50 rounded-lg px-3 border border-dashed border-slate-200">
                Chưa có xếp loại năm học. Bấm "Thêm năm học" để ghi nhận danh hiệu.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.evaluationTitles.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="w-32">
                      <input
                        type="text"
                        placeholder="Năm học (vd: 2022-2023)"
                        value={item.schoolYear}
                        onChange={(e) => handleUpdateEvaluation(idx, "schoolYear", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <select
                        value={item.title}
                        onChange={(e) => handleUpdateEvaluation(idx, "title", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white"
                      >
                        <option value="Hoàn thành xuất sắc nhiệm vụ">Hoàn thành xuất sắc nhiệm vụ</option>
                        <option value="Hoàn thành tốt nhiệm vụ">Hoàn thành tốt nhiệm vụ</option>
                        <option value="Hoàn thành nhiệm vụ">Hoàn thành nhiệm vụ</option>
                        <option value="Không hoàn thành nhiệm vụ">Không hoàn thành nhiệm vụ</option>
                      </select>
                    </div>
                    <div className="w-32">
                      <input
                        type="text"
                        placeholder="Ghi chú thêm"
                        value={item.note || ""}
                        onChange={(e) => handleUpdateEvaluation(idx, "note", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvaluation(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors self-end sm:self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Ghi chú */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ghi chú bổ sung
            </label>
            <textarea
              rows={2}
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Thông tin đảng viên, trình độ lý luận, bằng khen khác..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-colors"
            >
              <Save className="w-4 h-4" />
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
