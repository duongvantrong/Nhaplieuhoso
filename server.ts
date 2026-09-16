import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import mammoth from "mammoth";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

// System instruction for accurate Vietnamese personnel extraction
const SYSTEM_INSTRUCTION = `Bạn là chuyên gia trích xuất dữ liệu hồ sơ nhân sự, cán bộ, giáo viên, công chức, viên chức Việt Nam.
Nhiệm vụ của bạn là đọc kỹ tài liệu đầu vào (văn bản, sơ yếu lý lịch, báo cáo, danh sách, quyết định, ảnh chụp giấy tờ, bảng lương, chứng chỉ...) và trích xuất danh sách tất cả các cá nhân với các trường thông tin chuẩn xác:
- fullName: Họ và tên (viết hoa hoặc chuẩn tiếng Việt, ví dụ: NGUYỄN VĂN HÙNG hoặc Nguyễn Văn Hùng)
- dateOfBirth: Ngày tháng năm sinh (định dạng DD/MM/YYYY hoặc năm sinh nếu chỉ có năm)
- address: Địa chỉ, quê quán, đơn vị công tác, nơi thường trú hoặc cơ quan, trường học (ví dụ: Trường THCS Tân Hội, Hà Nội...)
- position: Chức vụ, chức danh, môn dạy, nhiệm vụ công tác (ví dụ: Tổ trưởng chuyên môn, Hiệu trưởng, Giáo viên Toán...)
- workingPeriod: Thời gian làm việc, ngày vào ngành, thâm niên, ví dụ: "01/09/2014 (Thâm niên 10%)"
- salaryGrade: Bậc lương hiện hưởng (ví dụ: "Bậc 4" hoặc "4")
- salaryCoefficient: Hệ số lương hiện hưởng (ví dụ: "3.33", "3.66", "4.98")
- achievements: Mảng các thành tích và khen thưởng qua các năm (ví dụ: Lao động tiên tiến năm 2019, Chiến sĩ thi đua cơ sở năm 2020, Bằng khen UBND tỉnh...). Mỗi mục gồm:
    + title: Tên thành tích / hình thức khen thưởng
    + year: Năm đạt thành tích (ví dụ: "2019", "2020", "2023")
    + level: Cấp khen thưởng nếu có (ví dụ: "Cơ sở", "Cấp tỉnh", "Bộ GD&ĐT")
    + note: Ghi chú thêm (số quyết định, lý do khen thưởng)
- evaluationTitles: Mảng kết quả đánh giá, xếp loại viên chức, danh hiệu thi đua trong từng năm học (ví dụ: "Hoàn thành xuất sắc nhiệm vụ", "Hoàn thành tốt nhiệm vụ", "Hoàn thành nhiệm vụ"). Mỗi mục gồm:
    + title: Tên danh hiệu / xếp loại chất lượng (Hoàn thành xuất sắc nhiệm vụ, Hoàn thành tốt nhiệm vụ, Hoàn thành nhiệm vụ)
    + schoolYear: Năm học (ví dụ: "2021-2022", "2022-2023", "2023-2024")
    + note: Ghi chú nếu có
- notes: Thông tin bổ sung hữu ích khác (trình độ chuyên môn, ngạch viên chức, trình độ lý luận chính trị, đảng viên...).

Lưu ý:
1. ĐẶC BIỆT LƯU Ý VỀ HỌ VÀ TÊN (fullName):
   - "fullName" CHỈ LÀ TÊN RIÊNG CỦA CÁ NHÂN ĐƯỢC NỘI DUNG VĂN BẢN ĐỀ CẬP (như người được khen thưởng, người được nâng bậc lương, người hưởng phụ cấp thâm niên, người kê khai lý lịch trích ngang, hoặc từng cá nhân trong danh sách cán bộ, giáo viên).
   - TUYỆT ĐỐI KHÔNG XÉT ĐẾN VÀ KHÔNG ĐƯỢC TRÍCH XUẤT NGƯỜI KÝ Ở GÓC DƯỚI BÊN PHẢI VĂN BẢN (như Hiệu trưởng, Phó Hiệu trưởng, Giám đốc, Phó Giám đốc, Chủ tịch UBND, Trưởng phòng, Thủ trưởng cơ quan đơn vị, TM. UBND, KT. Giám đốc... ký tên, đóng dấu ở phần cuối văn bản).
   - Người ký ở góc dưới bên phải chỉ là người ký ban hành hoặc phê duyệt văn bản, HOÀN TOÀN KHÔNG PHẢI là đối tượng nhân sự được xét trong văn bản. Ví dụ: Quyết định khen thưởng cho bà Nguyễn Thị Mai do Hiệu trưởng Lê Văn Hùng ký tên ở góc dưới bên phải, thì fullName CHỈ LÀ "Nguyễn Thị Mai", TUYỆT ĐỐI KHÔNG lấy "Lê Văn Hùng".
2. Nếu tài liệu có nhiều người được nội dung đề cập, hãy trích xuất tất cả mọi người thành từng đối tượng riêng biệt (vẫn bỏ qua người ký ở cuối văn bản).
3. Không tự bịa đặt thông tin nếu văn bản không đề cập, hãy để chuỗi rỗng "".
4. Chú ý phân biệt rõ giữa:
   - "Thành tích & Năm có thành tích": các danh hiệu Lao động tiên tiến, Chiến sĩ thi đua, Bằng khen, Giấy khen theo năm dương lịch.
   - "Danh hiệu trong năm học": xếp loại đánh giá viên chức theo năm học (Hoàn thành xuất sắc nhiệm vụ, Hoàn thành tốt nhiệm vụ, Hoàn thành nhiệm vụ...).`;

// Signatory filter and detection helpers
const SIGNATORY_TITLE_KEYWORDS = [
  "hiệu trưởng",
  "phó hiệu trưởng",
  "giám đốc",
  "phó giám đốc",
  "chủ tịch",
  "phó chủ tịch",
  "trưởng phòng",
  "phó trưởng phòng",
  "thủ trưởng",
  "thủ trưởng cơ quan",
  "thủ trưởng đơn vị",
  "chủ tọa",
  "thư ký",
  "người ký",
  "người ký văn bản",
  "tm. ban giám hiệu",
  "tm. ủy ban nhân dân",
  "kt. giám đốc",
  "kt. hiệu trưởng"
];

