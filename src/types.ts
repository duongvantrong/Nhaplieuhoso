export interface AchievementItem {
  title: string;
  year: string;
  level?: string;
  note?: string;
}

export interface EvaluationItem {
  title: string; // e.g. "Hoàn thành xuất sắc nhiệm vụ", "Hoàn thành tốt nhiệm vụ", "Hoàn thành nhiệm vụ"
  schoolYear: string; // e.g. "2021-2022", "2022-2023"
  note?: string;
}

export interface PersonnelRecord {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender?: string;
  address: string;
  position: string;
  workingPeriod: string;
  salaryGrade: string; // Bậc lương
  salaryCoefficient: string; // Hệ số lương
  achievements: AchievementItem[]; // Thành tích & năm
  evaluationTitles: EvaluationItem[]; // Danh hiệu trong năm học
  notes?: string;
  rawSnippet?: string;
}

export interface UploadedFileItem {
  id: string;
  file: File;
  base64: string;
  previewUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status?: "idle" | "processing" | "done" | "error";
  errorMessage?: string;
}

export type SortOption = "name_asc" | "name_desc" | "seniority_desc" | "salary_desc";

export interface ExtractionResponse {
  success: boolean;
  records: PersonnelRecord[];
  summary?: string;
  error?: string;
}

export interface OcrResponse {
  success: boolean;
  markdown: string;
  summary?: string;
  error?: string;
}
