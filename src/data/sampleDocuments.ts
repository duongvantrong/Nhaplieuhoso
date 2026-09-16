export interface SampleDoc {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: "sample-1",
    title: "Sơ yếu lý lịch trích ngang - Giáo viên THPT",
    description: "Hồ sơ cá nhân giáo viên với đầy đủ quá trình công tác, ngạch bậc lương và khen thưởng",
    category: "Hồ sơ giáo viên",
    content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------
SƠ YẾU LÝ LỊCH TRÍCH NGANG CÁN BỘ VIÊN CHỨC

1. Họ và tên: NGUYỄN VĂN HÙNG
2. Ngày tháng năm sinh: 15/08/1984. Giới tính: Nam
3. Quê quán / Địa chỉ thường trú: Số 45 đường Trần Hưng Đạo, Phường 2, TP. Đà Lạt, tỉnh Lâm Đồng.
4. Chức vụ hiện tại: Tổ trưởng chuyên môn Toán - Tin, Trường THPT Chuyên Thăng Long.
5. Thời gian bắt đầu làm việc / Ngày vào ngành: 01/09/2007 (Thâm niên công tác: 17 năm).
6. Mã ngạch viên chức: V.07.05.15 (Giáo viên THPT hạng II)
   - Bậc lương hiện hưởng: Bậc 5
   - Hệ số lương: 3.99 (hưởng từ tháng 10/2022)
7. Thành tích và các hình thức khen thưởng qua các năm:
   - Năm 2018: Đạt danh hiệu Lao động tiên tiến (Quyết định số 112/QĐ-SGDĐT).
   - Năm 2019: Lao động tiên tiến, Giấy khen của Giám đốc Sở Giáo dục & Đào tạo.
   - Năm 2020: Đạt danh hiệu Chiến sĩ thi đua cấp cơ sở.
   - Năm 2022: Đạt danh hiệu Chiến sĩ thi đua cấp cơ sở.
   - Năm 2023: Nhận Bằng khen của Chủ tịch Ủy ban nhân dân tỉnh vì có thành tích xuất sắc trong công tác bồi dưỡng học sinh giỏi quốc gia.
8. Đánh giá xếp loại chất lượng viên chức và danh hiệu thi đua trong các năm học:
   - Năm học 2020 - 2021: Hoàn thành tốt nhiệm vụ
   - Năm học 2021 - 2022: Hoàn thành xuất sắc nhiệm vụ
   - Năm học 2022 - 2023: Hoàn thành xuất sắc nhiệm vụ
   - Năm học 2023 - 2024: Hoàn thành xuất sắc nhiệm vụ
9. Ghi chú: Đảng viên Đảng Cộng sản Việt Nam, lý luận chính trị Trung cấp.`
  },
  {
    id: "sample-2",
    title: "Danh sách tổng hợp viên chức đề nghị xét khen thưởng",
    description: "Văn bản chứa thông tin nhiều cán bộ đồng thời để kiểm tra bóc tách nhiều dòng",
    category: "Danh sách tổng hợp",
    content: `BẢNG TỔNG HỢP TRÍCH NGANG CÁN BỘ ĐỀ NGHỊ XÉT KHEN THƯỞNG NĂM HỌC 2023-2024
Đơn vị: Trường Tiểu học Nguyễn Du, Quận Hải Châu, TP. Đà Nẵng

---
1. Cán bộ 1:
- Họ và tên: TRẦN THỊ MAI HOA
- Ngày sinh: 22/11/1988. Nữ.
- Địa chỉ: K120/14 Hoàng Diệu, phường Bình Hiên, quận Hải Châu, Đà Nẵng.
- Chức vụ: Phó Hiệu trưởng phụ trách chuyên môn.
- Thời gian công tác trong ngành: Từ tháng 10/2010 đến nay (14 năm công tác).
- Diễn biến lương: Bậc 4, hệ số lương 3.66 (Giáo viên Tiểu học hạng II).
- Thành tích thi đua:
  + Năm 2019: Đạt danh hiệu Lao động tiên tiến
  + Năm 2020: Đạt danh hiệu Lao động tiên tiến
  + Năm 2021: Chiến sĩ thi đua cơ sở (Sở GD&ĐT công nhận)
  + Năm 2023: Chiến sĩ thi đua cơ sở, Giấy khen của Công đoàn ngành Giáo dục
- Xếp loại đánh giá viên chức các năm học:
  + Năm học 2021 - 2022: Hoàn thành tốt nhiệm vụ
  + Năm học 2022 - 2023: Hoàn thành xuất sắc nhiệm vụ
  + Năm học 2023 - 2024: Hoàn thành xuất sắc nhiệm vụ

---
2. Cán bộ 2:
- Họ và tên: LÊ HOÀNG NAM
- Ngày sinh: 05/03/1992. Nam.
- Địa chỉ thường trú: Tổ 7, thôn An Hòa, xã Hòa Châu, huyện Hòa Vang, TP. Đà Nẵng.
- Chức vụ: Tổng phụ trách Đội TNTP Hồ Chí Minh, Giáo viên Giáo dục thể chất.
- Thời gian làm việc: Từ ngày 15/01/2015 (9 năm công tác).
- Lương ngạch bậc: Bậc 3, hệ số lương 3.00.
- Thành tích khen thưởng:
  + Năm 2019: Lao động tiên tiến
  + Năm 2020: Lao động tiên tiến, Bằng khen của Hội đồng Đội Trung ương
  + Năm 2022: Chiến sĩ thi đua cơ sở
  + Năm 2023: Giấy khen UBND Quận Hải Châu
- Đánh giá xếp loại thi đua năm học:
  + Năm học 2021 - 2022: Hoàn thành nhiệm vụ
  + Năm học 2022 - 2023: Hoàn thành tốt nhiệm vụ
  + Năm học 2023 - 2024: Hoàn thành xuất sắc nhiệm vụ

---
3. Cán bộ 3:
- Họ và tên: VÕ THỊ KIM OANH
- Sinh ngày: 18/09/1982. Nữ.
- Nơi cư trú: 88 Lê Duẩn, Thạch Thang, Hải Châu, Đà Nẵng.
- Chức danh chức vụ: Giáo viên chủ nhiệm lớp 5/1, Khối trưởng khối 5.
- Thời gian công tác: 01/09/2004 đến nay (20 năm cống hiến).
- Bậc lương hiện tại: Bậc 7, hệ số lương 4.65.
- Thành tích:
  + Năm 2017: Lao động tiên tiến
  + Năm 2019: Chiến sĩ thi đua cấp cơ sở
  + Năm 2021: Lao động tiên tiến
  + Năm 2022: Bằng khen của Bộ trưởng Bộ Giáo dục và Đào tạo
  + Năm 2024: Chiến sĩ thi đua cấp Thành phố
- Đánh giá phân loại viên chức:
  + Năm học 2021 - 2022: Hoàn thành xuất sắc nhiệm vụ
  + Năm học 2022 - 2023: Hoàn thành xuất sắc nhiệm vụ
  + Năm học 2023 - 2024: Hoàn thành xuất sắc nhiệm vụ`
  },
  {
    id: "sample-3",
    title: "Trích biên bản họp xét thi đua khen thưởng & bậc lương",
    description: "Dạng văn bản hành chính biên bản họp tổng kết cuối năm học",
    category: "Biên bản hành chính",
    content: `UBND HUYỆN PHÙ CÁT - PHÒNG NỘI VỤ
HỘI ĐỒNG THI ĐUA KHEN THƯỞNG
Số: 48/BB-HĐTĐKT

TRÍCH BIÊN BẢN HỌP XÉT DANH HIỆU THI ĐUA VÀ XÁC NHẬN NGẠCH BẬC LƯƠNG
Ngày 28 tháng 06 năm 2024

Hội đồng tiến hành rà soát hồ sơ của đồng chí sau:
- Họ và tên viên chức: PHẠM ĐÌNH DUY
- Sinh ngày: 10/06/1979
- Quê quán / Nơi ở hiện nay: Thôn Phú Kim, xã Cát Trinh, huyện Phù Cát, tỉnh Bình Định.
- Chức vụ đảm nhiệm: Hiệu trưởng trường THCS Cát Trinh.
- Quá trình công tác: Vào ngành từ tháng 09/2001 (thời gian làm việc: 23 năm).
- Chế độ tiền lương: Hiện đang xếp lương bậc 8, hệ số 4.98 ngạch Giáo viên THCS hạng I.
- Quá trình thi đua khen thưởng ghi nhận trong hồ sơ:
  * Năm 2018: Lao động tiên tiến cấp trường.
  * Năm 2019: Đạt danh hiệu Chiến sĩ thi đua cơ sở.
  * Năm 2020: Lao động tiên tiến.
  * Năm 2021: Chiến sĩ thi đua cơ sở.
  * Năm 2023: Chiến sĩ thi đua cấp tỉnh và Bằng khen của Thủ tướng Chính phủ.
- Kết quả đánh giá phân loại viên chức trong 3 năm học gần nhất:
  * Năm học 2021-2022: Hoàn thành tốt nhiệm vụ.
  * Năm học 2022-2023: Hoàn thành xuất sắc nhiệm vụ.
  * Năm học 2023-2024: Hoàn thành xuất sắc nhiệm vụ.
Hội đồng nhất trí 100% biểu quyết đề nghị cấp trên khen thưởng theo quy định.`
  },
  {
    id: "sample-4",
    title: "Mẫu 4: Danh sách xét hưởng phụ cấp thâm niên nhà giáo (Mức 10%)",
    description: "Bảng danh sách cán bộ giáo viên đủ điều kiện nâng phụ cấp thâm niên 10%",
    category: "Phụ cấp thâm niên",
    content: `UBND HUYỆN ĐỨC TRỌNG - TRƯỜNG THCS TÂN HỘI
DANH SÁCH CÁN BỘ, GIÁO VIÊN ĐỀ NGHỊ HƯỞNG PHỤ CẤP THÂM NIÊN NHÀ GIÁO (MỨC 10%)
(Kèm theo Tờ trình số 15/TTr-THCS ngày 15/10/2024)

1. Cán bộ 1:
- Họ và tên: LÊ VĂN MINH
- Ngày tháng năm sinh: 12/04/1989. Giới tính: Nam.
- Quê quán / Địa chỉ: Xã Tân Hội, huyện Đức Trọng, tỉnh Lâm Đồng.
- Chức vụ / Nhiệm vụ: Giáo viên Toán - Tin học, Tổ phó chuyên môn.
- Thời gian vào ngành / Thâm niên: Tuyển dụng ngày 01/09/2014. Thời gian tính phụ cấp thâm niên đủ 10 năm (hưởng mức 10%).
- Ngạch lương & Bậc lương: Mã ngạch V.07.04.32, Bậc 4, hệ số lương: 3.33.
- Thành tích khen thưởng:
  + Năm 2020: Đạt danh hiệu Lao động tiên tiến
  + Năm 2022: Đạt danh hiệu Chiến sĩ thi đua cấp cơ sở
  + Năm 2023: Lao động tiên tiến, Giấy khen của Chủ tịch UBND huyện
- Đánh giá phân loại theo năm học:
  + Năm học 2021-2022: Hoàn thành tốt nhiệm vụ
  + Năm học 2022-2023: Hoàn thành xuất sắc nhiệm vụ
  + Năm học 2023-2024: Hoàn thành xuất sắc nhiệm vụ

2. Cán bộ 2:
- Họ và tên: NGUYỄN THỊ THU HÀ
- Ngày sinh: 05/09/1990. Giới tính: Nữ.
- Quê quán / Nơi cư trú: Thị trấn Liên Nghĩa, huyện Đức Trọng, Lâm Đồng.
- Chức vụ: Giáo viên Ngữ văn, Bí thư Chi đoàn.
- Thời gian công tác: Vào ngành từ 01/10/2014 (Thâm niên công tác: 10 năm - Phụ cấp thâm niên 10%).
- Lương hiện hưởng: Bậc 4, hệ số: 3.33.
- Khen thưởng:
  + Năm 2021: Lao động tiên tiến
  + Năm 2022: Lao động tiên tiến
  + Năm 2023: Đạt danh hiệu Giáo viên dạy giỏi cấp huyện, Chiến sĩ thi đua cơ sở
- Đánh giá xếp loại năm học:
  + Năm học 2022-2023: Hoàn thành xuất sắc nhiệm vụ
  + Năm học 2023-2024: Hoàn thành xuất sắc nhiệm vụ`
  },
  {
    id: "sample-5",
    title: "Mẫu 5: Bổ sung hồ sơ nâng lương, tăng thâm niên & thành tích mới",
    description: "Dùng để thử nghiệm việc gộp hồ sơ của cùng một người (tự động cập nhật thâm niên, hệ số và xếp theo năm)",
    category: "Cập nhật hồ sơ",
    content: `UBND TỈNH LÂM ĐỒNG - SỞ GIÁO DỤC VÀ ĐÀO TẠO
QUYẾT ĐỊNH NÂNG BẬC LƯƠNG TRƯỚC THỜI HẠN VÀ KHEN THƯỞNG NĂM 2024

Xét đề nghị của Hội đồng lương và thi đua khen thưởng:
- Họ và tên cán bộ: NGUYỄN VĂN HÙNG
- Ngày sinh: 15/08/1984. Giới tính: Nam.
- Đơn vị công tác: Trường THPT Chuyên Thăng Long, TP. Đà Lạt, tỉnh Lâm Đồng.
- Chức vụ: Phó Hiệu trưởng (bổ nhiệm từ tháng 08/2024).
- Thời gian công tác / Thâm niên: 18 năm cống hiến (thâm niên 18%).
- Bậc lương mới: Bậc 6, Hệ số lương 4.32 (nâng bậc lương trước thời hạn).
- Thành tích thi đua bổ sung:
  + Năm 2021: Lao động tiên tiến
  + Năm 2024: Bằng khen của Bộ trưởng Bộ Giáo dục và Đào tạo, Chiến sĩ thi đua cấp tỉnh.
- Đánh giá xếp loại viên chức:
  + Năm học 2023 - 2024: Hoàn thành xuất sắc nhiệm vụ
  + Năm học 2024 - 2025: Hoàn thành xuất sắc nhiệm vụ`
  }
];