function isLikelySignatoryRecord(r: any): boolean {
  if (!r) return true;
  const name = String(r.fullName || "").trim().toLowerCase();
  if (!name || name === "cán bộ / giáo viên") return true;

  // 1. If name is literally a signatory title or starts with TM. / KT.
  if (SIGNATORY_TITLE_KEYWORDS.some(title => name === title || name.startsWith(title + " ") || name.startsWith("tm.") || name.startsWith("kt."))) {
    return true;
  }

  // 2. If position is a signer role and there are no substantive records (no birth date, no salary, no achievements, no evaluations)
  const pos = String(r.position || "").trim().toLowerCase();
  const hasSignerRole = SIGNATORY_TITLE_KEYWORDS.some(title => pos === title || pos.startsWith("người ký"));
  const hasNoContent = !r.dateOfBirth && !r.salaryGrade && !r.salaryCoefficient && (!r.achievements || r.achievements.length === 0) && (!r.evaluationTitles || r.evaluationTitles.length === 0);

  if (hasSignerRole && hasNoContent) {
    return true;
  }

  // 3. If note specifically mentions "Người ký" or "Ký ban hành"
  const notes = String(r.notes || "").toLowerCase();
  if (notes.includes("người ký") && hasNoContent) {
    return true;
  }

  return false;
}

// Vietnamese name & sorting helpers for server
function getVietnameseNameParts(fullName: string): { firstName: string; middleAndLastName: string } {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return { firstName: "", middleAndLastName: "" };
  const parts = trimmed.split(/\s+/);
  const firstName = parts[parts.length - 1] || "";
  const middleAndLastName = parts.slice(0, -1).join(" ");
  return { firstName, middleAndLastName };
}

function compareVietnameseNames(nameA: string, nameB: string): number {
  const partsA = getVietnameseNameParts(nameA);
  const partsB = getVietnameseNameParts(nameB);
  const cmp = partsA.firstName.localeCompare(partsB.firstName, "vi", { sensitivity: "base", caseFirst: "upper" });
  if (cmp !== 0) return cmp;
  return partsA.middleAndLastName.localeCompare(partsB.middleAndLastName, "vi", { sensitivity: "base", caseFirst: "upper" });
}

function parseYearNumber(yearStr?: string): number {
  if (!yearStr) return 0;
  const match = String(yearStr).match(/\b(19\d{2}|20\d{2})\b/);
  return match ? parseInt(match[1], 10) : 0;
}

function sortAchievementsByTime(achievements: any[]): any[] {
  if (!achievements || achievements.length <= 1) return achievements || [];
  return [...achievements].sort((a, b) => {
    const yA = parseYearNumber(a.year);
    const yB = parseYearNumber(b.year);
    if (yA !== yB) return yA - yB;
    return String(a.title || "").localeCompare(String(b.title || ""), "vi");
  });
}

function sortEvaluationsByTime(evaluations: any[]): any[] {
  if (!evaluations || evaluations.length <= 1) return evaluations || [];
  return [...evaluations].sort((a, b) => {
    const yA = parseYearNumber(a.schoolYear);
    const yB = parseYearNumber(b.schoolYear);
    if (yA !== yB) return yA - yB;
    return String(a.title || "").localeCompare(String(b.title || ""), "vi");
  });
}

