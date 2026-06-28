import { useState } from 'react';
import { Student, Grade, BehaviorLog, LessonPlan } from '../types';
import { Sparkles, Send, BrainCircuit, UserCheck, BookOpen, AlertCircle, Copy, Check, Flame, FileSpreadsheet } from 'lucide-react';

// Dynamic Loader for pptxgenjs library
const loadPptxGenJS = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).PptxGenJS) {
      resolve((window as any).PptxGenJS);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
    script.onload = () => {
      resolve((window as any).PptxGenJS);
    };
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};

interface AIWorkspaceProps {
  students: Student[];
  grades: Grade[];
  behaviors: BehaviorLog[];
  lessonPlans: LessonPlan[];
}

export default function AIWorkspace({ students, grades, behaviors, lessonPlans }: AIWorkspaceProps) {
  const [activeSubTab, setActiveSubTab] = useState<'student-report' | 'lesson-activities' | 'general-advisor'>('student-report');
  
  // States for Student Report Generator
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reportResult, setReportResult] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);

  // States for Lesson Activities Idea Generator
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [activitiesResult, setActivitiesResult] = useState('');
  const [loadingActivities, setLoadingActivities] = useState(false);

  const handleExportPPTXFromAI = async () => {
    if (!activitiesResult) return;
    try {
      const PptxGenJSClass = await loadPptxGenJS();
      if (!PptxGenJSClass) {
        alert('Không thể tải thư viện PowerPoint Exporter. Vui lòng kiểm tra lại kết nối mạng.');
        return;
      }

      const pptx = new PptxGenJSClass();
      pptx.layout = 'LAYOUT_16x9';

      // Parse sections
      const sections: { title: string; content: string[] }[] = [];
      const lines = activitiesResult.split('\n');
      let currentSection: { title: string; content: string[] } | null = null;
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || trimmed.startsWith('####') || trimmed.toLowerCase().startsWith('hoạt động')) {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            title: trimmed.replace(/^#+\s*/, ''),
            content: []
          };
        } else if (trimmed !== '') {
          if (currentSection) {
            // Skip headers or raw markers
            if (!trimmed.startsWith('---') && currentSection.content.length < 5) {
              currentSection.content.push(trimmed.replace(/^[*•-]\s*/, ''));
            }
          }
        }
      });
      if (currentSection) {
        sections.push(currentSection);
      }

      // Title Slide
      const slide1 = pptx.addSlide();
      slide1.background = { fill: '0f172a' }; // slate-900
      slide1.addText('KỊCH BẢN HOẠT ĐỘNG GIẢNG DẠY', {
        x: 0.5, y: 1.0, w: '90%', h: 0.5,
        fontSize: 18, bold: true, color: '6366f1', fontFace: 'Arial'
      });
      
      const lessonTitle = selectedLessonId 
        ? lessonPlans.find(lp => lp.id === selectedLessonId)?.title || 'Bài Học Thiết Kế AI'
        : 'Hoạt Động Sư Phạm Mới';
      
      slide1.addText(lessonTitle, {
        x: 0.5, y: 1.5, w: '90%', h: 1.2,
        fontSize: 28, bold: true, color: 'ffffff', fontFace: 'Arial'
      });
      slide1.addText('Đề xuất bởi Trợ lý AI  |  Lớp: 9A1-SWIN', {
        x: 0.5, y: 2.8, w: '90%', h: 0.4,
        fontSize: 14, color: '94a3b8', fontFace: 'Arial'
      });

      // Section slides
      if (sections.length > 0) {
        sections.forEach(sec => {
          const slide = pptx.addSlide();
          slide.background = { fill: 'f8fafc' }; // slate-50

          slide.addText(sec.title.toUpperCase(), {
            x: 0.5, y: 0.4, w: '90%', h: 0.5,
            fontSize: 20, bold: true, color: '4f46e5', fontFace: 'Arial'
          });

          // Text content
          const textBlock = sec.content.join('\n\n');
          slide.addText(textBlock || 'Chi tiết hoạt động giáo án.', {
            x: 0.5, y: 1.1, w: '90%', h: 2.6,
            fontSize: 13, color: '334155', fontFace: 'Arial', lineSpacing: 18
          });
        });
      } else {
        // Fallback single slide
        const slide = pptx.addSlide();
        slide.background = { fill: 'ffffff' };
        slide.addText('NỘI DUNG HOẠT ĐỘNG', { x: 0.5, y: 0.4, w: '90%', h: 0.5, fontSize: 18, bold: true, color: '4f46e5' });
        slide.addText(activitiesResult.substring(0, 800), { x: 0.5, y: 1.0, w: '90%', h: 2.8, fontSize: 12, color: '334155' });
      }

      pptx.writeFile({ fileName: `Giao_An_AI_9A1_${lessonTitle.replace(/\s+/g, '_')}.pptx` });

    } catch (err: any) {
      console.error(err);
      alert('Lỗi tạo Slide: ' + err.message);
    }
  };

  // States for General Pedagogical Advisor Chatbot
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: 'Chào Thầy/Cô! Tôi là Trợ lý Sư phạm AI 9A1-SWIN. Hôm nay tôi có thể tư vấn gì giúp Thầy/Cô trong công tác quản lý và giảng dạy lớp học của mình?' }
  ]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Utility copy state
  const [copiedText, setCopiedText] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Helper to calculate student GPA and Rank
  const getStudentMetrics = (studentId: string) => {
    const s = students.find(std => std.id === studentId);
    if (!s) return null;

    const g = grades.find(g => g.studentId === studentId);
    let gpa = 0;
    if (g) {
      const oralAvg = g.oral.length > 0 ? g.oral.reduce((a,b)=>a+b,0)/g.oral.length : 7;
      const quizAvg = g.quiz15m.length > 0 ? g.quiz15m.reduce((a,b)=>a+b,0)/g.quiz15m.length : 7;
      const midtermAvg = g.midterm.length > 0 ? g.midterm.reduce((a,b)=>a+b,0)/g.midterm.length : 7;
      const finalAvg = g.final.length > 0 ? g.final.reduce((a,b)=>a+b,0)/g.final.length : 7;
      gpa = Number(((oralAvg + quizAvg + midtermAvg * 2 + finalAvg * 3) / 7).toFixed(2));
    }

    const getRank = (score: number) => {
      if (score >= 9.0) return 'Xuất sắc';
      if (score >= 8.0) return 'Giỏi';
      if (score >= 6.5) return 'Khá';
      if (score >= 5.0) return 'Trung bình';
      return 'Yếu / Kém';
    };

    const studentBehaviors = behaviors.filter(b => b.studentId === studentId);
    const behaviorPoints = studentBehaviors.reduce((sum, b) => sum + b.points, 0);
    
    let conduct = 'Trung bình';
    if (behaviorPoints >= 30) conduct = 'Tốt';
    else if (behaviorPoints >= 10) conduct = 'Khá';
    else if (behaviorPoints >= -5) conduct = 'Trung bình';
    else conduct = 'Yếu';

    return {
      student: s,
      gpa,
      rank: getRank(gpa),
      behaviorPoints,
      conduct,
      behaviors: studentBehaviors.slice(0, 5) // latest 5 behaviors
    };
  };

  // Trigger Student Report Generator API
  const generateStudentReport = async () => {
    if (!selectedStudentId) {
      alert('Vui lòng chọn học sinh trước.');
      return;
    }
    setLoadingReport(true);
    setReportResult('');

    const metrics = getStudentMetrics(selectedStudentId);
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const savedModel = localStorage.getItem('gemini_model') || 'gemini-3-flash-preview';

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'student-report',
          payload: metrics,
          apiKey: savedKey,
          model: savedModel
        })
      });

      const data = await response.json();
      if (response.ok) {
        setReportResult(data.text);
      } else {
        setReportResult(`[API ERROR] ${data.error || 'Lỗi xử lý API Gemini.'}`);
      }
    } catch (err: any) {
      console.error(err);
      setReportResult(`[API ERROR] Lỗi kết nối API máy chủ: ${err.message || err}`);
    } finally {
      setLoadingReport(false);
    }
  };

  // Trigger Lesson Plan Activities Ideas API
  const generateLessonIdeas = async () => {
    let title = 'Bài học tự do';
    let subject = 'Kỹ năng mềm';
    let objective = customObjective;
    let duration = 45;

    if (selectedLessonId) {
      const selectedPlan = lessonPlans.find(lp => lp.id === selectedLessonId);
      if (selectedPlan) {
        title = selectedPlan.title;
        subject = selectedPlan.subject;
        objective = selectedPlan.objective;
        duration = selectedPlan.duration;
      }
    } else if (!customObjective.trim()) {
      alert('Vui lòng chọn giáo án hiện tại hoặc nhập mục tiêu bài giảng thủ công.');
      return;
    }

    setLoadingActivities(true);
    setActivitiesResult('');

    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const savedModel = localStorage.getItem('gemini_model') || 'gemini-3-flash-preview';

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'lesson-activities',
          payload: { title, subject, objective, duration },
          apiKey: savedKey,
          model: savedModel
        })
      });

      const data = await response.json();
      if (response.ok) {
        setActivitiesResult(data.text);
      } else {
        setActivitiesResult(`[API ERROR] ${data.error || 'Lỗi xử lý API Gemini.'}`);
      }
    } catch (err: any) {
      console.error(err);
      setActivitiesResult(`[API ERROR] Lỗi kết nối máy chủ: ${err.message || err}`);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Send message to Pedagogical Advisor chat
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setLoadingChat(true);

    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const savedModel = localStorage.getItem('gemini_model') || 'gemini-3-flash-preview';

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'general-chat',
          payload: { prompt: userMsg },
          apiKey: savedKey,
          model: savedModel
        })
      });

      const data = await response.json();
      if (response.ok) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.text }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'ai', text: `[API ERROR] ${data.error || 'Không thể lấy câu trả lời tư vấn.'}` }]);
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'ai', text: `[API ERROR] Lỗi kết nối: ${err.message || err}` }]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div id="ai-workspace-tab" className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white p-6 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-violet-600 rounded-full opacity-10 blur-3xl"></div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-3 bg-violet-500/10 text-violet-300 rounded-lg border border-violet-500/20">
            <BrainCircuit className="w-6 h-6 animate-pulse text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-sans text-white flex items-center gap-2 tracking-tight">
              Trợ Lý Sư Phạm Giáo Dục Số Gemini AI
            </h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              Tối ưu hóa các nhiệm vụ sư phạm, soạn bài giảng sáng tạo và nhận xét học bạ tinh tế từng em học sinh
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('student-report')}
          className={`px-5 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 uppercase tracking-wider cursor-pointer ${
            activeSubTab === 'student-report'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          HỌC BẠ THÔNG MINH
        </button>

        <button
          onClick={() => setActiveSubTab('lesson-activities')}
          className={`px-5 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 uppercase tracking-wider cursor-pointer ${
            activeSubTab === 'lesson-activities'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          HOẠT ĐỘNG BÀI GIẢNG
        </button>

        <button
          onClick={() => setActiveSubTab('general-advisor')}
          className={`px-5 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 uppercase tracking-wider cursor-pointer ${
            activeSubTab === 'general-advisor'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          TƯ VẤN SƯ PHẠM
        </button>
      </div>

      {/* Sub-tab Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side (Settings / Input Form) */}
        <div className="lg:col-span-1">
          {activeSubTab === 'student-report' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 font-sans tracking-tight">Thiết lập Nhận xét Học bạ</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                AI sẽ tổng hợp ĐTB học kỳ, xếp loại học lực, hạnh kiểm thi đua và hành vi nổi bật để tạo lập nội dung nhận xét riêng biệt, không văn mẫu.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Chọn học sinh cần nhận xét *
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  >
                    <option value="">-- Chọn học sinh từ danh sách --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.studentId})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStudentId && (() => {
                  const m = getStudentMetrics(selectedStudentId);
                  if (!m) return null;
                  return (
                    <div className="p-3 bg-indigo-50/50 rounded-lg space-y-1.5 text-xs text-indigo-950 border border-indigo-100 font-mono font-bold uppercase tracking-wide">
                      <p><span className="text-indigo-800">ĐTB (GPA):</span> {m.gpa} ({m.rank})</p>
                      <p><span className="text-indigo-800">HẠNH KIỂM:</span> {m.conduct}</p>
                      <p><span className="text-indigo-800">ĐIỂM THI ĐUA:</span> {m.behaviorPoints}đ</p>
                    </div>
                  );
                })()}

                <button
                  onClick={generateStudentReport}
                  disabled={loadingReport || !selectedStudentId}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  {loadingReport ? 'Gemini đang phân tích...' : 'Tạo lời Nhận xét học bạ'}
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'lesson-activities' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 font-sans tracking-tight">Thiết lập Thiết kế Hoạt động</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Phân tích mục tiêu bài học của Thầy/Cô để đề xuất 3 trò chơi sư phạm hay hoạt động trải nghiệm nhóm sáng tạo nhất.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Chọn giáo án hiện có
                  </label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => {
                      setSelectedLessonId(e.target.value);
                      if (e.target.value) setCustomObjective('');
                    }}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  >
                    <option value="">-- Chọn bài giảng đã soạn (Hoặc nhập thủ công) --</option>
                    {lessonPlans.map(lp => (
                      <option key={lp.id} value={lp.id}>
                        {lp.title} ({lp.subject})
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedLessonId && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Nhập thủ công mục tiêu sư phạm bài giảng
                    </label>
                    <textarea
                      value={customObjective}
                      onChange={(e) => setCustomObjective(e.target.value)}
                      placeholder="e.g., Học sinh ghi nhớ và áp dụng đúng cấu trúc đại từ phân xưng hoặc bảng nhân chia 2..."
                      rows={3}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-semibold"
                    />
                  </div>
                )}

                <button
                  onClick={generateLessonIdeas}
                  disabled={loadingActivities}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <BrainCircuit className="w-4 h-4 text-amber-300 animate-pulse" />
                  {loadingActivities ? 'Gemini đang thiết kế...' : 'Sáng tạo hoạt động tương tác'}
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'general-advisor' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 font-sans tracking-tight">Gợi ý câu hỏi sư phạm nhanh</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Nhấn chọn nhanh các chủ đề giáo viên thường quan tâm để nhờ Gemini trợ giúp:</p>

              <div className="space-y-2 text-xs font-semibold">
                <button
                  onClick={() => setChatInput('Làm thế nào để thu hút học sinh tập trung sau giờ ra chơi?')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-55/40 rounded-lg text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-300 transition-all truncate cursor-pointer font-bold"
                >
                  ⚡ Cách thu hút học sinh tập trung sau ra chơi?
                </button>
                <button
                  onClick={() => setChatInput('Gợi ý cách thảo luận hiệu quả đối với các học sinh rụt rè, ít nói?')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-55/40 rounded-lg text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-300 transition-all truncate cursor-pointer font-bold"
                >
                  ⚡ Khích lệ học sinh rụt rè phát biểu nhóm?
                </button>
                <button
                  onClick={() => setChatInput('Lập kế hoạch họp phụ huynh đầu năm học sao cho ấn tượng và ấm áp?')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-55/40 rounded-lg text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-300 transition-all truncate cursor-pointer font-bold"
                >
                  ⚡ Lập kế hoạch họp phụ huynh ấm áp, ấn tượng?
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side 2 Cols: AI Response Stream panel */}
        <div className="lg:col-span-2 space-y-6">
          {activeSubTab !== 'general-advisor' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col h-full min-h-[440px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono">
                  <BrainCircuit className="w-5 h-5 text-indigo-600" />
                  KẾT QUẢ PHÂN TÍCH SƯ PHẠM AI
                </h3>
                {((activeSubTab === 'student-report' && reportResult) || (activeSubTab === 'lesson-activities' && activitiesResult)) && (
                  <div className="flex gap-2">
                    {activeSubTab === 'lesson-activities' && activitiesResult && (
                      <button
                        onClick={handleExportPPTXFromAI}
                        className="text-[10px] text-indigo-700 hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        XUẤT POWERPOINT (.PPTX)
                      </button>
                    )}
                    <button
                      onClick={() => handleCopy(activeSubTab === 'student-report' ? reportResult : activitiesResult)}
                      className="text-[10px] text-indigo-700 hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedText ? 'ĐÃ SAO CHÉP!' : 'SAO CHÉP KẾT QUẢ'}
                    </button>
                  </div>
                )}
              </div>

              {/* Response output */}
              <div className="flex-1 overflow-y-auto max-h-[380px] p-4 bg-slate-50 rounded-lg leading-relaxed text-xs text-slate-700 border border-slate-200 font-sans whitespace-pre-wrap shadow-inner scrollbar-thin">
                {activeSubTab === 'student-report' && (
                  loadingReport ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <p className="animate-pulse font-medium">Gemini đang phân tích học bạ rèn luyện để viết lời phê tinh tế...</p>
                    </div>
                  ) : reportResult ? (
                    reportResult.startsWith('[API ERROR]') ? (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-rose-500" />
                          <span>ĐÃ DỪNG DO LỖI</span>
                        </div>
                        <p className="text-[11px] font-mono whitespace-pre-wrap">{reportResult.replace('[API ERROR] ', '')}</p>
                      </div>
                    ) : (
                      reportResult
                    )
                  ) : (
                    <div className="text-center py-24 text-slate-400">
                      <BrainCircuit className="w-8 h-8 mx-auto mb-2 opacity-50 text-indigo-500 animate-pulse" />
                      <p className="font-bold font-sans">Lựa chọn học sinh ở cột bên trái và bấm nút "Tạo lời Nhận xét" để khởi chạy.</p>
                    </div>
                  )
                )}

                {activeSubTab === 'lesson-activities' && (
                  loadingActivities ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <p className="animate-pulse font-medium">Gemini đang phân bổ thời gian và xây dựng kịch bản trò chơi hoạt động...</p>
                    </div>
                  ) : activitiesResult ? (
                    activitiesResult.startsWith('[API ERROR]') ? (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-rose-500" />
                          <span>ĐÃ DỪNG DO LỖI</span>
                        </div>
                        <p className="text-[11px] font-mono whitespace-pre-wrap">{activitiesResult.replace('[API ERROR] ', '')}</p>
                      </div>
                    ) : (
                      activitiesResult
                    )
                  ) : (
                    <div className="text-center py-24 text-slate-400">
                      <BrainCircuit className="w-8 h-8 mx-auto mb-2 opacity-50 text-indigo-500 animate-pulse" />
                      <p className="font-bold font-sans">Lựa chọn giáo án hoặc điền mục tiêu ở thanh bên trái để Gemini phác thảo kịch bản.</p>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            // General pedagogical advisor chatbot
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[520px] justify-between">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono">
                <BrainCircuit className="w-5 h-5 text-indigo-600" />
                TƯ VẤN SƯ PHẠM & QUẢN LÝ LỚP HỌC
              </h3>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto space-y-4 my-4 p-3 bg-slate-50/50 border border-slate-200 rounded-lg max-h-[360px] scrollbar-thin">
                {chatMessages.map((msg, idx) => {
                  const isError = msg.text.startsWith('[API ERROR]');
                  const displayText = isError ? msg.text.replace('[API ERROR] ', '') : msg.text;
                  return (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 max-w-[85%] rounded-lg text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 text-white rounded-tr-none border border-slate-950 font-medium shadow-sm'
                          : isError
                            ? 'bg-rose-50 text-rose-700 rounded-tl-none border border-rose-200 shadow-sm font-semibold'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
                      }`}>
                        {isError && (
                          <div className="flex items-center gap-1.5 text-rose-800 font-bold mb-1 uppercase tracking-wider text-[10px]">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                            Đã dừng do lỗi
                          </div>
                        )}
                        <p className={`${isError ? 'font-mono' : 'font-medium'} whitespace-pre-wrap`}>{displayText}</p>
                      </div>
                    </div>
                  );
                })}

                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-white p-3 rounded-lg rounded-tl-none border border-slate-200 text-xs text-indigo-600 animate-pulse font-bold font-mono">
                      GEMINI ĐANG PHÂN TÍCH VÀ SOẠN CÂU TRẢ LỜI TƯ VẤN...
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Nhập câu hỏi sư phạm (e.g., Làm sao để phân nhóm học sinh đồng đều?)..."
                  className="flex-1 text-xs p-3 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white font-medium"
                />
                <button
                  onClick={sendChatMessage}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-lg transition-all cursor-pointer border border-slate-950 flex items-center justify-center shadow-xs"
                  title="Gửi"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
