// Client-side Gemini API Service with server proxy fallback & mock simulator
export const getClientSimulatedResponse = (task: string, payload: any): string => {
  if (task === 'parse-student-text') {
    return `[
      { "id": "HS001", "name": "Nguyễn Minh Triết", "gender": "Nam", "dob": "2012-05-15", "parentName": "Nguyễn Văn Triết", "parentPhone": "0912345678", "email": "hs001@school.edu.vn" },
      { "id": "HS002", "name": "Lê Thị Mai Anh", "gender": "Nữ", "dob": "2012-08-20", "parentName": "Lê Văn Anh", "parentPhone": "0987654321", "email": "hs002@school.edu.vn" },
      { "id": "HS003", "name": "Phan Bảo Lâm", "gender": "Nam", "dob": "2012-02-10", "parentName": "Phan Văn Lâm", "parentPhone": "0905123456", "email": "hs003@school.edu.vn" },
      { "id": "HS004", "name": "Đặng Hồng Nhung", "gender": "Nữ", "dob": "2012-11-05", "parentName": "Đặng Văn Nhung", "parentPhone": "0912000111", "email": "hs004@school.edu.vn" }
    ]`;
  }
  if (task === 'student-report') {
    const name = payload?.student?.name || 'Học sinh';
    const gpa = payload?.gpa || '8.0';
    const rank = payload?.rank || 'Giỏi';
    const conduct = payload?.conduct || 'Tốt';
    return `### 📝 NHẬN XÉT HỌC BẠ ĐỐI VỚI HỌC SINH: ${name.toUpperCase()} (MÔ PHỎNG AI)

#### 1. Điểm sáng & Thành tích nổi bật
Học sinh ${name} có kết quả học tập tốt với GPA tích lũy là ${gpa} (Xếp loại ${rank}). Đạo đức tác phong tốt, xếp loại hạnh kiểm ${conduct}. Em rất tích cực tham gia phát biểu xây dựng bài học.

#### 2. Hạn chế hoặc khía cạnh cải thiện
Thỉnh thoảng em còn mất tập trung nhẹ trong các bài tập nhóm. Cần chú ý đọc kỹ đề bài trước khi làm bài thi.

#### 3. Lời khuyên rèn luyện học kỳ tới
Chúc em tiếp tục phát huy năng lực tư duy toán học và sáng tạo, chủ động giúp đỡ bạn bè cùng tiến bộ!`;
  }
  if (task === 'seating-optimization') {
    return `### 💡 ĐỀ XUẤT TỐI ƯU HÓA SƠ ĐỒ LỚP HỌC (MÔ PHỎNG AI)

1. Ghép cặp bạn cùng tiến:
   - Minh Triết (Giỏi) kèm cặp Bảo Lâm (Yếu) ở hàng 1.
   - Mỹ Linh (Xuất sắc) kèm cặp Văn Hùng (Trung bình) ở hàng 2.
2. Xếp học sinh cần chú ý ngồi gần bảng và bục giảng của giáo viên.`;
  }
  if (task === 'lesson-activities') {
    const title = payload?.title || 'Bài học mới';
    return `### 🎨 ĐỀ XUẤT HOẠT ĐỘNG GIẢNG DẠY SÁNG TẠO: "${title}" (MÔ PHỎNG AI)

#### Hoạt Động 1: "Đấu Trường Quiz Khởi Động" (10 phút)
- Khơi gợi hứng thú, củng cố bài cũ bằng các câu hỏi trắc nghiệm nhanh dùng thẻ màu đáp án.

#### Hoạt Động 2: "Mô Hình Trạm Thảo Luận" (20 phút)
- Học sinh di chuyển xoay tua qua các trạm (Lý thuyết, Bài tập ứng dụng, Sáng tạo thực tế) để hoàn thành phiếu học tập.

#### Hoạt Động 3: "Triển Lãm Sản Phẩm Sư Phạm" (15 phút)
- Các nhóm thuyết trình sản phẩm và chấm chéo điểm rèn luyện thi đua bằng Sticker.`;
  }
  return 'Phản hồi mô phỏng mặc định từ hệ thống QUẢN LÍ LỚP HỌC 9A1-SWIN.';
};