function parseSalaryCoefficient(coeffStr?: string): number {
  if (!coeffStr) return 0;
  const clean = String(coeffStr).replace(",", ".");
  const match = clean.match(/(\d+\.\d+|\d+)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseSeniorityValue(seniorityStr?: string): number {
  if (!seniorityStr) return 0;
  const percentMatch = String(seniorityStr).match(/(\d+)\s*%/);
  if (percentMatch) return parseInt(percentMatch[1], 10);
  const yearMatch = String(seniorityStr).match(/(\d+)\s*(năm|tháng)/i);
  if (yearMatch) return parseInt(yearMatch[1], 10);
  const numMatch = String(seniorityStr).match(/\b\d+\b/);
  return numMatch ? parseInt(numMatch[0], 10) : 0;
}

function mergeAndSortServerRecords(records: any[]): any[] {
  const map = new Map<string, any>();

  // Filter out any record that is purely a signatory (signer at bottom right)
  const nonSignatoryRecords = (records || []).filter(r => !isLikelySignatoryRecord(r));
  const effectiveRecords = nonSignatoryRecords.length > 0 ? nonSignatoryRecords : records;

  for (const r of effectiveRecords) {
    const rawName = (r.fullName || "").trim();
    if (!rawName) continue;
    const key = rawName.toLowerCase().replace(/\s+/g, " ");

    if (!map.has(key)) {
      map.set(key, {
        ...r,
        achievements: sortAchievementsByTime(r.achievements || []),
        evaluationTitles: sortEvaluationsByTime(r.evaluationTitles || [])
      });
    } else {
      const existing = map.get(key);
      // Merge achievements without duplicates, sorted chronologically
      const achMap = new Map<string, any>();
      for (const a of [...(existing.achievements || []), ...(r.achievements || [])]) {
        if (!a || !a.title) continue;
        const aKey = `${(a.title || "").trim().toLowerCase()}_${(a.year || "").trim()}`;
        if (!achMap.has(aKey)) achMap.set(aKey, { ...a });
      }
      existing.achievements = sortAchievementsByTime(Array.from(achMap.values()));

      // Merge evaluations without duplicates, sorted chronologically
      const evalMap = new Map<string, any>();
      for (const ev of [...(existing.evaluationTitles || []), ...(r.evaluationTitles || [])]) {
        if (!ev || !ev.title) continue;
        const eKey = `${(ev.title || "").trim().toLowerCase()}_${(ev.schoolYear || "").trim()}`;
        if (!evalMap.has(eKey)) evalMap.set(eKey, { ...ev });
      }
      existing.evaluationTitles = sortEvaluationsByTime(Array.from(evalMap.values()));

      // Compare and take highest / latest salary coefficient & grade
      const cExist = parseSalaryCoefficient(existing.salaryCoefficient);
      const cNew = parseSalaryCoefficient(r.salaryCoefficient);
      if (cNew > cExist) {
        existing.salaryCoefficient = r.salaryCoefficient;
        if (r.salaryGrade) existing.salaryGrade = r.salaryGrade;
      } else if (!existing.salaryCoefficient && r.salaryCoefficient) {
        existing.salaryCoefficient = r.salaryCoefficient;
        if (r.salaryGrade && !existing.salaryGrade) existing.salaryGrade = r.salaryGrade;
      }

      // Compare seniority
      const sExist = parseSeniorityValue(existing.workingPeriod);
      const sNew = parseSeniorityValue(r.workingPeriod);
      if (sNew > sExist || (!existing.workingPeriod && r.workingPeriod)) {
        existing.workingPeriod = r.workingPeriod;
      }

      // Detailed text fields
      if (!existing.dateOfBirth && r.dateOfBirth) existing.dateOfBirth = r.dateOfBirth;
      if (!existing.gender && r.gender) existing.gender = r.gender;
      if ((r.address?.length || 0) > (existing.address?.length || 0)) existing.address = r.address;
      if ((r.position?.length || 0) > (existing.position?.length || 0)) existing.position = r.position;
    }
  }

  const list = Array.from(map.values());
  // Sort multiple people by Vietnamese Name (A-Z)
  list.sort((a, b) => compareVietnameseNames(a.fullName || "", b.fullName || ""));
  return list;
}

// Strip administrative signature block at bottom right
function stripSignatoryBlock(text: string): string {
  if (!text) return "";
  const lines = text.split("\n");
  let cutIndex = -1;

  for (let i = Math.max(0, lines.length - 25); i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line.startsWith("Nơi nhận:") ||
      line.startsWith("Nơi nhận") ||
      /^(?:TM\.|KT\.)\s*[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]+/i.test(line) ||
      /^(?:HIỆU TRƯỞNG|PHÓ HIỆU TRƯỞNG|GIÁM ĐỐC|PHÓ GIÁM ĐỐC|CHỦ TỊCH|PHÓ CHỦ TỊCH|TRƯỞNG PHÒNG|THỦ TRƯỞNG(?:\s+ĐƠN VỊ)?)\b/i.test(line)
    ) {
      cutIndex = i;
      break;
    }
  }

  if (cutIndex !== -1 && cutIndex >= 4) {
    return lines.slice(0, cutIndex).join("\n");
  }
  return text;
}

// Enhanced rule-based extractor for Vietnamese personnel documents
function ruleBasedExtractor(text: string) {
  if (!text || !text.trim()) return [];

  // Strip signature block at the bottom right before extracting names
  const cleanBodyText = stripSignatoryBlock(text);

  const records: any[] = [];
  // Split into individual personnel sections if document lists multiple people
  const blocks = cleanBodyText.split(/(?:---+|\bCán bộ\s+\d+:|\b\d+\.\s+Cán bộ|\bĐồng chí:|\bHọ và tên viên chức:|\b1\.\s+Cán bộ|\b2\.\s+Cán bộ|\b3\.\s+Cán bộ)/i);
  const candidateTexts = blocks.length > 1 ? blocks.filter(b => b.trim().length > 25) : [cleanBodyText];

  for (const block of candidateTexts) {
    // 1. Full name
    let fullName = "";
    const nameMatch = block.match(/(?:Họ và tên(?:\s+viên chức)?|Họ tên|Tên cán bộ|Đồng chí|viên chức)[:\s]*([^\n,\.\(\)]+)/i);
    if (nameMatch) {
      fullName = nameMatch[1].trim().replace(/^[-–—:\s]+/, "");
    } else {
      // Look for prominent uppercase Vietnamese name
      const capMatch = block.match(/\b([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]{6,35})\b/);
      if (capMatch && !capMatch[1].includes("CỘNG HÒA") && !capMatch[1].includes("VIỆT NAM") && !capMatch[1].includes("ĐỘC LẬP")) {
        fullName = capMatch[1].trim();
      }
    }

    // 2. Date of birth
    let dateOfBirth = "";
    const dobMatch = block.match(/(?:Ngày(?:\s+tháng)?(?:\s+năm)?\s+sinh|Sinh ngày|Năm sinh)[:\s]*([0-9\/\-\.]+)/i);
    if (dobMatch) {
      dateOfBirth = dobMatch[1].trim().replace(/[\.\s]+$/, "");
    }

    // 3. Gender
    let gender = "";
    const genderMatch = block.match(/(?:Giới tính|Phái)[:\s]*(Nam|Nữ)/i) || block.match(/\b(Nam|Nữ)\b/i);
    if (genderMatch && block.includes(genderMatch[0])) {
      gender = genderMatch[1];
    }

    // 4. Address / Residence
    let address = "";
    const addressMatch = block.match(/(?:Quê quán(?:\s+thường trú)?|Địa chỉ(?: thường trú)?|Nơi cư trú|Nơi ở hiện nay|Hộ khẩu)[:\s]*([^;\n]+?)(?=(?:\s*\.\s*(?:Chức vụ|Thời gian|Bậc|Hệ số|Năm|[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]|\n|$))|\.|$)/i);
    if (addressMatch) {
      address = addressMatch[1].trim().replace(/^[-–—:\s]+/, "").replace(/[\.\s]+$/, "");
    }

    // 5. Position
    let position = "";
    const posMatch = block.match(/(?:Chức vụ(?: hiện tại)?|Chức danh(?:\s+chức vụ)?|Nhiệm vụ(?: công tác)?|Chức vụ đảm nhiệm)[:\s]*([^;\n\.]+)/i);
    if (posMatch) {
      position = posMatch[1].trim().replace(/^[-–—:\s]+/, "").replace(/[\.\s]+$/, "");
    }

    // 6. Working period
    let workingPeriod = "";
    const periodMatch = block.match(/(?:Thời gian(?: bắt đầu)? làm việc|Thời gian công tác(?: trong ngành)?|Ngày vào ngành|Quá trình công tác|Vào ngành)[:\s]*([^;\n\.]+)/i);
    if (periodMatch) {
      workingPeriod = periodMatch[1].trim().replace(/^[-–—:\s]+/, "").replace(/[\.\s]+$/, "");
    }

    // 7. Salary grade and coefficient
    let salaryGrade = "";
    const gradeMatch = block.match(/(?:Bậc lương(?: hiện hưởng| hiện tại)?|Bậc)[:\s]*([Bậc\s0-9\/\-]+)/i);
    if (gradeMatch) {
      salaryGrade = gradeMatch[1].trim().replace(/[\.\s]+$/, "");
    }

    let salaryCoefficient = "";
    const coefMatch = block.match(/(?:Hệ số lương|Hệ số|hệ số)[:\s]*([0-9]+(?:[\.,][0-9]+)?)/i);
    if (coefMatch) {
      salaryCoefficient = coefMatch[1].trim().replace(/[\.\s]+$/, "");
    }

    // 8. Achievements extraction
    const achievements: any[] = [];
    // Pattern A: "Năm 2019: Lao động tiên tiến..."
    const achRegexA = /(?:Năm\s*(\d{4})[:\s*-]+([^,;\.\n]+))/gi;
    let matchA;
    while ((matchA = achRegexA.exec(block)) !== null) {
      const yr = matchA[1];
      const titleStr = matchA[2].trim().replace(/^[-–—:\s]+/, "");
      if (!titleStr.toLowerCase().includes("hoàn thành") && titleStr.length > 2) {
        achievements.push({
          year: yr,
          title: titleStr,
          level: titleStr.includes("tỉnh") ? "Cấp tỉnh" : titleStr.includes("cơ sở") ? "Cơ sở" : ""
        });
      }
    }

    // Pattern B: "Lao động tiên tiến năm 2019", "Chiến sĩ thi đua năm 2020"
    const achRegexB = /(Lao động tiên tiến|Chiến sĩ thi đua(?:\s+cấp cơ sở|\s+cơ sở|\s+cấp tỉnh)?|Bằng khen|Giấy khen)[^0-9\n\.]*(?:năm\s*(\d{4})|\((\d{4})\))/gi;
    let matchB;
    while ((matchB = achRegexB.exec(block)) !== null) {
      const title = matchB[1].trim();
      const yr = matchB[2] || matchB[3];
      if (yr && !achievements.some(a => a.year === yr && a.title.includes(title))) {
        achievements.push({
          year: yr,
          title: title,
          level: ""
        });
      }
    }

    // 9. School Year Evaluations
    const evaluations: any[] = [];
    // Pattern A: "Năm học 2021-2022: Hoàn thành xuất sắc nhiệm vụ"
    const evalRegexA = /(?:Năm học\s*(\d{4}\s*-\s*\d{4})[:\s*-]+([^\n;\.]+))/gi;
    let matchEvalA;
    while ((matchEvalA = evalRegexA.exec(block)) !== null) {
      evaluations.push({
        schoolYear: matchEvalA[1].replace(/\s+/g, ""),
        title: matchEvalA[2].trim()
      });
    }

    // Pattern B: "Hoàn thành xuất sắc nhiệm vụ", "Hoàn thành tốt nhiệm vụ", "Hoàn thành nhiệm vụ"
    if (evaluations.length === 0) {
      const evalKeywords = ["Hoàn thành xuất sắc nhiệm vụ", "Hoàn thành tốt nhiệm vụ", "Hoàn thành nhiệm vụ"];
      for (const kw of evalKeywords) {
        if (block.toLowerCase().includes(kw.toLowerCase())) {
          evaluations.push({
            schoolYear: "Gần nhất",
            title: kw
          });
          break;
        }
      }
    }

    if (fullName || posMatch || achievements.length > 0 || salaryGrade) {
      records.push({
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        fullName: fullName || "Cán bộ / Giáo viên",
        dateOfBirth: dateOfBirth || "",
        gender: gender || "",
        address: address || "",
        position: position || "",
        workingPeriod: workingPeriod || "",
        salaryGrade: salaryGrade || "",
        salaryCoefficient: salaryCoefficient || "",
        achievements,
        evaluationTitles: evaluations,
        notes: "Trích xuất thông minh từ văn bản"
      });
    }
  }

  return mergeAndSortServerRecords(records);
}

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY
  });
});

