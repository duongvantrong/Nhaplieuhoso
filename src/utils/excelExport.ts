import * as XLSX from "xlsx";
import { PersonnelRecord } from "../types";

export function exportPersonnelToExcel(
  records: PersonnelRecord[],
  fileName = "Danh_sach_can_bo_trich_xuat.xlsx"
) {
  if (!records || records.length === 0) {
    throw new Error("Không có dữ liệu để xuất Excel");
  }

  // 1. Prepare data rows for main sheet
  const headers = [
    "STT",
    "Họ và tên",
    "Ngày sinh",
    "Địa chỉ / Quê quán",
    "Chức vụ / Vị trí",
    "Thời gian làm việc / Thâm niên",
    "Bậc lương",
    "Hệ số lương",
    "Thành tích & Năm đạt",
    "Danh hiệu trong năm học",
    "Ghi chú"
  ];

  const rows = records.map((record, index) => {
    // Format achievements: "Lao động tiên tiến (2019); Chiến sĩ thi đua (2020)"
    const achievementsStr = record.achievements && record.achievements.length > 0
      ? record.achievements
          .map((a) => {
            const yr = a.year ? ` (Năm ${a.year})` : "";
            const lvl = a.level ? ` [${a.level}]` : "";
            return `${a.title}${yr}${lvl}`;
          })
          .join("; ")
      : "";

    // Format evaluations: "Năm học 2021-2022: Hoàn thành xuất sắc nhiệm vụ"
    const evaluationsStr = record.evaluationTitles && record.evaluationTitles.length > 0
      ? record.evaluationTitles
          .map((e) => {
            const sy = e.schoolYear ? `Năm học ${e.schoolYear}: ` : "";
            return `${sy}${e.title}`;
          })
          .join("; ")
      : "";

    return [
      index + 1,
      record.fullName || "",
      record.dateOfBirth || "",
      record.address || "",
      record.position || "",
      record.workingPeriod || "",
      record.salaryGrade || "",
      record.salaryCoefficient || "",
      achievementsStr,
      evaluationsStr,
      record.notes || ""
    ];
  });

  // Create worksheet
  const wsData = [
    ["BẢNG TỔNG HỢP THÔNG TIN CÁN BỘ, VIÊN CHỨC & THÀNH TÍCH THI ĐUA"],
    [`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`],
    [], // Empty row
    headers,
    ...rows
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths auto-adjustment
  worksheet["!cols"] = [
    { wch: 6 },  // STT
    { wch: 25 }, // Họ và tên
    { wch: 14 }, // Ngày sinh
    { wch: 35 }, // Địa chỉ
    { wch: 26 }, // Chức vụ
    { wch: 24 }, // Thời gian làm việc
    { wch: 12 }, // Bậc lương
    { wch: 13 }, // Hệ số lương
    { wch: 45 }, // Thành tích
    { wch: 45 }, // Danh hiệu năm học
    { wch: 25 }  // Ghi chú
  ];

  // 2. Also create a detailed Sheet for Achievements
  const achievementHeaders = ["STT", "Họ và tên", "Năm đạt", "Tên thành tích / Khen thưởng", "Cấp khen thưởng / Ghi chú"];
  const achievementRows: (string | number)[][] = [];
  let achIdx = 1;

  records.forEach((r) => {
    if (r.achievements && r.achievements.length > 0) {
      r.achievements.forEach((a) => {
        achievementRows.push([
          achIdx++,
          r.fullName,
          a.year || "",
          a.title || "",
          a.level || a.note || ""
        ]);
      });
    }
  });

  const wsAchievements = XLSX.utils.aoa_to_sheet([
    ["CHI TIẾT THÀNH TÍCH VÀ KHEN THƯỞNG QUA CÁC NĂM"],
    achievementHeaders,
    ...achievementRows
  ]);
  wsAchievements["!cols"] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 12 },
    { wch: 40 },
    { wch: 30 }
  ];

  // 3. Create a detailed Sheet for School Year Evaluations
  const evalHeaders = ["STT", "Họ và tên", "Năm học", "Danh hiệu / Xếp loại đánh giá", "Ghi chú"];
  const evalRows: (string | number)[][] = [];
  let evalIdx = 1;

  records.forEach((r) => {
    if (r.evaluationTitles && r.evaluationTitles.length > 0) {
      r.evaluationTitles.forEach((e) => {
        evalRows.push([
          evalIdx++,
          r.fullName,
          e.schoolYear || "",
          e.title || "",
          e.note || ""
        ]);
      });
    }
  });

  const wsEvaluations = XLSX.utils.aoa_to_sheet([
    ["CHI TIẾT ĐÁNH GIÁ XẾP LOẠI & DANH HIỆU TRONG NĂM HỌC"],
    evalHeaders,
    ...evalRows
  ]);
  wsEvaluations["!cols"] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 16 },
    { wch: 35 },
    { wch: 25 }
  ];

  // Create workbook and append sheets
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tổng hợp hồ sơ");
  if (achievementRows.length > 0) {
    XLSX.utils.book_append_sheet(workbook, wsAchievements, "Chi tiết thành tích");
  }
  if (evalRows.length > 0) {
    XLSX.utils.book_append_sheet(workbook, wsEvaluations, "Đánh giá năm học");
  }

  // Trigger download
  XLSX.writeFile(workbook, fileName);
}