export const generateGeminiContent = async (task: string, payload: any): Promise<string> => {
  const apiKey = localStorage.getItem('gemini_api_key') || '';
  const model = localStorage.getItem('gemini_model') || 'gemini-3-flash-preview';

  let systemInstruction = 'Bạn là AI QUẢN LÍ LỚP HỌC 9A1-SWIN - chuyên gia tư vấn giáo dục số cao cấp. Hãy phản hồi bằng tiếng Việt chân thực, khoa học và tinh tế.';
  let prompt = '';

  if (task === 'seating-optimization') {
    systemInstruction = 'Bạn là chuyên gia sư phạm. Hãy phân tích danh sách học sinh (kèm học lực và hạnh kiểm) và đề xuất sơ đồ bàn ghế học (4 hàng, 4 cột) tối ưu nhất theo quy tắc: xếp học sinh khá/giỏi ngồi cùng học sinh trung bình/yếu để giúp đỡ nhau; xếp học sinh hiếu động, hay nói chuyện hoặc lực học yếu lên hàng đầu gần giáo viên.';
    prompt = `Hãy tối ưu sơ đồ lớp học cho danh sách học sinh sau:\n${JSON.stringify(payload.students, null, 2)}\n\nBảng điểm hiện tại:\n${JSON.stringify(payload.grades, null, 2)}\n\nHãy xuất ra lời khuyên chi tiết gồm 3 phần:\n1. Phân tích nhóm học tập và các cặp bài trùng hỗ trợ nhau.\n2. Gợi ý xếp chỗ ngồi thông minh (vị trí hàng, cột) kèm lý do.\n3. Lời khuyên cho giáo viên để quản lý tương tác trong lớp học này.`;
  } else if (task === 'student-report') {
    systemInstruction = 'Bạn là giáo viên chủ nhiệm tận tâm, sâu sắc. Hãy viết nhận xét học kỳ bằng tiếng Việt thật tinh tế, cá nhân hóa, chỉ rõ điểm mạnh, điểm cần cố gắng và định hướng phát triển rõ ràng. Tuyệt đối tránh văn mẫu sáo rỗng.';
    prompt = `Hãy viết một đoạn nhận xét học thuật và rèn luyện cá nhân hóa (khoảng 150-200 từ) cho học sinh sau:\n- Họ tên: ${payload.student.name}\n- Học lực GPA: ${payload.gpa} (${payload.rank})\n- Hạnh kiểm: ${payload.conduct}\n- Điểm tích lũy hành vi: ${payload.behaviorPoints} điểm\n- Nhật ký khen thưởng/vi phạm gần đây:\n${JSON.stringify(payload.behaviors, null, 2)}\n\nHãy phản hồi theo cấu trúc:\n1. Điểm sáng & Thành tích nổi bật\n2. Hạn chế hoặc khía cạnh cần cải thiện\n3. Lời chúc/Lời khuyên rèn luyện cụ thể cho kỳ tiếp theo.`;
  } else if (task === 'lesson-activities') {
    systemInstruction = 'Bạn là chuyên gia thiết kế bài giảng (Instructional Designer). Hãy gợi ý các hoạt động học tập tương tác sáng tạo, áp dụng các phương pháp hiện đại như trạm, dự án, trò chơi hóa (gamification), thảo luận nhóm.';
    prompt = `Hãy thiết kế hoạt động giảng dạy cho bài học sau:\n- Tiêu đề: ${payload.title}\n- Môn học: ${payload.subject}\n- Mục tiêu: ${payload.objective}\n- Tổng thời lượng: ${payload.duration} phút\n\nHãy đề xuất 3 hoạt động bổ trợ tương tác sáng tạo nhất, bao gồm tên hoạt động, mục đích sư phạm, thời lượng chi tiết và các bước thực hiện cụ thể.`;
  } else if (task === 'parse-student-text') {
    systemInstruction = 'Bạn là trợ lý AI xử lý dữ liệu học đường. Hãy trích xuất danh sách học sinh từ văn bản thô được cung cấp thành một mảng JSON học sinh hợp lệ. Mỗi học sinh có các trường: id (tự sinh dạng HS001, HS002...), name (Họ tên đầy đủ), gender (Giới tính: Nam hoặc Nữ), dob (Ngày sinh dạng YYYY-MM-DD, nếu không có hãy để trống), parentName (Tên phụ huynh, nếu không có hãy để trống), parentPhone (Số điện thoại phụ huynh, nếu không có hãy để trống), email (Email học sinh hoặc tự sinh theo dạng mã học sinh viết thường @school.edu.vn). Hãy trả về duy nhất chuỗi mảng JSON hợp lệ, bắt đầu bằng [ và kết thúc bằng ], không bao gồm các ký tự markdown ```json hay văn bản giải thích nào khác.';
    prompt = `Hãy trích xuất danh sách học sinh từ đoạn văn bản thô sau đây và chuyển đổi thành mảng JSON học sinh:\n\n${payload.text}`;
  } else {
    prompt = payload.prompt || 'Xin chào';
  }

  // If there's no client key, try to fetch from local server first
  if (!apiKey) {
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, payload })
      });
      if (response.ok) {
        const data = await response.json();
        return data.text;
      }
    } catch (e) {
      // static fallback
    }
    // Simulation
    return getClientSimulatedResponse(task, payload);
  }

  // Client-side sequential model fallbacks (prevents CORS & Vercel server timeouts)
  const models = [model, 'gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash'];
  const uniqueModels = Array.from(new Set(models));
  
  let lastError: any = null;
  for (const modelName of uniqueModels) {
    try {
      console.log(`[Client Gemini API] Đang kết nối mô hình: ${modelName}`);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { temperature: 0.7 }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `HTTP Status ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      console.warn(`[Client Gemini API Warning] Mô hình ${modelName} thất bại:`, err.message || err);
      lastError = err;
    }
  }

  throw new Error(lastError?.message || 'Tất cả các mô hình AI đều không phản hồi.');
};