// Helper: Extract text or inlineData from request payload
async function extractPayloadContent(body: any): Promise<{
  contentToAnalyze: string;
  inlineDataPart: { inlineData: { mimeType: string; data: string } } | null;
}> {
  const { text, fileBase64, mimeType, fileName } = body || {};
  let contentToAnalyze = text || "";
  let inlineDataPart: { inlineData: { mimeType: string; data: string } } | null = null;

  if (fileBase64 && mimeType) {
    if (
      mimeType.includes("wordprocessingml") ||
      mimeType.includes("officedocument") ||
      (fileName && fileName.toLowerCase().endsWith(".docx"))
    ) {
      try {
        const buffer = Buffer.from(fileBase64, "base64");
        const result = await mammoth.extractRawText({ buffer });
        contentToAnalyze = result.value;
      } catch (docxErr: any) {
        console.error("Error parsing docx with mammoth:", docxErr);
        contentToAnalyze = "Lỗi đọc file docx: " + docxErr.message;
      }
    } else if (
      mimeType.startsWith("text/") ||
      mimeType.includes("csv") ||
      (fileName && (fileName.toLowerCase().endsWith(".txt") || fileName.toLowerCase().endsWith(".md")))
    ) {
      contentToAnalyze = Buffer.from(fileBase64, "base64").toString("utf-8");
    } else if (mimeType === "application/pdf" || mimeType.startsWith("image/")) {
      inlineDataPart = {
        inlineData: {
          mimeType: mimeType,
          data: fileBase64
        }
      };
    }
  }

  return { contentToAnalyze, inlineDataPart };
}

