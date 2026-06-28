import React, { useState } from 'react';
import { Student, Grade, GradeWeights } from '../types';
import { Plus, Trash2, Settings, Save, Sparkles, CheckCircle, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface GradeManagerProps {
  students: Student[];
  grades: Grade[];
  weights: GradeWeights;
  onUpdateGrades: (newGrades: Grade[]) => void;
  onUpdateWeights: (newWeights: GradeWeights) => void;
}

export default function GradeManager({
  students,
  grades,
  weights,
  onUpdateGrades,
  onUpdateWeights,
}: GradeManagerProps) {
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Weight form states
  const [weightOral, setWeightOral] = useState(weights.oral);
  const [weightQuiz15m, setWeightQuiz15m] = useState(weights.quiz15m);
  const [weightMidterm, setWeightMidterm] = useState(weights.midterm);
  const [weightFinal, setWeightFinal] = useState(weights.final);

  // Grade edit form states (for selected student)
  const [formOral, setFormOral] = useState<string>('');
  const [formQuiz15m, setFormQuiz15m] = useState<string>('');
  const [formMidterm, setFormMidterm] = useState<string>('');
  const [formFinal, setFormFinal] = useState<string>('');

  // Save weights
  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWeights({
      oral: Number(weightOral) || 1,
      quiz15m: Number(weightQuiz15m) || 1,
      midterm: Number(weightMidterm) || 2,
      final: Number(weightFinal) || 3,
    });
    setIsWeightModalOpen(false);
  };

  // Open edit form for student
  const startEditGrades = (studentId: string) => {
    const g = grades.find(g => g.studentId === studentId) || {
      studentId,
      oral: [],
      quiz15m: [],
      midterm: [],
      final: [],
    };
    setEditingStudentId(studentId);
    setFormOral(g.oral.join(', '));
    setFormQuiz15m(g.quiz15m.join(', '));
    setFormMidterm(g.midterm.join(', '));
    setFormFinal(g.final.join(', '));
  };

  // Save edited student grades
  const handleSaveGrades = (studentId: string) => {
    const parseGradeArray = (str: string): number[] => {
      return str
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '' && !isNaN(Number(item)))
        .map(Number)
        .map(n => Math.min(Math.max(n, 0), 10)); // Clamp between 0 and 10
    };

    const newGrades = [...grades];
    const gradeIdx = newGrades.findIndex(g => g.studentId === studentId);

    const updatedGrade: Grade = {
      studentId,
      oral: parseGradeArray(formOral),
      quiz15m: parseGradeArray(formQuiz15m),
      midterm: parseGradeArray(formMidterm),
      final: parseGradeArray(formFinal),
    };

    if (gradeIdx > -1) {
      newGrades[gradeIdx] = updatedGrade;
    } else {
      newGrades.push(updatedGrade);
    }

    onUpdateGrades(newGrades);
    setEditingStudentId(null);
  };

  // Automated GPA & Classification Calculation Logic
  const calculateGPA = (g: Grade) => {
    let scoreSum = 0;
    let weightSum = 0;

    if (g.oral.length > 0) {
      const avg = g.oral.reduce((a, b) => a + b, 0) / g.oral.length;
      scoreSum += avg * weights.oral;
      weightSum += weights.oral;
    }
    if (g.quiz15m.length > 0) {
      const avg = g.quiz15m.reduce((a, b) => a + b, 0) / g.quiz15m.length;
      scoreSum += avg * weights.quiz15m;
      weightSum += weights.quiz15m;
    }
    if (g.midterm.length > 0) {
      const avg = g.midterm.reduce((a, b) => a + b, 0) / g.midterm.length;
      scoreSum += avg * weights.midterm;
      weightSum += weights.midterm;
    }
    if (g.final.length > 0) {
      const avg = g.final.reduce((a, b) => a + b, 0) / g.final.length;
      scoreSum += avg * weights.final;
      weightSum += weights.final;
    }

    return weightSum > 0 ? Number((scoreSum / weightSum).toFixed(2)) : 0;
  };

  const getRank = (gpa: number) => {
    if (gpa === 0) return 'Chưa xếp loại';
    if (gpa >= 9.0) return 'Xuất sắc';
    if (gpa >= 8.0) return 'Giỏi';
    if (gpa >= 6.5) return 'Khá';
    if (gpa >= 5.0) return 'Trung bình';
    if (gpa >= 3.5) return 'Yếu';
    return 'Kém';
  };

  const getRankBadgeClass = (rank: string) => {
    switch (rank) {
      case 'Xuất sắc': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Giỏi': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Khá': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Trung bình': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div id="grades-tab" className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">Sổ Điểm Điện Tử & Học Thuật Tự Động</h2>
          <p className="text-xs text-slate-500">Tự động tính toán điểm trung bình môn học (GPA) và xếp loại dựa theo trọng số tùy biến</p>
        </div>

        <button
          onClick={() => setIsWeightModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-800 transition-colors flex items-center gap-2 justify-center cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          CẤU HÌNH HỆ SỐ ĐIỂM
        </button>
      </div>

      {/* Explanation alert */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
        <h4 className="font-bold flex items-center gap-1.5 text-slate-900">
          <HelpCircle className="w-4 h-4 text-indigo-500" />
          QUY TẮC TÍNH ĐIỂM TRUNG BÌNH (GPA):
        </h4>
        <p className="leading-relaxed">
          GPA = [ (TB Điểm Miệng × <span className="font-mono font-bold text-indigo-600">{weights.oral}</span>) + (TB Điểm 15 phút × <span className="font-mono font-bold text-indigo-600">{weights.quiz15m}</span>) + (TB Điểm Giữa Kỳ × <span className="font-mono font-bold text-indigo-600">{weights.midterm}</span>) + (TB Điểm Cuối Kỳ × <span className="font-mono font-bold text-indigo-600">{weights.final}</span>) ] ÷ Tổng hệ số (<span className="font-mono font-bold">{weights.oral + weights.quiz15m + weights.midterm + weights.final}</span>). 
          <span className="font-semibold ml-1 text-indigo-600">Nhấp vào "Sửa điểm" tại bất kỳ dòng nào để điều chỉnh.</span>
        </p>
      </div>

      {/* Spreadsheet / Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-3 px-5">HỌC SINH</th>
                <th className="py-3 px-4 text-center">MIỆNG (HS {weights.oral})</th>
                <th className="py-3 px-4 text-center">15 PHÚT (HS {weights.quiz15m})</th>
                <th className="py-3 px-4 text-center">GIỮA KỲ (HS {weights.midterm})</th>
                <th className="py-3 px-4 text-center">CUỐI KỲ (HS {weights.final})</th>
                <th className="py-3 px-4 text-center">ĐTB (GPA)</th>
                <th className="py-3 px-5 text-center">XẾP LOẠI</th>
                <th className="py-3 px-5 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {students.map((s) => {
                const g = grades.find(g => g.studentId === s.id) || {
                  studentId: s.id,
                  oral: [],
                  quiz15m: [],
                  midterm: [],
                  final: [],
                };
                const gpa = calculateGPA(g);
                const rank = getRank(gpa);
                const isEditing = editingStudentId === s.id;

                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50/40 transition-colors ${
                      isEditing ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    {/* Student Identity */}
                    <td className="py-3 px-5 font-semibold text-slate-900">
                      <div>
                        <p className="font-bold">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.studentId}</p>
                      </div>
                    </td>

                    {/* Oral Grades */}
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formOral}
                          onChange={(e) => setFormOral(e.target.value)}
                          placeholder="8, 9..."
                          className="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-center font-bold font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      ) : (
                        <div className="flex gap-1 justify-center">
                          {g.oral.map((score, idx) => (
                            <span key={idx} className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-bold font-mono text-[10px] text-slate-700">
                              {score}
                            </span>
                          ))}
                          {g.oral.length === 0 && <span className="text-slate-300 font-mono">-</span>}
                        </div>
                      )}
                    </td>

                    {/* Quiz 15m */}
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formQuiz15m}
                          onChange={(e) => setFormQuiz15m(e.target.value)}
                          placeholder="8.5, 9..."
                          className="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-center font-bold font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      ) : (
                        <div className="flex gap-1 justify-center">
                          {g.quiz15m.map((score, idx) => (
                            <span key={idx} className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-bold font-mono text-[10px] text-slate-700">
                              {score}
                            </span>
                          ))}
                          {g.quiz15m.length === 0 && <span className="text-slate-300 font-mono">-</span>}
                        </div>
                      )}
                    </td>

                    {/* Midterm */}
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formMidterm}
                          onChange={(e) => setFormMidterm(e.target.value)}
                          placeholder="9..."
                          className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-center font-bold font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      ) : (
                        <div className="flex gap-1 justify-center">
                          {g.midterm.map((score, idx) => (
                            <span key={idx} className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold font-mono text-[10px]">
                              {score}
                            </span>
                          ))}
                          {g.midterm.length === 0 && <span className="text-slate-300 font-mono">-</span>}
                        </div>
                      )}
                    </td>

                    {/* Final */}
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formFinal}
                          onChange={(e) => setFormFinal(e.target.value)}
                          placeholder="9.5..."
                          className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-center font-bold font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      ) : (
                        <div className="flex gap-1 justify-center">
                          {g.final.map((score, idx) => (
                            <span key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold font-mono text-[10px]">
                              {score}
                            </span>
                          ))}
                          {g.final.length === 0 && <span className="text-slate-300 font-mono">-</span>}
                        </div>
                      )}
                    </td>

                    {/* GPA */}
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`text-xs px-2 py-1 rounded font-mono border ${
                        gpa >= 8.0 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                        gpa >= 6.5 ? 'text-indigo-700 bg-indigo-50 border-indigo-100' :
                        gpa >= 5.0 ? 'text-slate-700 bg-slate-50 border-slate-200' :
                        gpa > 0 ? 'text-rose-700 bg-rose-50 border-rose-100' : 'text-slate-300 border-transparent'
                      }`}>
                        {gpa > 0 ? gpa.toFixed(2) : '-'}
                      </span>
                    </td>

                    {/* Classification Rank */}
                    <td className="py-3 px-5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black border font-mono uppercase tracking-wider ${getRankBadgeClass(rank)}`}>
                        {rank}
                      </span>
                    </td>

                    {/* Edit Trigger Buttons */}
                    <td className="py-3 px-5 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1.5 font-mono">
                          <button
                            onClick={() => handleSaveGrades(s.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                          >
                            LƯU
                          </button>
                          <button
                            onClick={() => setEditingStudentId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                          >
                            HỦY
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditGrades(s.id)}
                          className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-[10px] font-bold px-2.5 py-1.5 rounded transition-all cursor-pointer border border-slate-200"
                        >
                          SỬA ĐIỂM
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Weights Configuration Modal */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 border-b border-slate-800">
              <h3 className="font-bold text-md font-sans tracking-tight">Cấu Hình Trọng Số (Hệ Số) Điểm Môn Học</h3>
              <p className="text-slate-300 text-[10px] font-mono mt-1">CẤU HÌNH SẼ ẢNH HƯỞNG TỨC THÌ ĐẾN GPA CỦA LỚP</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveWeights} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Điểm Miệng (Hệ số)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={weightOral}
                    onChange={(e) => setWeightOral(parseInt(e.target.value) || 1)}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Kiểm Tra 15p (Hệ số)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={weightQuiz15m}
                    onChange={(e) => setWeightQuiz15m(parseInt(e.target.value) || 1)}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Điểm Giữa Kỳ (Hệ số)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={weightMidterm}
                    onChange={(e) => setWeightMidterm(parseInt(e.target.value) || 1)}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Thi Cuối Kỳ (Hệ số)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={weightFinal}
                    onChange={(e) => setWeightFinal(parseInt(e.target.value) || 1)}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsWeightModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  ÁP DỤNG CẤU HÌNH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
