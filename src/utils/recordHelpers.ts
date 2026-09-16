import { PersonnelRecord, AchievementItem, EvaluationItem } from "../types";

/**
 * Trích xuất các phần của tên tiếng Việt để sắp xếp chuẩn xác:
 * - firstName: Tên chính (từ cuối cùng, ví dụ: "An", "Bình", "Cường", "Dung", "Đạt")
 * - middleAndLastName: Họ và tên đệm (các từ phía trước, ví dụ: "Nguyễn Văn", "Trần Thị")
 */
export function getVietnameseNameParts(fullName: string): {
  firstName: string;
  middleAndLastName: string;
} {
  const trimmed = (fullName || "").trim();
  if (!trimmed) {
    return { firstName: "", middleAndLastName: "" };
  }
  const parts = trimmed.split(/\s+/);
  const firstName = parts[parts.length - 1] || "";
  const middleAndLastName = parts.slice(0, -1).join(" ");
  return { firstName, middleAndLastName };
}

/**
 * So sánh 2 tên tiếng Việt theo chuẩn từ điển/bảng chữ cái tiếng Việt:
 * Ưu tiên so sánh Tên chính trước (locale 'vi'), nếu trùng tên thì so sánh Họ và Tên đệm.
 */
export function compareVietnameseNames(nameA: string, nameB: string): number {
  const partsA = getVietnameseNameParts(nameA);
  const partsB = getVietnameseNameParts(nameB);

  // So sánh tên gọi trước
  const firstNameComp = partsA.firstName.localeCompare(partsB.firstName, "vi", {
    sensitivity: "base",
    caseFirst: "upper"
  });

  if (firstNameComp !== 0) {
    return firstNameComp;
  }

  // Nếu cùng tên thì so sánh họ và chữ đệm
  return partsA.middleAndLastName.localeCompare(partsB.middleAndLastName, "vi", {
    sensitivity: "base",
    caseFirst: "upper"
  });
}

/**
 * Trích xuất số năm từ chuỗi thời gian (ví dụ: "2023", "Năm 2021", "2020-2021" -> 2021)
 */