// Supported modern Gemini models according to @google/genai guidelines
const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.8-flash"
];

// 1. Step 1: Scan File/Image and convert to Markdown
app.post("/api/ocr-to-markdown", async (req, res) => {
  try {
    const { contentToAnalyze, inlineDataPart } = await extractPayloadContent(req.body);

    if (!contentToAnalyze.trim() && !inlineDataPart) {
      return res.status(400).json({
        success: false,
        error: "Không có nội dung văn bản hoặc hình ảnh hợp lệ để quét."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback markdown generator if API key is absent
      const fallbackMarkdown = contentToAnalyze
        ? `# NỘI DUNG TÀI LIỆU QUÉT\n\n${contentToAnalyze}`
        : "# NỘI DUNG TÀI LIỆU\n\n*Không thể quét ảnh khi chưa có GEMINI_API_KEY.*";
      return res.json({
        success: true,
        markdown: fallbackMarkdown,
        summary: "Đã chuyển văn bản sang Markdown (chế độ dự phòng không cần khóa API)."
      });
    }

    const ai = getAi();
    const parts: any[] = [];
    if (inlineDataPart) {
      parts.push(inlineDataPart);
    }
    parts.push({
      text: `Bạn là chuyên gia OCR và số hóa tài liệu tiếng Việt cao cấp.
Nhiệm vụ của bạn là đọc toàn bộ nội dung trong tài liệu (hình ảnh scan, ảnh chụp giấy tờ, bảng danh sách phụ cấp thâm niên nhà giáo, bảng lương, quyết định, trích ngang lý lịch...) và chuyển đổi thành định dạng Markdown chuẩn, trung thực 100%:

1. BẢNG BIỂU: Nếu tài liệu có bảng biểu dạng lưới (như danh sách cán bộ, danh sách xét hưởng phụ cấp thâm niên 10%, bảng nâng bậc lương):
   - BẮT BUỘC định dạng thành Bảng Markdown hoàn chỉnh:
     | STT | Họ và tên | Ngày/Năm sinh | Giới tính | Địa chỉ / Đơn vị | Chức vụ | Thời gian vào ngành / Thâm niên | Bậc lương | Hệ số lương | Thành tích khen thưởng | Đánh giá năm học | Ghi chú |
   - Đảm bảo trích xuất đầy đủ tất cả các hàng tương ứng với từng cán bộ giáo viên, không bỏ sót dòng nào.
2. VĂN BẢN HÀNH CHÍNH: Sử dụng các cấp tiêu đề (#, ##, ###) cho Quốc hiệu, Cơ quan ban hành, Tiêu đề tờ trình, quyết định.
3. Giữ nguyên số liệu quan trọng: Hệ số lương (ví dụ: 3.33, 3.66), bậc lương, phần trăm thâm niên (ví dụ: 10%, 11%), các năm khen thưởng.
4. Chỉ trả về nội dung Markdown rõ ràng, dễ đọc, không kèm lời mở đầu hoặc kết thúc xã giao.

${contentToAnalyze ? `Nội dung văn bản cần chuyển đổi sang định dạng Markdown:\n"""\n${contentToAnalyze}\n"""` : ""}`
    });

    let markdownResult = "";
    let lastError: any = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[OCR-to-Markdown] Attempting with model: ${modelName}`);
        const modelCallPromise = ai.models.generateContent({
          model: modelName,
          contents: { parts }
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout sau 45 giây với mô hình ${modelName}`)), 45000);
        });

        const response: any = await Promise.race([modelCallPromise, timeoutPromise]);
        if (response && response.text) {
          markdownResult = response.text.trim();
          break;
        }
      } catch (err: any) {
        console.warn(`[OCR-to-Markdown] Failed with model ${modelName}:`, err.message);
        lastError = err;
      }
    }

    if (!markdownResult) {
      // Fallback if AI fails
      if (contentToAnalyze && contentToAnalyze.trim()) {
        markdownResult = `# TÀI LIỆU QUÉT DỰ PHÒNG\n\n${contentToAnalyze}`;
      } else {
        throw lastError || new Error("Không thể quét nội dung từ tài liệu/ảnh.");
      }
    }

    return res.json({
      success: true,
      markdown: markdownResult,
      summary: "Đã quét và chuyển đổi nội dung tài liệu sang định dạng Markdown thành công."
    });
  } catch (error: any) {
    console.error("OCR to Markdown error:", error);
    let cleanMsg = error?.message || "Đã xảy ra lỗi khi quét tài liệu sang Markdown.";
    if (cleanMsg.includes("503") || cleanMsg.includes("high demand") || cleanMsg.includes("UNAVAILABLE")) {
      cleanMsg = "Máy chủ AI hiện đang chịu tải cao tạm thời. Vui lòng bấm 'Thử lại ngay'.";
    }
    return res.status(500).json({
      success: false,
      error: cleanMsg
    });
  }
});

