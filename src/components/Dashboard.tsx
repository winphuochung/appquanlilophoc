import { useState } from 'react';
import { Student, Grade, BehaviorLog, LessonPlan, GradeWeights } from '../types';
import { Users, Award, BookOpen, AlertCircle, ShieldAlert, TrendingUp, CheckCircle, Flame } from 'lucide-react';

interface DashboardProps {
  students: Student[];
  grades: Grade[];
  weights: GradeWeights;
  behaviors: BehaviorLog[];
  lessonPlans: LessonPlan[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ students, grades, weights, behaviors, lessonPlans, onNavigate }: DashboardProps) {
  // Helper to calculate student GPA
  const calculateStudentGPA = (grade: Grade) => {
    const { oral, quiz15m, midterm, final } = grade;
    let totalScore = 0;
    let totalWeight = 0;

    if (oral.length > 0) {
      const avgOral = oral.reduce((a, b) => a + b, 0) / oral.length;
      totalScore += avgOral * weights.oral;
      totalWeight += weights.oral;
    }
    if (quiz15m.length > 0) {
      const avgQuiz = quiz15m.reduce((a, b) => a + b, 0) / quiz15m.length;
      totalScore += avgQuiz * weights.quiz15m;
      totalWeight += weights.quiz15m;
    }
    if (midterm.length > 0) {
      const avgMid = midterm.reduce((a, b) => a + b, 0) / midterm.length;
      totalScore += avgMid * weights.midterm;
      totalWeight += weights.midterm;
    }
    if (final.length > 0) {
      const avgFin = final.reduce((a, b) => a + b, 0) / final.length;
      totalScore += avgFin * weights.final;
      totalWeight += weights.final;
    }

    return totalWeight > 0 ? Number((totalScore / totalWeight).toFixed(2)) : 0;
  };

  const allGPAs = grades.map(g => calculateStudentGPA(g)).filter(gpa => gpa > 0);
  const classAverageGPA = allGPAs.length > 0 
    ? Number((allGPAs.reduce((a, b) => a + b, 0) / allGPAs.length).toFixed(2)) 
    : 0;

  // Classifications
  let xuatSac = 0; // >= 9
  let gioi = 0; // >= 8
  let kha = 0; // >= 6.5
  let trungBinh = 0; // >= 5
  let yeu = 0; // < 5

  allGPAs.forEach(gpa => {
    if (gpa >= 9.0) xuatSac++;
    else if (gpa >= 8.0) gioi++;
    else if (gpa >= 6.5) kha++;
    else if (gpa >= 5.0) trungBinh++;
    else yeu++;
  });

  // Calculate Behavior Stats
  const meritLogs = behaviors.filter(b => b.type === 'merit');
  const demeritLogs = behaviors.filter(b => b.type === 'demerit');
  const totalBehaviorPoints = behaviors.reduce((sum, b) => sum + b.points, 0);

  // Top students (highest GPA)
  const sortedStudentsByGPA = [...students]
    .map(s => {
      const g = grades.find(g => g.studentId === s.id);
      return {
        student: s,
        gpa: g ? calculateStudentGPA(g) : 0
      };
    })
    .sort((a, b) => b.gpa - a.gpa)
    .slice(0, 3);

  // Active Lesson Plans
  const pendingLessonPlans = lessonPlans.filter(lp => lp.status !== 'Đã hoàn thành');

  return (
    <div id="dashboard-tab" className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-6 shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="relative z-10 md:flex items-center justify-between">
          <div>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-3 py-1 rounded border border-indigo-500/30 uppercase tracking-widest font-mono">
              QUẢN LÍ LỚP HỌC 9A1-SWIN • Tổng quan hệ thống
            </span>
            <h1 className="text-3xl font-bold font-sans tracking-tight mt-3 text-white">
              Chào mừng quay trở lại, Giáo viên!
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Hệ thống đã tự động phân tích học lực và cập nhật tiến trình giảng dạy của lớp. Hãy kiểm tra các đề xuất từ Trợ lý AI hôm nay.
            </p>
          </div>
          <button
            onClick={() => onNavigate('ai-workspace')}
            className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-lg transition-all duration-150 flex items-center gap-2 border border-indigo-400/30 cursor-pointer"
          >
            <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
            TRỢ LÝ SƯ PHẠM AI
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng số học sinh</p>
            <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{students.length} em</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
              <span className="text-blue-600 font-semibold">Nam: {students.filter(s => s.gender === 'Nam').length}</span>
              <span>•</span>
              <span className="text-pink-600 font-semibold">Nữ: {students.filter(s => s.gender === 'Nữ').length}</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Điểm TB cả lớp</p>
            <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{classAverageGPA} / 10</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Tiến trình học tập ổn định</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Điểm thi đua lớp</p>
            <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {totalBehaviorPoints > 0 ? `+${totalBehaviorPoints}` : totalBehaviorPoints}đ
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs font-mono">
              <span className="text-emerald-600 font-semibold">+{meritLogs.length} cộng</span>
              <span>•</span>
              <span className="text-rose-600 font-semibold">{demeritLogs.length} trừ</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kế hoạch bài giảng</p>
            <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{pendingLessonPlans.length} giáo án</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-purple-600 font-semibold">
              <span>Cần thực hiện trong tuần</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Insights section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Grade Analysis and Top Achievers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grade Distribution Chart (Custom SVG) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Mô hình đo lường</p>
                <h2 className="text-lg font-bold text-slate-900">Phân Phối Học Lực Lớp Học</h2>
              </div>
              <span className="text-[10px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-mono font-bold">Xếp loại tự động</span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-64 flex items-end justify-between px-4 pt-4 border-b border-slate-200 relative">
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-[10px] text-slate-400 font-mono">
                <div className="border-b border-slate-100 w-full pb-1 text-right">Tối đa lớp</div>
                <div className="border-b border-slate-100 w-full pb-1"></div>
                <div className="border-b border-slate-100 w-full pb-1"></div>
                <div className="w-full"></div>
              </div>

              {/* Bar 1: Xuất sắc */}
              <div className="flex flex-col items-center group z-10 w-1/5">
                <div className="text-xs font-bold font-mono text-slate-700 mb-2">{xuatSac} em</div>
                <div 
                  className="w-12 bg-indigo-600 hover:bg-indigo-500 rounded-t transition-all duration-300"
                  style={{ height: `${Math.max(xuatSac * 15, 8)}px` }}
                ></div>
                <span className="text-[10px] font-bold text-indigo-700 mt-2 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Xuất sắc</span>
                <span className="text-[10px] font-mono text-slate-400 mt-1">(&gt;= 9.0)</span>
              </div>

              {/* Bar 2: Giỏi */}
              <div className="flex flex-col items-center group z-10 w-1/5">
                <div className="text-xs font-bold font-mono text-slate-700 mb-2">{gioi} em</div>
                <div 
                  className="w-12 bg-emerald-500 hover:bg-emerald-400 rounded-t transition-all duration-300"
                  style={{ height: `${Math.max(gioi * 15, 8)}px` }}
                ></div>
                <span className="text-[10px] font-bold text-emerald-700 mt-2 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Giỏi</span>
                <span className="text-[10px] font-mono text-slate-400 mt-1">(8.0 - 8.9)</span>
              </div>

              {/* Bar 3: Khá */}
              <div className="flex flex-col items-center group z-10 w-1/5">
                <div className="text-xs font-bold font-mono text-slate-700 mb-2">{kha} em</div>
                <div 
                  className="w-12 bg-amber-400 hover:bg-amber-300 rounded-t transition-all duration-300"
                  style={{ height: `${Math.max(kha * 15, 8)}px` }}
                ></div>
                <span className="text-[10px] font-bold text-amber-700 mt-2 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Khá</span>
                <span className="text-[10px] font-mono text-slate-400 mt-1">(6.5 - 7.9)</span>
              </div>

              {/* Bar 4: Trung bình */}
              <div className="flex flex-col items-center group z-10 w-1/5">
                <div className="text-xs font-bold font-mono text-slate-700 mb-2">{trungBinh} em</div>
                <div 
                  className="w-12 bg-slate-400 hover:bg-slate-300 rounded-t transition-all duration-300"
                  style={{ height: `${Math.max(trungBinh * 15, 8)}px` }}
                ></div>
                <span className="text-[10px] font-bold text-slate-700 mt-2 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">T.Bình</span>
                <span className="text-[10px] font-mono text-slate-400 mt-1">(5.0 - 6.4)</span>
              </div>

              {/* Bar 5: Yếu */}
              <div className="flex flex-col items-center group z-10 w-1/5">
                <div className="text-xs font-bold font-mono text-slate-700 mb-2">{yeu} em</div>
                <div 
                  className="w-12 bg-rose-500 hover:bg-rose-400 rounded-t transition-all duration-300"
                  style={{ height: `${Math.max(yeu * 15, 8)}px` }}
                ></div>
                <span className="text-[10px] font-bold text-rose-700 mt-2 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Yếu / Kém</span>
                <span className="text-[10px] font-mono text-slate-400 mt-1">(&lt; 5.0)</span>
              </div>
            </div>
          </div>

          {/* Top Achievers List */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Xếp hạng học thuật</p>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Học Sinh Xuất Sắc Dẫn Đầu</h2>
            <p className="text-xs text-slate-500 mb-4">Các cá nhân có kết quả học thuật cao nhất tính đến hiện tại</p>

            <div className="space-y-3">
              {sortedStudentsByGPA.map((item, index) => (
                <div key={item.student.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 hover:bg-indigo-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm font-mono ${
                      index === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      index === 1 ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                      'bg-orange-100 text-orange-700 border border-orange-200'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.student.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">Mã số: {item.student.studentId} • Lớp 9A1-SWIN</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded font-mono">
                      GPA: {item.gpa}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Xếp loại: {item.gpa >= 9 ? 'Xuất sắc' : 'Giỏi'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Behaviors Feed & Quick Actions */}
        <div className="space-y-6">
          {/* Live Behaviour Logs Feed */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nhật ký trực tiếp</p>
                <h2 className="text-lg font-bold text-slate-900">Nhật Ký Thi Đua Gần Đây</h2>
              </div>
              <button 
                onClick={() => onNavigate('behavior')}
                className="text-xs text-indigo-600 hover:underline font-bold"
              >
                Tất cả
              </button>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {behaviors.slice(0, 5).map((log) => {
                const s = students.find(student => student.id === log.studentId);
                return (
                  <div key={log.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-start gap-3">
                    <div className={`p-2 rounded mt-0.5 ${
                      log.type === 'merit' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                      {log.type === 'merit' ? <Award className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {s ? s.name : 'Ẩn danh'}
                        </span>
                        <span className={`text-xs font-bold font-mono ${
                          log.type === 'merit' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {log.points > 0 ? `+${log.points}` : log.points}đ
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-0.5 font-medium">{log.title}</p>
                      {log.badge && (
                        <span className="inline-block mt-1 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          🏅 {log.badge}
                        </span>
                      )}
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{log.date}</p>
                    </div>
                  </div>
                );
              })}
              {behaviors.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Chưa có nhật ký hành vi nào được ghi nhận.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Tasks & Links */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-xl text-white shadow-md border border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Thao tác nghiệp vụ</p>
            <h3 className="text-md font-bold mb-3">Thao Tác Nhanh Sư Phạm</h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button 
                onClick={() => onNavigate('seating')} 
                className="w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-3.5 py-3 rounded-lg transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Sắp xếp sơ đồ chỗ ngồi của lớp</span>
                <span className="font-semibold text-indigo-300">Sơ đồ ➜</span>
              </button>
              <button 
                onClick={() => onNavigate('grading')} 
                className="w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-3.5 py-3 rounded-lg transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Nhập điểm / Cấu hình trọng số</span>
                <span className="font-semibold text-indigo-300">Sổ điểm ➜</span>
              </button>
              <button 
                onClick={() => onNavigate('planner')} 
                className="w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-3.5 py-3 rounded-lg transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Soạn giáo án và bài giảng tuần này</span>
                <span className="font-semibold text-indigo-300">Giáo án ➜</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
