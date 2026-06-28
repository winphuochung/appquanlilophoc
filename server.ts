import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      console.warn('WARNING: GEMINI_API_KEY is not configured or is using default placeholder.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Routes
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { task, payload, apiKey, model } = req.body;
    
    // Choose API key
    const userKey = apiKey || process.env.GEMINI_API_KEY;
    const isKeyConfigured = userKey && userKey !== 'MY_GEMINI_API_KEY';

    if (!isKeyConfigured) {
      // Return high-quality, simulated pedagogical response to maintain full interactivity
      console.log(`[API] Simulating response for task: ${task} (No API key found)`);
      const fallbackResponse = getSimulatedResponse(task, payload);
      return res.json({ text: fallbackResponse, simulated: true });
    }

    // Set starting model and fallback chain
    const selectedModel = model || 'gemini-3-flash-preview';
    const fallbackChain = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash'];
    
    // Build list of models to try in order
    const modelsToTry = [selectedModel];
    fallbackChain.forEach(m => {
      if (!modelsToTry.includes(m)) {
        modelsToTry.push(m);
      }
    });

    let prompt = '';
    let systemInstruction = 'Bạn là AI QUẢN LÍ LỚP HỌC 9A1-SWIN - chuyên gia tư vấn giáo dục số cao cấp. Hãy phản hồi bằng tiếng Việt chân thực, khoa học và tinh tế.';

    if (task === 'seating-optimization') {
      systemInstruction = 'Bạn là chuyên gia sư phạm. Hãy phân tích danh sách học sinh (kèm học lực và hạnh kiểm) và đề xuất sơ đồ bàn ghế học (4 hàng, 4 cột) tối ưu nhất theo quy tắc: xếp học sinh khá/giỏi ngồi cùng học sinh trung bình/yếu để giúp đỡ nhau; xếp học sinh hiếu động, hay nói chuyện hoặc lực học yếu lên hàng đầu gần giáo viên.';
      prompt = `Hãy tối ưu sơ đồ lớp học cho danh sách học sinh sau:\n${JSON.stringify(payload.students, null, 2)}\n\nBảng điểm hiện tại:\n${JSON.stringify(payload.grades, null, 2)}\n\nHãy xuất ra lời khuyên chi tiết gồm 3 phần:\n1. Phân tích nhóm học tập và các cặp bài trùng hỗ trợ nhau.\n2. Gợi ý xếp chỗ ngồi thông minh (vị trí hàng, cột) kèm lý do.\n3. Lời khuyên cho giáo viên để quản lý tương tác trong lớp học này.`;
    } else if (task === 'student-report') {
      systemInstruction = 'Bạn là giáo viên chủ nhiệm tận tâm, sâu sắc. Hãy viết nhận xét học kỳ bằng tiếng Việt thật tinh tế, cá nhân hóa, chỉ rõ điểm mạnh, điểm cần cố gắng và định hướng phát triển rõ ràng. Tuyệt đối tránh văn mẫu sáo rỗng.';
      prompt = `Hãy viết một đoạn nhận xét học thuật và rèn luyện cá nhân hóa (khoảng 150-200 từ) cho học sinh sau:\n- Họ tên: ${payload.student.name}\n- Học lực GPA: ${payload.gpa} (${payload.rank})\n- Hạnh kiểm: ${payload.conduct}\n- Điểm tích lũy hành vi: ${payload.behaviorPoints} điểm\n- Nhật ký khen thưởng/vi phạm gần đây:\n${JSON.stringify(payload.behaviors, null, 2)}\n\nHãy phản hồi theo cấu trúc:\n1. Điểm sáng & Thành tích nổi bật\n2. Hạn chế hoặc khía cạnh cần cải thiện\n3. Lời chúc/Lời khuyên rèn luyện cụ thể cho kỳ tiếp theo.`;
    } else if (task === 'lesson-activities') {
      systemInstruction = 'Bạn là chuyên gia thiết kế bài giảng (Instructional Designer). Hãy gợi ý các hoạt động học tập tương tác sáng tạo, áp dụng các phương pháp hiện đại như trạm, dự án, trò chơi hóa (gamification), thảo luận nhóm.';
      prompt = `Hãy thiết kế hoạt động giảng dạy cho bài học sau:\n- Tiêu đề: ${payload.title}\n- Môn học: ${payload.subject}\n- Mục tiêu: ${payload.objective}\n- Tổng thời lượng: ${payload.duration} phút\n\nHãy đề xuất 3 hoạt động bổ trợ tương tác sáng tạo nhất, bao gồm tên hoạt động, mục đích sư phạm, thời lượng chi tiết và các bước thực hiện cụ thể.`;
    } else {
      prompt = payload.prompt || 'Xin chào';
    }

    let successText = '';
    let lastError: any = null;
    let successfulModel = '';

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Gemini API] Đang thử model: ${modelName} cho task: ${task}`);
        const ai = new GoogleGenAI({
          apiKey: userKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        if (response.text) {
          successText = response.text;
          successfulModel = modelName;
          break; // success, exit retry loop
        }
      } catch (err: any) {
        console.warn(`[Gemini API Warning] Model ${modelName} thất bại:`, err.message || err);
        lastError = err;
      }
    }

    if (successText) {
      console.log(`[Gemini API Success] Hoàn thành bằng model: ${successfulModel}`);
      return res.json({ text: successText, model: successfulModel });
    }

    // All models failed - return error text
    const errorMsg = lastError?.message || lastError?.statusText || 'Lỗi không xác định khi gọi API.';
    const statusText = lastError?.status || lastError?.statusText || '429 RESOURCE_EXHAUSTED';
    console.error('[Gemini API Error] Tất cả mô hình đều lỗi. Chi tiết lỗi cuối cùng:', errorMsg);
    
    res.status(500).json({
      error: `Tất cả các mô hình AI (${modelsToTry.join(', ')}) đều thất bại. Chi tiết lỗi từ API: ${statusText} - ${errorMsg}`,
      statusText
    });

  } catch (error: any) {
    console.error('Lỗi phân tích Gemini:', error);
    res.status(500).json({ error: error.message || 'Lỗi xử lý yêu cầu AI.' });
  }
});


// Google Sheets Proxy Route
app.post('/api/google-sheets/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Đường dẫn Google Sheets không được để trống.' });
    }

    let fetchUrl = url;
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      const sheetId = match[1];
      const gidMatch = url.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }

    console.log(`[Proxy Google Sheets] Đang tải dữ liệu từ: ${fetchUrl}`);
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Google Sheets trả về mã lỗi HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    res.json({ csv: csvText });
  } catch (error: any) {
    console.error('Proxy Google Sheets Error:', error);
    res.status(500).json({ error: error.message || 'Không thể tải dữ liệu từ Google Sheets. Vui lòng kiểm tra lại quyền chia sẻ liên kết.' });
  }
});

// Mock simulation engine for offline usage
function getSimulatedResponse(task: string, payload: any): string {
  if (task === 'seating-optimization') {
    return `### 💡 ĐỀ XUẤT TỐI ƯU HÓA SƠ ĐỒ LỚP HỌC (MÔ PHỎNG AI)