// 2. Step 2: Convert Markdown text to structured personnel records
app.post("/api/markdown-to-table", async (req, res) => {
  const { markdown } = req.body || {};
  const content = markdown || "";

  if (!content.trim()) {
    return res.status(400).json({
      success: false,
      error: "Không có nội dung Markdown để chuyển thành bảng dữ liệu."
    });
  }

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      records: {
        type: Type.ARRAY,
        description: "Danh sách tất cả cán bộ, giáo viên, viên chức trích xuất được từ bảng/văn bản Markdown",
        items: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING, description: "Họ và tên cán bộ / giáo viên (ngắn gọn, ví dụ: Nguyễn Văn A)" },
            dateOfBirth: { type: Type.STRING, description: "Ngày sinh (ngắn gọn, ví dụ: 12/04/1989)" },
            gender: { type: Type.STRING, description: "Giới tính (Nam hoặc Nữ)" },
            address: { type: Type.STRING, description: "Địa chỉ / Đơn vị công tác (ngắn gọn, dưới 60 ký tự)" },
            position: { type: Type.STRING, description: "Chức vụ / Chức danh công tác (ngắn gọn, ví dụ: Giáo viên Toán)" },
            workingPeriod: { type: Type.STRING, description: "Thời gian làm việc / thâm niên ngắn gọn (ví dụ: '01/09/2014 (Thâm niên 10%)' hoặc '10 năm'). TUYỆT ĐỐI không giải thích hay bình luận" },
            salaryGrade: { type: Type.STRING, description: "Bậc lương (ngắn gọn, ví dụ: Bậc 4)" },
            salaryCoefficient: { type: Type.STRING, description: "Hệ số lương (ngắn gọn, ví dụ: 3.33)" },
            achievements: {
              type: Type.ARRAY,
              description: "Thành tích, khen thưởng qua các năm",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Tên danh hiệu thi đua / khen thưởng" },
                  year: { type: Type.STRING, description: "Năm đạt thành tích" },
                  level: { type: Type.STRING, description: "Cấp khen thưởng nếu có" },
                  note: { type: Type.STRING, description: "Ghi chú thêm" }
                },
                required: ["title", "year"]
              }
            },
            evaluationTitles: {
              type: Type.ARRAY,
              description: "Danh hiệu, xếp loại đánh giá trong năm học",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Tên xếp loại (Xuất sắc, Tốt...)" },
                  schoolYear: { type: Type.STRING, description: "Năm học (ví dụ 2022-2023)" },
                  note: { type: Type.STRING, description: "Ghi chú thêm" }
                },
                required: ["title", "schoolYear"]
              }
            },
            notes: { type: Type.STRING, description: "Ghi chú bổ sung" }
          },
          required: ["fullName"]
        }
      },
      summary: {
        type: Type.STRING,
        description: "Tóm tắt ngắn gọn số lượng hồ sơ đã chuyển đổi"
      }
    },
    required: ["records"]
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      const fallbackRecords = ruleBasedExtractor(content);
      return res.json({
        success: true,
        records: fallbackRecords,
        summary: `Đã trích xuất ${fallbackRecords.length} cán bộ từ Markdown (bộ phân tích cục bộ).`
      });
    }

    const ai = getAi();
    const parts = [
      {
        text: `Bạn là chuyên gia trích xuất dữ liệu hồ sơ nhân sự, cán bộ, giáo viên Việt Nam.
Hãy đọc bảng Markdown dưới đây và trích xuất danh sách tất cả các cán bộ, giáo viên thành đối tượng JSON chuẩn xác theo cấu trúc sau:
{
  "records": [
    {
      "fullName": "Họ và tên cán bộ / giáo viên",
      "dateOfBirth": "Ngày/năm sinh (ví dụ: 12/04/1989)",
      "gender": "Giới tính (Nam hoặc Nữ)",
      "address": "Đơn vị công tác / Địa chỉ / Trường học (ví dụ: Trường THCS Tân Hội)",
      "position": "Chức vụ / Bộ môn (ví dụ: Giáo viên Toán)",
      "workingPeriod": "Thời gian vào ngành và thâm niên (ví dụ: '01/09/2014 (Thâm niên: 10%)')",
      "salaryGrade": "Bậc lương (ví dụ: '4' hoặc 'Bậc 4')",
      "salaryCoefficient": "Hệ số lương (ví dụ: '3.33')",
      "achievements": [
        {
          "title": "Tên danh hiệu thi đua / khen thưởng",
          "year": "Năm đạt"
        }
      ],
      "evaluationTitles": [
        {
          "title": "Xếp loại năm học",
          "schoolYear": "Năm học"
        }
      ],
      "notes": "Ghi chú nếu có"
    }
  ],
  "summary": "Tóm tắt ngắn gọn số lượng hồ sơ đã chuyển đổi"
}

QUY TẮC BẮT BUỘC:
1. HỌ VÀ TÊN (fullName): CHỈ LẤY TÊN RIÊNG CỦA CÁ NHÂN ĐƯỢC NỘI DUNG VĂN BẢN ĐỀ CẬP (như người được khen thưởng, người được nâng bậc lương, người hưởng phụ cấp thâm niên, người kê khai lý lịch hoặc giáo viên trong danh sách).
2. TUYỆT ĐỐI KHÔNG XÉT ĐẾN VÀ KHÔNG TRÍCH XUẤT NGƯỜI KÝ Ở GÓC DƯỚI BÊN PHẢI VĂN BẢN (như Hiệu trưởng, Phó Hiệu trưởng, Giám đốc, Phó Giám đốc, Chủ tịch UBND, Trưởng phòng, Thủ trưởng đơn vị, TM. UBND, KT. Giám đốc... ký tên đóng dấu ở cuối văn bản). Người ký chỉ là người ban hành/phê duyệt văn bản, HOÀN TOÀN KHÔNG PHẢI đối tượng nhân sự được xét trong văn bản. Bỏ qua hoàn toàn người ký này.
3. Mỗi dòng/mục tương ứng với 1 cán bộ, không gộp nhiều cột vào 1 trường. Trường address ghi riêng đơn vị/địa chỉ, trường workingPeriod chỉ ghi thời gian vào ngành và thâm niên, trường salaryGrade ghi riêng bậc lương, salaryCoefficient ghi hệ số lương.
4. Trả về JSON thuần túy.

Nội dung Markdown cần chuyển đổi:
${content}`
      }
    ];

    let lastError: any = null;
    let parsedData: any = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[Markdown-to-Table] Attempting with model: ${modelName}`);
        const config: any = {
          responseMimeType: "application/json"
        };

        const modelCallPromise = ai.models.generateContent({
          model: modelName,
          contents: { parts },
          config
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout sau 45 giây với mô hình ${modelName}`)), 45000);
        });

        const response: any = await Promise.race([modelCallPromise, timeoutPromise]);
        if (response && response.text) {
          console.log("[Markdown-to-Table] Raw AI response:", response.text);
          parsedData = JSON.parse(response.text);
          break;
        }
      } catch (err: any) {
        console.warn(`[Markdown-to-Table] Failed with model ${modelName}:`, err.message);
        lastError = err;
      }
    }

    const rawRecords = Array.isArray(parsedData)
      ? parsedData
      : (parsedData && Array.isArray(parsedData.records) ? parsedData.records : []);

    if (rawRecords.length === 0) {
      console.warn("AI table conversion produced no records, falling back to rule-based parser");
      const fallbackRecords = ruleBasedExtractor(content);
      return res.json({
        success: true,
        records: fallbackRecords,
        summary: `Đã chuyển đổi thành công ${fallbackRecords.length} hồ sơ (bộ phân tích dự phòng).`
      });
    }
    const mergedAndSorted = mergeAndSortServerRecords(rawRecords);

    const cleanField = (val: any, maxLen = 80): string => {
      if (!val) return "";
      let str = String(val).trim();
      if (str.length > maxLen) {
        // If it's a long reasoning text, take first line or segment before '-' or '('
        const firstLine = str.split("\n")[0].split(/[.;]/)[0].trim();
        if (firstLine.length > 0 && firstLine.length <= maxLen) {
          return firstLine;
        }
        return str.substring(0, maxLen).trim();
      }
      return str;
    };

    const recordsWithId = mergedAndSorted.map((r: any, idx: number) => ({
      ...r,
      fullName: cleanField(r.fullName, 60),
      dateOfBirth: cleanField(r.dateOfBirth, 30),
      gender: cleanField(r.gender, 10),
      address: cleanField(r.address, 100),
      position: cleanField(r.position, 60),
      workingPeriod: cleanField(r.workingPeriod, 80),
      salaryGrade: cleanField(r.salaryGrade, 30),
      salaryCoefficient: cleanField(r.salaryCoefficient, 20),
      notes: cleanField(r.notes, 120),
      id: `rec-${Date.now()}-${idx}`
    }));

    return res.json({
      success: true,
      records: recordsWithId,
      summary: parsedData.summary || `Đã chuyển đổi thành công ${recordsWithId.length} hồ sơ vào bảng dữ liệu (đã gộp thành tích theo thời gian & sắp xếp theo Tên A-Z).`
    });
  } catch (error: any) {
    console.error("Markdown to Table error:", error);
    const fallbackRecords = ruleBasedExtractor(content);
    if (fallbackRecords.length > 0) {
      return res.json({
        success: true,
        records: fallbackRecords,
        summary: `Đã chuyển đổi thành công ${fallbackRecords.length} hồ sơ (qua bộ nhận diện dự phòng).`
      });
    }

    return res.status(500).json({
      success: false,
      error: error?.message || "Đã xảy ra lỗi khi chuyển đổi Markdown thành bảng dữ liệu."
    });
  }
});

