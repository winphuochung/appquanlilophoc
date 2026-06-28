import React, { useState } from 'react';
import { Student, BehaviorLog, ConductType } from '../types';
import { Award, ShieldAlert, Plus, Trash2, ShieldCheck, Heart, AlertCircle, Sparkles } from 'lucide-react';

interface DisciplineRewardsProps {
  students: Student[];
  behaviors: BehaviorLog[];
  onAddBehavior: (log: BehaviorLog) => void;
  onDeleteBehavior: (id: string) => void;
}

export default function DisciplineRewards({
  students,
  behaviors,
  onAddBehavior,
  onDeleteBehavior,
}: DisciplineRewardsProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [logType, setLogType] = useState<'merit' | 'demerit'>('merit');
  const [logTitle, setLogTitle] = useState('');
  const [logPoints, setLogPoints] = useState(10);
  const [logDescription, setLogDescription] = useState('');
  const [logBadge, setLogBadge] = useState('');
  const [formError, setFormError] = useState('');

  // Predefined badges
  const BADGES = ['Chăm chỉ', 'Sáng tạo', 'Đồng đội', 'Kỷ luật', 'Trách nhiệm', 'Nỗ lực', 'Tiến bộ'];

  // Quick preset actions for faster teacher logging
  const MERIT_PRESETS = [
    { title: 'Hăng hái phát biểu xây dựng bài', points: 10, badge: 'Chăm chỉ' },
    { title: 'Giúp đỡ bạn bè cùng tiến bộ', points: 15, badge: 'Đồng đội' },
    { title: 'Đạt thành tích học thuật xuất sắc', points: 20, badge: 'Sáng tạo' },
    { title: 'Nghiêm túc chấp hành kỷ luật lớp', points: 10, badge: 'Kỷ luật' },
    { title: 'Tích cực tham gia trực nhật lớp', points: 10, badge: 'Trách nhiệm' },
  ];

  const DEMERIT_PRESETS = [
    { title: 'Nói chuyện riêng, mất trật tự', points: -5 },
    { title: 'Thiếu bài tập về nhà môn học', points: -10 },
    { title: 'Đi học muộn không phép', points: -5 },
    { title: 'Sử dụng điện thoại trong giờ học', points: -15 },
    { title: 'Vi phạm tác phong học sinh', points: -5 },
  ];

  const applyPreset = (preset: { title: string; points: number; badge?: string }) => {
    setLogTitle(preset.title);
    setLogPoints(preset.points);
    if (preset.badge) {
      setLogBadge(preset.badge);
    } else {
      setLogBadge('');
    }
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setFormError('Vui lòng chọn học sinh cần ghi nhận.');
      return;
    }
    if (!logTitle.trim()) {
      setFormError('Vui lòng nhập hoặc chọn tiêu đề hành vi.');
      return;
    }

    const pointsNum = Number(logPoints);
    if (logType === 'merit' && pointsNum <= 0) {
      setFormError('Điểm cộng phải là số dương lớn hơn 0.');
      return;
    }
    if (logType === 'demerit' && pointsNum >= 0) {
      setFormError('Điểm trừ phải là số âm bé hơn 0.');
      return;
    }

    const newLog: BehaviorLog = {
      id: `b_log_${Date.now()}`,
      studentId: selectedStudentId,
      type: logType,
      title: logTitle.trim(),
      points: pointsNum,
      date: new Date().toISOString().split('T')[0],
      description: logDescription.trim(),
      badge: logType === 'merit' ? logBadge : undefined,
    };

    onAddBehavior(newLog);

    // Reset Form
    setLogTitle('');
    setLogPoints(logType === 'merit' ? 10 : -5);
    setLogDescription('');
    setLogBadge('');
    setFormError('');
  };

  // Helper to calculate total thi đua points for a student
  const getStudentTotalPoints = (studentId: string) => {
    return behaviors
      .filter(b => b.studentId === studentId)
      .reduce((sum, log) => sum + log.points, 0);
  };

  // Auto determine conduct (Hạnh kiểm) based on behavior points
  const getConductRating = (score: number): ConductType => {
    if (score >= 30) return 'Tốt';
    if (score >= 10) return 'Khá';
    if (score >= -5) return 'Trung bình';
    return 'Yếu';
  };

  const getConductColor = (rating: ConductType) => {
    switch (rating) {
      case 'Tốt': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Khá': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Trung bình': return 'text-amber-700 bg-amber-50 border-amber-200';
      default: return 'text-rose-700 bg-rose-50 border-rose-200';
    }
  };

  return (
    <div id="behavior-tab" className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">Thi Đua Học Đường & Hồ Sơ Hành Vi</h2>
        <p className="text-xs text-slate-500">
          Ghi nhận nhật ký rèn luyện đạo đức, trao tặng huy hiệu danh dự và tự động hóa đánh giá Hạnh kiểm học sinh
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form to Log Behavior */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Ghi Nhận Hành Vi Mới
            </h3>

            <form onSubmit={handleAddLog} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Student selector */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Chọn học sinh *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  <option value="">-- Chọn học sinh từ danh sách --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.studentId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type toggle */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Phân loại rèn luyện
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setLogType('merit');
                      setLogPoints(10);
                    }}
                    className={`py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      logType === 'merit'
                        ? 'bg-white text-emerald-600 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    Khen thưởng (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLogType('demerit');
                      setLogPoints(-5);
                    }}
                    className={`py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      logType === 'demerit'
                        ? 'bg-white text-rose-600 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Vi phạm (-)
                  </button>
                </div>
              </div>

              {/* Presets Grid */}
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Mẫu nhanh sư phạm
                </span>
                <div className="max-h-[140px] overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50/50 space-y-1 scrollbar-thin">
                  {(logType === 'merit' ? MERIT_PRESETS : DEMERIT_PRESETS).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="w-full text-left p-1.5 hover:bg-white rounded text-[10px] font-bold text-slate-700 hover:text-indigo-600 flex justify-between items-center transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                    >
                      <span className="truncate">{preset.title}</span>
                      <span className={`font-mono font-bold ${logType === 'merit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {preset.points > 0 ? `+${preset.points}` : preset.points}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Log Title Input */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Hành vi ghi nhận *
                </label>
                <input
                  type="text"
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  placeholder="Ghi nhận tiêu đề hành vi cụ thể..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Points Input */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Điểm thi đua
                  </label>
                  <input
                    type="number"
                    value={logPoints}
                    onChange={(e) => setLogPoints(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* Badge (only for merits) */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Huy hiệu danh dự
                  </label>
                  <select
                    value={logBadge}
                    onChange={(e) => setLogBadge(e.target.value)}
                    disabled={logType === 'demerit'}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 font-medium"
                  >
                    <option value="">Không trao tặng</option>
                    {BADGES.map(badge => (
                      <option key={badge} value={badge}>{badge}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Chi tiết / Ghi chú sự kiện (Tùy chọn)
                </label>
                <textarea
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  placeholder="Mô tả cụ thể bối cảnh diễn ra hành vi..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-2.5 rounded-lg border border-slate-800 transition-all cursor-pointer uppercase tracking-wider"
              >
                GHI VÀO HỌC BẠ THI ĐUA
              </button>
            </form>
          </div>
        </div>

        {/* Middle and Right: Leaderboard & Logs list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thi đua Leaderboard Summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Bảng Tổng Hợp Thi Đua Lớp
            </h3>
            <p className="text-xs text-slate-500 mb-4">Danh sách xếp hạng rèn luyện đạo đức tự động cập nhật</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-3 px-4">HỌC SINH</th>
                    <th className="py-3 px-4 text-center">TỔNG ĐIỂM THI ĐUA</th>
                    <th className="py-3 px-4 text-center">XẾP LOẠI HẠNH KIỂM</th>
                    <th className="py-3 px-4">NHẬN HUY HIỆU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {students.map((s) => {
                    const score = getStudentTotalPoints(s.id);
                    const conduct = getConductRating(score);
                    const studentMeritsWithBadges = behaviors
                      .filter(b => b.studentId === s.id && b.badge)
                      .map(b => b.badge);
                    const uniqueBadges = Array.from(new Set(studentMeritsWithBadges));

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{s.name}</td>
                        <td className="py-2.5 px-4 text-center font-bold font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${
                            score >= 20 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                            score >= 0 ? 'text-indigo-700 bg-indigo-50 border-indigo-100' :
                            'text-rose-700 bg-rose-50 border-rose-100'
                          }`}>
                            {score > 0 ? `+${score}` : score}đ
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black border font-mono uppercase tracking-wider ${getConductColor(conduct)}`}>
                            Hạnh kiểm {conduct}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {uniqueBadges.map((badge, idx) => (
                              <span key={idx} className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                                🏅 {badge.toUpperCase()}
                              </span>
                            ))}
                            {uniqueBadges.length === 0 && <span className="text-slate-300 text-[10px] italic">Chưa có</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Behavior Log Stream */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4 font-sans tracking-tight">Lịch Sử Rèn Luyện & Khen Thưởng Chi Tiết</h3>
            
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {behaviors.map((log) => {
                const s = students.find(student => student.id === log.studentId);
                return (
                  <div key={log.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded mt-0.5 border ${
                        log.type === 'merit' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                      }`}>
                        {log.type === 'merit' ? <Award className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{s ? s.name : 'Học sinh ẩn danh'}</h4>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono ${
                            log.type === 'merit' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                          }`}>
                            {log.type === 'merit' ? 'Khen thưởng' : 'Vi phạm'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 mt-1">{log.title}</p>
                        {log.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{log.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">{log.date}</span>
                          {log.badge && (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                              🏅 {log.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold text-xs ${
                        log.type === 'merit' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {log.points > 0 ? `+${log.points}` : log.points}đ
                      </span>
                      <button
                        onClick={() => {
                          if (confirm('Bạn có chắc muốn xóa lịch sử rèn luyện này?')) {
                            onDeleteBehavior(log.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded border border-slate-200 hover:border-rose-100 bg-white hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa nhật ký"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {behaviors.length === 0 && (
                <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  <Heart className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-medium">Chưa ghi nhận hành vi thi đua nào cho lớp học.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