Do chưa cấu hình khóa API Gemini thực tế, hệ thống đã chạy thuật toán Sư phạm Nội bộ để đề xuất sắp xếp chỗ ngồi tối ưu cho lớp học:

#### 1. Phân Tích Nhóm Học Tập & Cặp Bạn Cùng Tiến
*   **Cặp đôi 1: Nguyễn Minh Triết (Giỏi - HS001) & Phan Bảo Lâm (Yếu - HS009)**
    *   *Lý do sư phạm:* Bạn Lâm đang có học lực yếu và cần được kèm cặp sát sao. Việc xếp Minh Triết (GPA 9.1, có huy hiệu "Đồng đội" vì đã hướng dẫn Lâm trước đó) ngồi kế bên ở Hàng 1 sẽ tạo điều kiện cho Triết hỗ trợ Lâm nhanh chóng trong các bài tập nhóm Toán và Khoa học.
*   **Cặp đôi 2: Ngô Mỹ Linh (Xuất sắc - HS006) & Đỗ Văn Hùng (Trung bình - HS005)**
    *   *Lý do sư phạm:* Hùng có thế mạnh về thể chất nhưng học tập chưa tập trung, thường xuyên thiếu bài tập (bị điểm trừ). Xếp Hùng ngồi cạnh Mỹ Linh (GPA 9.8, cực kỳ gương mẫu và nghiêm túc) ở Hàng 2 giúp Hùng giữ kỷ luật học tập tốt hơn.