// API: Extract personnel data from text or uploaded file
app.post("/api/extract", async (req, res) => {
  const { text, fileBase64, mimeType, fileName } = req.body || {};
  let contentToAnalyze = text || "";

  try {
    let inlineDataPart: { inlineData: { mimeType: string; data: string } } | null = null;

    // Handle uploaded file if provided
    if (fileBase64 && mimeType) {
      // 1. DOCX file -> parse via mammoth
      if (
        mimeType.includes("wordprocessingml") ||
        mimeType.includes("officedocument") ||
        (fileName && fileName.toLowerCase().endsWith(".docx"))
      ) {
        try {
          const buffer = Buffer.from(fileBase64, "base64");
          const result = await mammoth.extractRawText({ buffer });
          contentToAnalyze = result.value;
        } catch (docxErr: any) {
          console.error("Error parsing docx with mammoth:", docxErr);
          contentToAnalyze = "Không thể đọc văn bản từ file docx: " + docxErr.message;
        }
      }
      // 2. Plain text / CSV files
      else if (
        mimeType.startsWith("text/") ||
        mimeType.includes("csv") ||
        (fileName && (fileName.toLowerCase().endsWith(".txt") || fileName.toLowerCase().endsWith(".md")))
      ) {
        contentToAnalyze = Buffer.from(fileBase64, "base64").toString("utf-8");
      }
      // 3. PDF or Images (png, jpg, webp) -> feed multi-modal inlineData to Gemini
      else if (
        mimeType === "application/pdf" ||
        mimeType.startsWith("image/")
      ) {
        inlineDataPart = {
          inlineData: {
            mimeType: mimeType,
            data: fileBase64
          }
        };
      }
    }

    if (!contentToAnalyze.trim() && !inlineDataPart) {
      return res.status(400).json({
        success: false,
        error: "Không có nội dung văn bản hoặc file hợp lệ để trích xuất."
      });
    }

    // Check if GEMINI_API_KEY is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not configured, using rule-based fallback");
      const fallbackRecords = ruleBasedExtractor(contentToAnalyze);
      return res.json({
        success: true,
        records: fallbackRecords,
        summary: "Dữ liệu được trích xuất bằng bộ lọc mẫu (Vui lòng cấu hình GEMINI_API_KEY trong Settings > Secrets để dùng mô hình Gemini AI chính xác nhất)."
      });
    }

    // Call Gemini with automatic model fallback for high reliability
    const ai = getAi();

    const parts: any[] = [];
    if (inlineDataPart) {
      parts.push(inlineDataPart);
    }
    parts.push({
      text: `Bạn là trợ lý chuyên nghiệp về số hóa tài liệu nhân sự và quản lý cán bộ giáo viên tại Việt Nam.
Hãy đọc kỹ toàn bộ tài liệu (ảnh chụp văn bản, quyết định, bảng danh sách phụ cấp thâm niên, danh sách nâng bậc lương, hồ sơ lý lịch trích ngang, hoặc công văn):
1. Nhận diện và trích xuất TẤT CẢ các cán bộ, giáo viên, công chức xuất hiện trong văn bản hoặc từng dòng của bảng danh sách.
2. Với mỗi cán bộ, hãy lấy đầy đủ:
   - Họ và tên (fullName)
   - Ngày tháng năm sinh (dateOfBirth)
   - Giới tính nếu có (gender)
   - Địa chỉ / Quê quán / Đơn vị công tác (address)
   - Chức vụ / Chức danh nghề nghiệp (position - ví dụ: Giáo viên, Hiệu trưởng, Tổ trưởng, Chuyên viên...)
   - Thời gian làm việc / thâm niên nghề nghiệp (workingPeriod - ví dụ: thâm niên 10%, từ năm 2014, 10 năm công tác, ngày vào ngành...)
   - Bậc lương (salaryGrade - ví dụ: Bậc 3, Bậc 4...)
   - Hệ số lương (salaryCoefficient - ví dụ: 3.00, 3.33, 3.66...)
   - Thành tích & Khen thưởng (achievements: Lao động tiên tiến, Chiến sĩ thi đua, Bằng khen, Giấy khen...)
   - Đánh giá xếp loại năm học (evaluationTitles: Hoàn thành xuất sắc nhiệm vụ, Hoàn thành tốt nhiệm vụ...)
   - Ghi chú thêm (notes)

${contentToAnalyze ? `Nội dung văn bản kèm theo:\n${contentToAnalyze}` : ""}`
    });

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        records: {
          type: Type.ARRAY,
          description: "Danh sách tất cả cán bộ, giáo viên, viên chức trích xuất được từ tài liệu",
          items: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING, description: "Họ và tên cán bộ / giáo viên" },
              dateOfBirth: { type: Type.STRING, description: "Ngày tháng năm sinh hoặc năm sinh" },
              gender: { type: Type.STRING, description: "Giới tính (Nam/Nữ)" },
              address: { type: Type.STRING, description: "Địa chỉ / Quê quán / Đơn vị" },
              position: { type: Type.STRING, description: "Chức vụ / Chức danh công tác" },
              workingPeriod: { type: Type.STRING, description: "Thời gian làm việc / Thâm niên / Mốc thâm niên" },
              salaryGrade: { type: Type.STRING, description: "Bậc lương" },
              salaryCoefficient: { type: Type.STRING, description: "Hệ số lương" },
              achievements: {
                type: Type.ARRAY,
                description: "Thành tích, khen thưởng qua các năm",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Tên danh hiệu thi đua / khen thưởng" },
                    year: { type: Type.STRING, description: "Năm đạt thành tích" },
                    level: { type: Type.STRING, description: "Cấp khen thưởng nếu có" },
                    note: { type: Type.STRING, description: "Ghi chú thêm" }
                  },
                  required: ["title", "year"]
                }
              },
              evaluationTitles: {
                type: Type.ARRAY,
                description: "Danh hiệu, xếp loại đánh giá trong năm học",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Tên xếp loại (Xuất sắc, Tốt...)" },
                    schoolYear: { type: Type.STRING, description: "Năm học (ví dụ 2022-2023)" },
                    note: { type: Type.STRING, description: "Ghi chú thêm" }
                  },
                  required: ["title", "schoolYear"]
                }
              },
              notes: { type: Type.STRING, description: "Ghi chú bổ sung" }
            },
            required: ["fullName"]
          }
        },
        summary: {
          type: Type.STRING,
          description: "Tóm tắt ngắn gọn số lượng hồ sơ đã trích xuất"
        }
      },
      required: ["records"]
    };

    let lastError: any = null;
    let response: any = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`Attempting extraction with model: ${modelName}`);
        const config: any = {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: responseSchema
        };

        const modelCallPromise = ai.models.generateContent({
          model: modelName,
          contents: { parts },
          config
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout với mô hình ${modelName}`)), 45000);
        });

        response = await Promise.race([modelCallPromise, timeoutPromise]);
        if (response && response.text) {
          console.log(`Successfully generated content with model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or busy:`, err?.message || err);
        lastError = err;
        // Continue loop to try next model
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Không thể kết nối đến máy chủ AI sau khi thử các mô hình.");
    }

    const outputText = response.text || "{}";
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(outputText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON output:", outputText);
      // Fallback rule based
      const fallbackRecords = ruleBasedExtractor(contentToAnalyze);
      return res.json({
        success: true,
        records: fallbackRecords,
        summary: "Trích xuất dự phòng hoàn tất."
      });
    }

    const rawRecords = parsedData.records || [];
    const mergedAndSorted = mergeAndSortServerRecords(rawRecords);
    const recordsWithId = mergedAndSorted.map((r: any, idx: number) => ({
      ...r,
      id: `rec-${Date.now()}-${idx}`
    }));

    return res.json({
      success: true,
      records: recordsWithId,
      summary: parsedData.summary || `Đã trích xuất thành công ${recordsWithId.length} hồ sơ (đã gộp và sắp xếp theo Tên A-Z).`
    });
  } catch (error: any) {
    console.error("Extraction error, falling back to rule-based parser:", error);
    // If we have text content, attempt fallback extraction
    if (contentToAnalyze && contentToAnalyze.trim()) {
      const fallbackRecords = ruleBasedExtractor(contentToAnalyze);
      if (fallbackRecords.length > 0) {
        return res.json({
          success: true,
          records: fallbackRecords,
          summary: `Đã trích xuất thành công ${fallbackRecords.length} hồ sơ (qua bộ nhận diện dự phòng).`
        });
      }
    }

    let cleanErrorMessage = error?.message || "Đã xảy ra lỗi trong quá trình trích xuất dữ liệu.";
    try {
      if (cleanErrorMessage.startsWith("{") && cleanErrorMessage.includes('"message"')) {
        const parsed = JSON.parse(cleanErrorMessage);
        if (parsed?.error?.message) {
          cleanErrorMessage = parsed.error.message;
        }
      }
    } catch {
      // keep original
    }

    if (cleanErrorMessage.includes("503") || cleanErrorMessage.includes("high demand") || cleanErrorMessage.includes("UNAVAILABLE")) {
      cleanErrorMessage = "Máy chủ AI hiện đang chịu tải cao tạm thời từ hệ thống. Vui lòng bấm thử lại sau 3-5 giây.";
    }

    return res.status(500).json({
      success: false,
      error: cleanErrorMessage
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
