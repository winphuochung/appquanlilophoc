import { useState, useEffect } from 'react';
import { Student, Grade, GradeWeights, BehaviorLog, Seat, LessonPlan, TimetableSlot } from './types';
import {
  INITIAL_STUDENTS,
  INITIAL_GRADES,
  DEFAULT_WEIGHTS,
  INITIAL_BEHAVIORS,
  INITIAL_SEATS,
  INITIAL_LESSON_PLANS,
  INITIAL_TIMETABLE
} from './mockData';

// Component Imports
import Dashboard from './components/Dashboard';
import StudentManager from './components/StudentManager';
import SeatingChart from './components/SeatingChart';
import GradeManager from './components/GradeManager';
import DisciplineRewards from './components/DisciplineRewards';
import LessonPlanner from './components/LessonPlanner';
import AIWorkspace from './components/AIWorkspace';
import ClassroomGames from './components/ClassroomGames';

// Icons
import {
  LayoutDashboard,
  Users,
  Grid,
  FileSpreadsheet,
  Award,
  BookOpen,
  Sparkles,
  RefreshCw,
  GraduationCap,
  Dices,
  X,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appApiKey, setAppApiKey] = useState('');
  const [appModel, setAppModel] = useState('gemini-3-flash-preview');

  // Core Applet States
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [weights, setWeights] = useState<GradeWeights>(DEFAULT_WEIGHTS);
  const [behaviors, setBehaviors] = useState<BehaviorLog[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);

  // 1. Initial State Loading from LocalStorage or MockData
  useEffect(() => {
    const localStudents = localStorage.getItem('edumanage_students');
    const localGrades = localStorage.getItem('edumanage_grades');
    const localWeights = localStorage.getItem('edumanage_weights');
    const localBehaviors = localStorage.getItem('edumanage_behaviors');
    const localSeats = localStorage.getItem('edumanage_seats');
    const localLessonPlans = localStorage.getItem('edumanage_lessonplans');
    const localTimetable = localStorage.getItem('edumanage_timetable');

    if (localStudents) {
      setStudents(JSON.parse(localStudents));
    } else {
      setStudents(INITIAL_STUDENTS);
      localStorage.setItem('edumanage_students', JSON.stringify(INITIAL_STUDENTS));
    }

    if (localGrades) {
      setGrades(JSON.parse(localGrades));
    } else {
      setGrades(INITIAL_GRADES);
      localStorage.setItem('edumanage_grades', JSON.stringify(INITIAL_GRADES));
    }

    if (localWeights) {
      setWeights(JSON.parse(localWeights));
    } else {
      setWeights(DEFAULT_WEIGHTS);
      localStorage.setItem('edumanage_weights', JSON.stringify(DEFAULT_WEIGHTS));
    }

    if (localBehaviors) {
      setBehaviors(JSON.parse(localBehaviors));
    } else {
      setBehaviors(INITIAL_BEHAVIORS);
      localStorage.setItem('edumanage_behaviors', JSON.stringify(INITIAL_BEHAVIORS));
    }

    if (localSeats) {
      setSeats(JSON.parse(localSeats));
    } else {
      setSeats(INITIAL_SEATS);
      localStorage.setItem('edumanage_seats', JSON.stringify(INITIAL_SEATS));
    }

    if (localLessonPlans) {
      setLessonPlans(JSON.parse(localLessonPlans));
    } else {
      setLessonPlans(INITIAL_LESSON_PLANS);
      localStorage.setItem('edumanage_lessonplans', JSON.stringify(INITIAL_LESSON_PLANS));
    }

    if (localTimetable) {
      setTimetable(JSON.parse(localTimetable));
    } else {
      setTimetable(INITIAL_TIMETABLE);
      localStorage.setItem('edumanage_timetable', JSON.stringify(INITIAL_TIMETABLE));
    }
  }, []);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    const savedModel = localStorage.getItem('gemini_model');
    if (savedKey) setAppApiKey(savedKey);
    if (savedModel) setAppModel(savedModel);
    
    if (!savedKey) {
      setIsSettingsOpen(true);
    }
  }, []);

  // 2. LocalStorage Sync helpers
  const syncStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    localStorage.setItem('edumanage_students', JSON.stringify(newStudents));
  };

  const syncGrades = (newGrades: Grade[]) => {
    setGrades(newGrades);
    localStorage.setItem('edumanage_grades', JSON.stringify(newGrades));
  };

  const syncWeights = (newWeights: GradeWeights) => {
    setWeights(newWeights);
    localStorage.setItem('edumanage_weights', JSON.stringify(newWeights));
  };

  const syncBehaviors = (newBehaviors: BehaviorLog[]) => {
    setBehaviors(newBehaviors);
    localStorage.setItem('edumanage_behaviors', JSON.stringify(newBehaviors));
  };

  const syncSeats = (newSeats: Seat[]) => {
    setSeats(newSeats);
    localStorage.setItem('edumanage_seats', JSON.stringify(newSeats));
  };

  const syncLessonPlans = (newPlans: LessonPlan[]) => {
    setLessonPlans(newPlans);
    localStorage.setItem('edumanage_lessonplans', JSON.stringify(newPlans));
  };

  const syncTimetable = (newTimetable: TimetableSlot[]) => {
    setTimetable(newTimetable);
    localStorage.setItem('edumanage_timetable', JSON.stringify(newTimetable));
  };

  // 3. Operational State Mutation Callbacks
  const handleAddStudent = (std: Student) => {
    const updated = [...students, std];
    syncStudents(updated);

    // Initialize empty grade for new student
    const defaultGrade: Grade = {
      studentId: std.id,
      oral: [],
      quiz15m: [],
      midterm: [],
      final: [],
    };
    syncGrades([...grades, defaultGrade]);
  };

  const handleEditStudent = (std: Student) => {
    const updated = students.map(s => (s.id === std.id ? std : s));
    syncStudents(updated);
  };

  const handleDeleteStudent = (id: string) => {
    // Delete student
    const updatedStds = students.filter(s => s.id !== id);
    syncStudents(updatedStds);

    // Delete student's grades
    syncGrades(grades.filter(g => g.studentId !== id));

    // Delete student's behaviors
    syncBehaviors(behaviors.filter(b => b.studentId !== id));

    // Remove student from seating chart
    const updatedSeats = seats.map(s => (s.studentId === id ? { ...s, studentId: null } : s));
    syncSeats(updatedSeats);
  };

  const handleAddBehavior = (log: BehaviorLog) => {
    syncBehaviors([log, ...behaviors]);
  };

  const handleDeleteBehavior = (id: string) => {
    syncBehaviors(behaviors.filter(b => b.id !== id));
  };

  const handleAddLessonPlan = (plan: LessonPlan) => {
    syncLessonPlans([plan, ...lessonPlans]);
  };

  const handleUpdateLessonPlan = (plan: LessonPlan) => {
    syncLessonPlans(lessonPlans.map(lp => (lp.id === plan.id ? plan : lp)));
  };

  const handleDeleteLessonPlan = (id: string) => {
    syncLessonPlans(lessonPlans.filter(lp => lp.id !== id));
  };

  const handleUpdateTimetableSlot = (slot: TimetableSlot) => {
    const index = timetable.findIndex(s => s.dayOfWeek === slot.dayOfWeek && s.period === slot.period);
    const updated = [...timetable];
    if (index > -1) {
      updated[index] = slot;
    } else {
      updated.push(slot);
    }
    syncTimetable(updated);
  };

  // 4. Force Reset data back to beautiful Vietnamese Demo class
  const handleResetDemoData = () => {
    if (confirm('Bạn có chắc chắn muốn khôi phục toàn bộ lớp học về dữ liệu mẫu mặc định?')) {
      localStorage.removeItem('edumanage_students');
      localStorage.removeItem('edumanage_grades');
      localStorage.removeItem('edumanage_weights');
      localStorage.removeItem('edumanage_behaviors');
      localStorage.removeItem('edumanage_seats');
      localStorage.removeItem('edumanage_lessonplans');
      localStorage.removeItem('edumanage_timetable');

      setStudents(INITIAL_STUDENTS);
      setGrades(INITIAL_GRADES);
      setWeights(DEFAULT_WEIGHTS);
      setBehaviors(INITIAL_BEHAVIORS);
      setSeats(INITIAL_SEATS);
      setLessonPlans(INITIAL_LESSON_PLANS);
      setTimetable(INITIAL_TIMETABLE);

      alert('Đã khôi phục dữ liệu lớp mẫu thành công!');
      setActiveTab('dashboard');
    }
  };

  const handleSyncStudents = (syncedStudents: Student[], mode: 'overwrite' | 'merge') => {
    if (mode === 'overwrite') {
      // 1. Overwrite students list
      syncStudents(syncedStudents);

      // 2. Clear out grades for deleted students, keep matching ones, create defaults for new ones
      const newGrades = syncedStudents.map(s => {
        const existing = grades.find(g => g.studentId === s.id);
        return existing || {
          studentId: s.id,
          oral: [],
          quiz15m: [],
          midterm: [],
          final: [],
        };
      });
      syncGrades(newGrades);

      // 3. Clear behaviors for students who are no longer in the list
      const studentIds = new Set(syncedStudents.map(s => s.id));
      const newBehaviors = behaviors.filter(b => studentIds.has(b.studentId));
      syncBehaviors(newBehaviors);

      // 4. Update seating chart (remove deleted students)
      const newSeats = seats.map(seat => {
        if (seat.studentId && !studentIds.has(seat.studentId)) {
          return { ...seat, studentId: null };
        }
        return seat;
      });
      syncSeats(newSeats);
    } else {
      // mode === 'merge'
      const updatedStudents = [...students];
      const updatedGrades = [...grades];

      syncedStudents.forEach(newStd => {
        const index = updatedStudents.findIndex(s => s.studentId === newStd.studentId);
        if (index > -1) {
          // Update details, keep original ID
          const originalId = updatedStudents[index].id;
          updatedStudents[index] = { ...newStd, id: originalId };
        } else {
          // Add new student
          updatedStudents.push(newStd);
          // Add empty grade
          updatedGrades.push({
            studentId: newStd.id,
            oral: [],
            quiz15m: [],
            midterm: [],
            final: [],
          });
        }
      });

      syncStudents(updatedStudents);
      syncGrades(updatedGrades);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Upper Brand Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest">
              Lớp 9A1-SWIN • GVCN
            </span>
            <h1 className="text-lg font-bold tracking-tight">QUẢN LÍ LỚP HỌC 9A1-SWIN</h1>
          </div>
        </div>

        {/* Global actions and metrics */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg font-medium text-slate-300">
            Sĩ số: <span className="text-white font-bold">{students.length} em</span>
          </div>

          <button
            onClick={handleResetDemoData}
            className="bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold cursor-pointer"
            title="Khôi phục lớp mẫu mặc định"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Khôi Phục Lớp Mẫu
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center font-semibold relative cursor-pointer"
          >
            <span className="flex items-center gap-1 font-bold text-violet-300">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              CẤU HÌNH AI
            </span>
            <span className="text-[9px] text-red-400 hover:underline font-medium block mt-0.5">
              Lấy API key để sử dụng app
            </span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col py-4 px-3 justify-between">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 border-l-4 border-indigo-600 pl-3'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Tổng Quan & Thống Kê
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'students'
                  ? 'bg-slate-100 text-slate-900 border-l-4 border-indigo-600 pl-3'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Sơ Số Hóa Học Sinh
            </button>

            <button
              onClick={() => setActiveTab('seating')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'seating'
                  ? 'bg-slate-100 text-slate-900 border-l-4 border-indigo-600 pl-3'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              Sơ Đồ Lớp Học
            </button>

            <button
              onClick={() => setActiveTab('grading')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'grading'
                  ? 'bg-slate-100 text-slate-900 border-l-4 border-indigo-600 pl-3'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Sổ Điểm Tự Động
            </button>

            <button
              onClick={() => setActiveTab('behavior')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'behavior'
                  ? 'bg-slate-100 text-slate-900 border-l-4 border-indigo-600 pl-3'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4" />
              Thi Đua & Hạnh Kiểm
            </button>

            <button
              onClick={() => setActiveTab('planner')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'planner'
                  ? 'bg-slate-100 text-slate-900 border-l-4 border-indigo-600 pl-3'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Quản Trị Giảng Dạy
            </button>

            <button
              onClick={() => setActiveTab('ai-workspace')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all border border-transparent ${
                activeTab === 'ai-workspace'
                  ? 'bg-slate-100 text-violet-800 border-l-4 border-violet-600 pl-3'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
              Trợ Lý Sư Phạm AI
            </button>

            <button
              onClick={() => setActiveTab('games')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all border border-transparent ${
                activeTab === 'games'
                  ? 'bg-slate-100 text-indigo-700 border-l-4 border-indigo-600 pl-3'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Dices className="w-4 h-4 text-indigo-500 animate-bounce" />
              Trò Chơi Lớp Học
            </button>
          </div>

          <div className="hidden md:block p-3 border-t border-slate-200 text-[10px] text-slate-400 font-mono space-y-1 uppercase tracking-wider">
            <p>QUẢN LÍ LỚP HỌC 9A1-SWIN v1.0.0</p>
            <p>© Google AI Studio Build</p>
          </div>
        </aside>

        {/* Content viewport */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              students={students}
              grades={grades}
              weights={weights}
              behaviors={behaviors}
              lessonPlans={lessonPlans}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'students' && (
            <StudentManager
              students={students}
              grades={grades}
              behaviors={behaviors}
              onAddStudent={handleAddStudent}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onSyncStudents={handleSyncStudents}
            />
          )}

          {activeTab === 'seating' && (
            <SeatingChart
              students={students}
              grades={grades}
              seats={seats}
              onUpdateSeats={syncSeats}
            />
          )}

          {activeTab === 'grading' && (
            <GradeManager
              students={students}
              grades={grades}
              weights={weights}
              onUpdateGrades={syncGrades}
              onUpdateWeights={syncWeights}
            />
          )}

          {activeTab === 'behavior' && (
            <DisciplineRewards
              students={students}
              behaviors={behaviors}
              onAddBehavior={handleAddBehavior}
              onDeleteBehavior={handleDeleteBehavior}
            />
          )}

          {activeTab === 'planner' && (
            <LessonPlanner
              lessonPlans={lessonPlans}
              timetable={timetable}
              onAddLessonPlan={handleAddLessonPlan}
              onUpdateLessonPlan={handleUpdateLessonPlan}
              onDeleteLessonPlan={handleDeleteLessonPlan}
              onUpdateTimetableSlot={handleUpdateTimetableSlot}
            />
          )}

          {activeTab === 'ai-workspace' && (
            <AIWorkspace
              students={students}
              grades={grades}
              behaviors={behaviors}
              lessonPlans={lessonPlans}
            />
          )}

          {activeTab === 'games' && (
            <ClassroomGames
              students={students}
              onAddBehavior={handleAddBehavior}
            />
          )}
        </main>
      </div>

      {/* AI Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base font-sans tracking-tight">Cấu hình Trợ lý AI & API Key</h3>
                <p className="text-slate-300 text-[10px] font-mono mt-0.5 uppercase tracking-wider">Cấu hình kết nối và chọn mô hình trí tuệ nhân tạo</p>
              </div>
              {localStorage.getItem('gemini_api_key') && (
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {!localStorage.getItem('gemini_api_key') && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-rose-950">Chưa cấu hình API Key!</p>
                    <p className="font-normal text-rose-900 mt-0.5 leading-normal">
                      Bạn cần nhập API key để có thể kích hoạt các tính năng phân tích học thuật, viết nhận xét học bạ và lên kịch bản bài giảng tự động bằng AI.
                    </p>
                  </div>
                </div>
              )}

              {/* API Key Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Google Gemini API Key *</label>
                <input
                  type="password"
                  value={appApiKey}
                  onChange={(e) => setAppApiKey(e.target.value)}
                  placeholder="Nhập API Key của bạn (AI Studio)..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                />
                <p className="text-[10px] text-slate-500 leading-normal">
                  Chưa có API key? Nhấn vào đây để{' '}
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Lấy API key miễn phí từ Google AI Studio
                  </a>
                  . Key sẽ được lưu an toàn tại bộ nhớ đệm trình duyệt (`localStorage`) của riêng bạn.
                </p>
              </div>

              {/* Model Select Cards */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Mô hình AI mặc định (Model Select)</label>
                
                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  {/* gemini-3-flash-preview */}
                  <label
                    className={`p-3 border rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      appModel === 'gemini-3-flash-preview'
                        ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-50'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gemini_model_choice"
                      checked={appModel === 'gemini-3-flash-preview'}
                      onChange={() => setAppModel('gemini-3-flash-preview')}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900 block text-xs">gemini-3-flash-preview</span>
                      <span className="text-[10px] text-slate-500 block leading-normal mt-0.5">
                        Tốc độ siêu nhanh, tối ưu hóa thời gian xử lý, tiết kiệm quota tốt.
                      </span>
                    </div>
                    <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                      MẶC ĐỊNH
                    </span>
                  </label>

                  {/* gemini-3-pro-preview */}
                  <label
                    className={`p-3 border rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      appModel === 'gemini-3-pro-preview'
                        ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-50'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gemini_model_choice"
                      checked={appModel === 'gemini-3-pro-preview'}
                      onChange={() => setAppModel('gemini-3-pro-preview')}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900 block text-xs">gemini-3-pro-preview</span>
                      <span className="text-[10px] text-slate-500 block leading-normal mt-0.5">
                        Mô hình cao cấp, suy luận sư phạm thông minh và phân tích sâu sắc hơn.
                      </span>
                    </div>
                  </label>

                  {/* gemini-2.5-flash */}
                  <label
                    className={`p-3 border rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      appModel === 'gemini-2.5-flash'
                        ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-50'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gemini_model_choice"
                      checked={appModel === 'gemini-2.5-flash'}
                      onChange={() => setAppModel('gemini-2.5-flash')}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900 block text-xs">gemini-2.5-flash</span>
                      <span className="text-[10px] text-slate-500 block leading-normal mt-0.5">
                        Tính ổn định cao, phản hồi nhanh và khả năng tương thích tốt.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
              {localStorage.getItem('gemini_api_key') && (
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  ĐÓNG
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!appApiKey.trim()) {
                    alert('Vui lòng nhập API Key để lưu cấu hình.');
                    return;
                  }
                  localStorage.setItem('gemini_api_key', appApiKey.trim());
                  localStorage.setItem('gemini_model', appModel);
                  alert('Đã lưu cấu hình thành công!');
                  setIsSettingsOpen(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                LƯU CẤU HÌNH
              </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