*   **Cặp đôi 3: Lê Thị Mai Anh (Khá - HS002) & Đặng Hồng Nhung (Khá - HS010)**
    *   *Lý do sư phạm:* Cặp bài trùng học lực khá đồng đều, tương tác bổ trợ tốt cho các hoạt động sáng tạo và thảo luận nhóm môn Tiếng Anh và Mỹ thuật.

#### 2. Định Vị Phân Phối Chỗ Ngồi (4 Hàng x 5 Cột)
*   **Hàng 1 (Gần giáo viên nhất):** Xếp các bạn cần chú ý cao hoặc cần kèm cặp đặc biệt.
    *   *Ghế [0,0]:* Phan Bảo Lâm (GPA 4.5, Cần hỗ trợ)
    *   *Ghế [0,1]:* Nguyễn Minh Triết (GPA 9.1, Kèm cặp Lâm)
    *   *Ghế [0,3]:* Lê Thị Mai Anh (GPA 8.5)
    *   *Ghế [0,4]:* Đặng Hồng Nhung (GPA 8.4)
*   **Hàng 2 (Tập trung & Kỷ luật):**
    *   *Ghế [1,0]:* Đỗ Văn Hùng (GPA 5.3, Hay quên bài tập, xếp gần Linh để học hỏi)
    *   *Ghế [1,1]:* Ngô Mỹ Linh (GPA 9.8, Gương mẫu)
    *   *Ghế [1,3]:* Phạm Thanh Thảo (GPA 7.7)
    *   *Ghế [1,4]:* Vũ Minh Quân (GPA 7.9)
*   **Hàng 3 (Hạn chế nói chuyện riêng):** Xếp xa nhau các bạn hiếu động.
    *   *Ghế [2,0]:* Trần Hoàng Nam (GPA 6.8, Hay nói chuyện, xếp ở rìa trái)
    *   *Ghế [2,1]:* Trịnh Gia Huy (GPA 8.0, Nói chuyện nhiều, xếp cạnh Nam nhưng tăng cường giám sát)
    *   *Ghế [2,3]:* Hoàng Thu Trang (GPA 8.0)
    *   *Ghế [2,4]:* Bùi Quốc Anh (GPA 7.0, Thỉnh thoảng đi trễ)

#### 3. Khuyến Nghị Sư Phạm Cho Giáo Viên
1.  **Chiến lược 5 phút đầu giờ:** Thường xuyên giao nhiệm vụ kiểm tra chéo bài tập về nhà giữa các cặp đôi (đặc biệt là Mỹ Linh kiểm tra Đỗ Văn Hùng).
2.  **Chia nhóm thảo luận lớn:** Khi làm việc nhóm 4 người, kết hợp Hàng 1 và Hàng 2 thành các nhóm hỗn hợp (Triết, Lâm, Hùng, Linh) để phát huy tinh thần đồng đội.
3.  **Khích lệ tích cực:** Tặng điểm tích lũy hành vi cho cả cặp nếu bạn yếu có tiến bộ (ví dụ: thưởng cả Triết và Lâm nếu Lâm đạt điểm khá).`;
  } else if (task === 'student-report') {
    const s = payload.student;
    return `### 📝 NHẬN XÉT HỌC BẠ ĐỐI VỚI HỌC SINH: ${s.name.toUpperCase()} (MÔ PHỎNG AI)

#### 1. Điểm Sáng & Thành Tích Nổi Bật
Em ${s.name} đã hoàn thành học kỳ với kết quả học tập **${payload.rank}** rất đáng ghi nhận, đạt điểm trung bình tích lũy GPA là **${payload.gpa}/10**. Về khía cạnh rèn luyện đạo đức và hạnh kiểm, em xếp loại **${payload.conduct}**. 
Em thể hiện tinh thần xây dựng bài rất tích cực trong các tiết học chính khóa, biết cách kết nối và hỗ trợ bạn bè cùng tiến bộ (tiêu biểu như hoạt động giúp đỡ nhóm hoàn thành bài tập môn học). Tích lũy được **${payload.behaviorPoints}** điểm hành vi thi đua khẳng định sự đóng góp nghiêm túc của em đối với tập thể lớp.