export function parseYearNumber(yearStr?: string): number {
  if (!yearStr) return 0;
  const match = String(yearStr).match(/\b(19\d{2}|20\d{2})\b/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Sắp xếp danh sách thành tích thi đua theo thời gian (năm đạt)
 * Mặc định: Tăng dần theo thời gian (từ năm sớm nhất đến năm gần nhất: 2019 -> 2020 -> 2024)
 */
export function sortAchievementsByTime(
  achievements: AchievementItem[],
  direction: "asc" | "desc" = "asc"
): AchievementItem[] {
  if (!achievements || achievements.length <= 1) return achievements || [];
  return [...achievements].sort((a, b) => {
    const yearA = parseYearNumber(a.year);
    const yearB = parseYearNumber(b.year);
    if (yearA !== yearB) {
      return direction === "asc" ? yearA - yearB : yearB - yearA;
    }
    return (a.title || "").localeCompare(b.title || "", "vi");
  });
}

/**
 * Sắp xếp danh sách đánh giá năm học theo thời gian
 */
export function sortEvaluationsByTime(
  evaluations: EvaluationItem[],
  direction: "asc" | "desc" = "asc"
): EvaluationItem[] {
  if (!evaluations || evaluations.length <= 1) return evaluations || [];
  return [...evaluations].sort((a, b) => {
    const yearA = parseYearNumber(a.schoolYear);
    const yearB = parseYearNumber(b.schoolYear);
    if (yearA !== yearB) {
      return direction === "asc" ? yearA - yearB : yearB - yearA;
    }
    return (a.title || "").localeCompare(b.title || "", "vi");
  });
}

/**
 * Trích xuất số hệ số lương (ví dụ: "3.66", "3,99", "Bậc 5 / 3.99" -> 3.99)
 */
export function parseSalaryCoefficient(coeffStr?: string): number {
  if (!coeffStr) return 0;
  const clean = String(coeffStr).replace(",", ".");
  const match = clean.match(/(\d+\.\d+|\d+)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Trích xuất phần trăm hoặc số năm thâm niên (ví dụ: "10%", "thâm niên 14 năm" -> 14 hoặc 10)
 */
export function parseSeniorityValue(seniorityStr?: string): number {
  if (!seniorityStr) return 0;
  // Ưu tiên tỷ lệ % thâm niên (ví dụ: 10%, 15%)
  const percentMatch = String(seniorityStr).match(/(\d+)\s*%/);
  if (percentMatch) return parseInt(percentMatch[1], 10);

  // Số năm công tác
  const yearMatch = String(seniorityStr).match(/(\d+)\s*(năm|tháng)/i);
  if (yearMatch) return parseInt(yearMatch[1], 10);

  const numMatch = String(seniorityStr).match(/\b\d+\b/);
  return numMatch ? parseInt(numMatch[0], 10) : 0;
}

/**
 * Chuẩn hóa họ tên để kiểm tra xem có cùng 1 người hay không
 */
export function normalizePersonKey(fullName: string, dateOfBirth?: string): string {
  const normName = (fullName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  
  if (dateOfBirth && dateOfBirth.trim() && dateOfBirth.trim() !== "—") {
    // Rút gọn ngày sinh bỏ dấu gạch nối, chéo để so sánh
    const normDob = dateOfBirth.replace(/[^0-9]/g, "");
    if (normDob.length >= 4) {
      return `${normName}_${normDob}`;
    }
  }
  return normName;
}

/**
 * Gộp thông tin của 2 bản ghi thuộc CÙNG MỘT NGƯỜI:
 * - Thành tích: gộp và loại bỏ trùng lặp, sắp xếp theo thời gian (năm đạt)
 * - Xếp loại năm học: gộp và loại bỏ trùng lặp, sắp xếp theo năm học
 * - Thâm niên & Hệ số lương: lấy thông tin mới nhất/cao nhất
 * - Địa chỉ, chức vụ, giới tính: lấy thông tin chi tiết nhất
 */
export function mergeSinglePersonRecords(
  primary: PersonnelRecord,
  secondary: PersonnelRecord
): PersonnelRecord {
  // 1. Gộp Thành tích và sắp xếp theo thời gian
  const mergedAchievements: AchievementItem[] = [];
  const achSeen = new Set<string>();

  for (const ach of [...(primary.achievements || []), ...(secondary.achievements || [])]) {
    if (!ach || !ach.title) continue;
    const key = `${(ach.title || "").trim().toLowerCase()}_${(ach.year || "").trim()}`;
    if (!achSeen.has(key)) {
      achSeen.add(key);
      mergedAchievements.push({ ...ach });
    }
  }
  const sortedAchievements = sortAchievementsByTime(mergedAchievements, "asc");

  // 2. Gộp Xếp loại năm học và sắp xếp theo thời gian
  const mergedEvaluations: EvaluationItem[] = [];
  const evalSeen = new Set<string>();

  for (const ev of [...(primary.evaluationTitles || []), ...(secondary.evaluationTitles || [])]) {
    if (!ev || !ev.title) continue;
    const key = `${(ev.title || "").trim().toLowerCase()}_${(ev.schoolYear || "").trim()}`;
    if (!evalSeen.has(key)) {
      evalSeen.add(key);
      mergedEvaluations.push({ ...ev });
    }
  }
  const sortedEvaluations = sortEvaluationsByTime(mergedEvaluations, "asc");

  // 3. Hệ số lương & Bậc lương: so sánh để lấy mốc mới nhất/cao nhất
  const coeffPrimary = parseSalaryCoefficient(primary.salaryCoefficient);
  const coeffSecondary = parseSalaryCoefficient(secondary.salaryCoefficient);
  let bestSalaryCoeff = primary.salaryCoefficient;
  let bestSalaryGrade = primary.salaryGrade;

  if (coeffSecondary > coeffPrimary) {
    bestSalaryCoeff = secondary.salaryCoefficient;
    if (secondary.salaryGrade) bestSalaryGrade = secondary.salaryGrade;
  } else if (!bestSalaryCoeff && secondary.salaryCoefficient) {
    bestSalaryCoeff = secondary.salaryCoefficient;
    bestSalaryGrade = secondary.salaryGrade || bestSalaryGrade;
  }

  // 4. Thâm niên: lấy mốc cao hơn / đầy đủ hơn
  const senPrimary = parseSeniorityValue(primary.workingPeriod);
  const senSecondary = parseSeniorityValue(secondary.workingPeriod);
  let bestWorkingPeriod = primary.workingPeriod;
  if (senSecondary > senPrimary || (!bestWorkingPeriod && secondary.workingPeriod)) {
    bestWorkingPeriod = secondary.workingPeriod;
  } else if (
    secondary.workingPeriod &&
    secondary.workingPeriod.length > (primary.workingPeriod?.length || 0) &&
    !bestWorkingPeriod.includes(secondary.workingPeriod)
  ) {
    // Nếu tệp sau ghi chi tiết hơn (ví dụ có ngày vào ngành)
    bestWorkingPeriod = secondary.workingPeriod;
  }

  // 5. Địa chỉ, chức vụ, giới tính: lấy trường có dữ liệu dài hơn hoặc chính xác hơn
  const bestAddress =
    (secondary.address?.length || 0) > (primary.address?.length || 0)
      ? secondary.address
      : primary.address || secondary.address || "";

  const bestPosition =
    (secondary.position?.length || 0) > (primary.position?.length || 0)
      ? secondary.position
      : primary.position || secondary.position || "";

  const bestGender = primary.gender || secondary.gender || "";
  const bestDob = primary.dateOfBirth || secondary.dateOfBirth || "";

  // Gộp ghi chú nếu có
  const noteParts = [primary.notes, secondary.notes]
    .filter((n) => n && n.trim())
    .map((n) => n!.trim());
  const uniqueNotes = Array.from(new Set(noteParts)).join("; ");

  return {
    ...primary,
    fullName: primary.fullName || secondary.fullName,
    dateOfBirth: bestDob,
    gender: bestGender,
    address: bestAddress,
    position: bestPosition,
    workingPeriod: bestWorkingPeriod,
    salaryGrade: bestSalaryGrade,
    salaryCoefficient: bestSalaryCoeff,
    achievements: sortedAchievements,
    evaluationTitles: sortedEvaluations,
    notes: uniqueNotes
  };
}

/**
 * Hợp nhất danh sách hồ sơ (từ nhiều tệp hoặc nhiều đợt quét):
 * 1. Nếu CÙNG MỘT NGƯỜI: tự động gộp thông tin, sắp xếp thành tích theo thời gian,
 *    cập nhật thâm niên và hệ số lương mới nhất.
 * 2. Nếu NHIỀU NGƯỜI: tự động sắp xếp danh sách theo TÊN theo chuẩn Tiếng Việt (A-Z).
 */
export function mergeAndSortPersonnelRecords(
  existingRecords: PersonnelRecord[],
  incomingRecords: PersonnelRecord[]
): PersonnelRecord[] {
  const personMap = new Map<string, PersonnelRecord>();

  // 1. Đưa các bản ghi hiện tại vào map
  for (const r of existingRecords) {
    const key = normalizePersonKey(r.fullName, r.dateOfBirth);
    if (!key) continue;
    if (!personMap.has(key)) {
      // Đảm bảo thành tích và đánh giá của bản ghi cũ cũng đã được sắp xếp theo thời gian
      personMap.set(key, {
        ...r,
        achievements: sortAchievementsByTime(r.achievements || [], "asc"),
        evaluationTitles: sortEvaluationsByTime(r.evaluationTitles || [], "asc")
      });
    } else {
      const merged = mergeSinglePersonRecords(personMap.get(key)!, r);
      personMap.set(key, merged);
    }
  }

  // 2. Gộp các bản ghi mới tới
  for (const r of incomingRecords) {
    const key = normalizePersonKey(r.fullName, r.dateOfBirth);
    if (!key) continue;
    if (!personMap.has(key)) {
      personMap.set(key, {
        ...r,
        achievements: sortAchievementsByTime(r.achievements || [], "asc"),
        evaluationTitles: sortEvaluationsByTime(r.evaluationTitles || [], "asc")
      });
    } else {
      const merged = mergeSinglePersonRecords(personMap.get(key)!, r);
      personMap.set(key, merged);
    }
  }

  const allRecords = Array.from(personMap.values());

  // 3. Sắp xếp danh sách nhiều người theo TÊN tiếng Việt (A ➔ Z)
  allRecords.sort((a, b) => compareVietnameseNames(a.fullName, b.fullName));

  return allRecords;
}

/**
 * Sắp xếp danh sách hồ sơ cán bộ:
 * - "name_asc": Tên A ➔ Z (chuẩn Tiếng Việt)
 * - "name_desc": Tên Z ➔ A (chuẩn Tiếng Việt)
 * - "seniority_desc": Thâm niên cao ➔ thấp
 * - "salary_desc": Hệ số lương cao ➔ thấp
 */
export function sortRecords(
  records: PersonnelRecord[],
  sortBy: "name_asc" | "name_desc" | "seniority_desc" | "salary_desc" = "name_asc"
): PersonnelRecord[] {
  const cloned = [...records];
  switch (sortBy) {
    case "name_asc":
      return cloned.sort((a, b) => compareVietnameseNames(a.fullName, b.fullName));
    case "name_desc":
      return cloned.sort((a, b) => compareVietnameseNames(b.fullName, a.fullName));
    case "seniority_desc":
      return cloned.sort(
        (a, b) => parseSeniorityValue(b.workingPeriod) - parseSeniorityValue(a.workingPeriod)
      );
    case "salary_desc":
      return cloned.sort(
        (a, b) => parseSalaryCoefficient(b.salaryCoefficient) - parseSalaryCoefficient(a.salaryCoefficient)
      );
    default:
      return cloned.sort((a, b) => compareVietnameseNames(a.fullName, b.fullName));
  }
}