#### 2. Khía Cạnh Cần Rèn Luyện & Cải Thiện
Bên cạnh những ưu điểm, em cần chú ý phân bổ thời gian biểu hợp lý hơn để tránh việc chuẩn bị bài còn vội vã. Một số thời điểm cần tập trung lắng nghe hướng dẫn hơn nữa để tránh những sai sót không đáng có trong các bài kiểm tra định kỳ 15 phút.

#### 3. Định Hướng & Lời Khuyên Phát Triển Học Kỳ Tiếp Theo
Thầy/Cô tin tưởng rằng với nền tảng tư duy tốt và sự chăm chỉ sẵn có, ${s.name} hoàn toàn có thể chinh phục được những nấc thang học thuật cao hơn. Mục tiêu sắp tới là duy trì sự tập trung tối đa trong các bài giảng lý thuyết mới, chủ động xung phong nhận các thử thách khó hơn trong học tập. Chúc em tiếp tục gặt hái thêm nhiều huy hiệu thi đua xuất sắc!`;
  } else if (task === 'lesson-activities') {
    return `### 🎨 ĐỀ XUẤT HOẠT ĐỘNG GIẢNG DẠY SÁNG TẠO: "${payload.title}" (MÔ PHỎNG AI)

Nhằm tối ưu hóa mục tiêu bài giảng giúp học sinh ghi nhớ sâu và tương tác tích cực, hệ thống gợi ý thiết kế 3 hoạt động bổ trợ dưới đây:

#### Hoạt Động 1: "Đấu Trường Quiz Trực Quan" (Thời lượng: 10 phút)
*   **Mục đích sư phạm:** Kích hoạt năng lượng đầu giờ, ôn tập nhanh kiến thức cũ hoặc giới thiệu khái niệm mới bằng hình ảnh.
*   **Cách thực hiện:**
    1.  Giáo viên trình chiếu một số câu hỏi trắc nghiệm trực quan (có liên kết thực tế).
    2.  Học sinh sử dụng bảng phụ hoặc thẻ đáp án màu sắc để phản hồi đồng loạt.
    3.  Tuyên dương các nhóm có tốc độ và độ chính xác cao nhất để khích lệ.

#### Hoạt Động 2: "Trạm Khám Phá Kiến Thức Hỗn Hợp" (Thời lượng: 20 phút)
*   **Mục đích sư phạm:** Học sinh tự chủ chiếm lĩnh kiến thức, rèn luyện kỹ năng làm việc nhóm và giải quyết vấn đề.
*   **Cách thực hiện:**
    1.  Chia lớp thành 3 nhóm lớn ứng với 3 góc học tập (Trạm Thuyết Trình, Trạm Thực Hành Thao Tác, Trạm Vận Dụng Đố Vui).
    2.  Cứ sau 6 phút, các nhóm di chuyển vòng tròn xoay tua qua các trạm để hoàn thành phiếu học tập cá nhân.
    3.  Giáo viên đóng vai trò là trọng tài và hỗ trợ các nhóm gặp khó khăn tại các trạm.

#### Hoạt Động 3: "Sản Phẩm Tích Hợp Đời Sống" (Thời lượng: 15 phút)
*   **Mục đích sư phạm:** Chuyển hóa lý thuyết thành giải pháp thực tiễn, phát triển tư duy phản biện.
*   **Cách thực hiện:**
    1.  Mỗi nhóm học sinh thiết kế một sơ đồ ứng dụng hoặc giải pháp cụ thể (Ví dụ: Vẽ tranh phân chia khẩu phần ăn gia đình ứng dụng phân số; viết một bức thư ngắn có các đại từ nhân xưng chuẩn xác).
    2.  Đại diện nhóm treo sản phẩm lên bảng phụ để triển lãm phòng tranh (Gallery Walk).
    3.  Cả lớp bình chọn chéo sản phẩm yêu thích nhất bằng sticker điểm cộng hành vi.`;
  }
  return 'Phản hồi mô phỏng mặc định từ hệ thống QUẢN LÍ LỚP HỌC 9A1-SWIN.';
}

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
