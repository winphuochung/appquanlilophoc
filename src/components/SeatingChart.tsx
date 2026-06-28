import { useState } from 'react';
import { Student, Grade, Seat } from '../types';
import { Users, Trash2, ArrowLeftRight, HelpCircle, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface SeatingChartProps {
  students: Student[];
  grades: Grade[];
  seats: Seat[];
  onUpdateSeats: (newSeats: Seat[]) => void;
}

export default function SeatingChart({ students, grades, seats, onUpdateSeats }: SeatingChartProps) {
  const [selectedSeat, setSelectedSeat] = useState<{ row: number; col: number } | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const totalRows = 4;
  const totalCols = 5;

  // Find student assigned to a slot
  const getStudentAt = (row: number, col: number) => {
    const seat = seats.find(s => s.row === row && s.col === col);
    if (!seat || !seat.studentId) return null;
    return students.find(std => std.id === seat.studentId) || null;
  };

  // Find all students who don't have a seat currently
  const assignedStudentIds = seats.map(s => s.studentId).filter(Boolean) as string[];
  const unassignedStudents = students.filter(s => !assignedStudentIds.includes(s.id));

  // Assign student to slot
  const handleAssign = (studentId: string | null) => {
    if (!selectedSeat) return;

    const { row, col } = selectedSeat;
    const existingSeats = [...seats];
    const seatIndex = existingSeats.findIndex(s => s.row === row && s.col === col);

    if (seatIndex > -1) {
      existingSeats[seatIndex] = { row, col, studentId };
    } else {
      existingSeats.push({ row, col, studentId });
    }

    onUpdateSeats(existingSeats);
    setIsAssigning(false);
    setSelectedSeat(null);
  };

  // Handle Seat Click (Initiate swapping, assigning, or unassigning)
  const handleSeatClick = (row: number, col: number) => {
    const currentStudent = getStudentAt(row, col);
    setSelectedSeat({ row, col });
    setIsAssigning(true);
  };

  // Trigger Gemini Seating Optimization Analysis
  const runAiOptimization = async () => {
    setLoadingAi(true);
    setAiAnalysis('');

    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const savedModel = localStorage.getItem('gemini_model') || 'gemini-3-flash-preview';

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'seating-optimization',
          payload: { students, grades },
          apiKey: savedKey,
          model: savedModel
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAiAnalysis(data.text);
      } else {
        setAiAnalysis(`[API ERROR] ${data.error || 'Không thể lấy ý kiến từ trợ lý AI.'}`);
      }
    } catch (err: any) {
      console.error(err);
      setAiAnalysis(`[API ERROR] Lỗi kết nối đến máy chủ AI: ${err.message || err}`);
    } finally {
      setLoadingAi(false);
    }
  };

  // Auto arrangement algorithm (Deterministic pedagogical grouping)
  const autoArrangePedagogical = () => {
    // 1. Sort students by GPA descending
    const studentGrades = students.map(s => {
      const g = grades.find(g => g.studentId === s.id);
      let gpa = 0;
      if (g) {
        const oralAvg = g.oral.length > 0 ? g.oral.reduce((a,b)=>a+b,0)/g.oral.length : 7;
        const quizAvg = g.quiz15m.length > 0 ? g.quiz15m.reduce((a,b)=>a+b,0)/g.quiz15m.length : 7;
        const midtermAvg = g.midterm.length > 0 ? g.midterm.reduce((a,b)=>a+b,0)/g.midterm.length : 7;
        const finalAvg = g.final.length > 0 ? g.final.reduce((a,b)=>a+b,0)/g.final.length : 7;
        gpa = (oralAvg + quizAvg + midtermAvg * 2 + finalAvg * 3) / 7;
      }
      return { id: s.id, gpa };
    });

    const sortedByGPA = [...studentGrades].sort((a,b) => b.gpa - a.gpa);
    
    // Split into Strong (half) and Weak (half)
    const midIndex = Math.ceil(sortedByGPA.length / 2);
    const strongGroup = sortedByGPA.slice(0, midIndex);
    const weakGroup = sortedByGPA.slice(midIndex);

    const newSeats: Seat[] = [];
    let strongPtr = 0;
    let weakPtr = 0;

    // Arrange into 4 rows, 5 columns
    // We place students in pairs: [strong, weak] side-by-side
    // Col 2 is kept as central pathway (null seats)
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        if (c === 2) {
          // Central aisle pathway
          newSeats.push({ row: r, col: c, studentId: null });
          continue;
        }

        // We alternate columns:
        // Left side: Col 0 (Weak), Col 1 (Strong)
        // Right side: Col 3 (Strong), Col 4 (Weak)
        if (c === 0) {
          if (weakPtr < weakGroup.length) {
            newSeats.push({ row: r, col: c, studentId: weakGroup[weakPtr++].id });
          } else {
            newSeats.push({ row: r, col: c, studentId: null });
          }
        } else if (c === 1) {
          if (strongPtr < strongGroup.length) {
            newSeats.push({ row: r, col: c, studentId: strongGroup[strongPtr++].id });
          } else {
            newSeats.push({ row: r, col: c, studentId: null });
          }
        } else if (c === 3) {
          if (strongPtr < strongGroup.length) {
            newSeats.push({ row: r, col: c, studentId: strongGroup[strongPtr++].id });
          } else {
            newSeats.push({ row: r, col: c, studentId: null });
          }
        } else if (c === 4) {
          if (weakPtr < weakGroup.length) {
            newSeats.push({ row: r, col: c, studentId: weakGroup[weakPtr++].id });
          } else {
            newSeats.push({ row: r, col: c, studentId: null });
          }
        }
      }
    }

    onUpdateSeats(newSeats);
    setSelectedSeat(null);
    setIsAssigning(false);
  };

  // Reset entire seating chart to empty
  const resetSeats = () => {
    if (confirm('Bạn có muốn xóa toàn bộ sơ đồ hiện tại để sắp xếp lại từ đầu?')) {
      const emptySeats: Seat[] = [];
      for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < totalCols; c++) {
          emptySeats.push({ row: r, col: c, studentId: null });
        }
      }
      onUpdateSeats(emptySeats);
      setSelectedSeat(null);
      setIsAssigning(false);
    }
  };

  return (
    <div id="seating-chart-tab" className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sơ Đồ Phòng Học Thông Minh</h2>
          <p className="text-xs text-slate-500">
            Sắp đặt vị trí bàn ghế và tối ưu hóa tương tác học tập của học sinh
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={autoArrangePedagogical}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 border border-indigo-200 cursor-pointer"
            title="Tự động xếp nhóm Bạn Cùng Tiến"
          >
            <Layers className="w-4 h-4" />
            TỰ XẾP BẠN CÙNG TIẾN
          </button>

          <button
            onClick={resetSeats}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            title="Đặt lại sơ đồ trống"
          >
            <RefreshCw className="w-4 h-4" />
            XÓA SƠ ĐỒ TRỐNG
          </button>

          <button
            onClick={runAiOptimization}
            disabled={loadingAi}
            className="bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
            {loadingAi ? 'AI ĐANG TƯ DUY...' : 'AI TỐI ƯU SƠ ĐỒ'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Classroom Visual Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* visual stage / board */}
          <div className="bg-slate-900 text-white rounded-lg p-3 text-center font-bold text-xs tracking-widest uppercase shadow-sm flex items-center justify-center gap-2 relative border border-slate-800">
            <div className="w-16 h-1 bg-amber-500 rounded absolute bottom-1 mx-auto"></div>
            👩‍🏫 BẢNG ĐEN / BÀN GIÁO VIÊN CHỦ NHIỆM
          </div>

          {/* Physical Desks Seating Layout Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-x-auto">
            <div className="min-w-[640px] space-y-6">
              {Array.from({ length: totalRows }).map((_, r) => (
                <div key={r} className="flex justify-between items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 w-12 text-center font-mono">Hàng {r + 1}</span>
                  <div className="flex-1 flex justify-between gap-4">
                    {Array.from({ length: totalCols }).map((_, c) => {
                      const student = getStudentAt(r, c);
                      const isAisle = c === 2; // Central pathway column
                      const isSelected = selectedSeat?.row === r && selectedSeat?.col === c;

                      if (isAisle) {
                        return (
                          <div 
                            key={c} 
                            className="flex-1 h-20 rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 font-bold font-mono select-none uppercase tracking-widest"
                          >
                            Lối đi
                          </div>
                        );
                      }

                      return (
                        <div
                          key={c}
                          onClick={() => handleSeatClick(r, c)}
                          className={`flex-1 h-20 rounded-xl border transition-all p-2 flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 ring-2 ring-indigo-50 bg-indigo-50/30 shadow-md'
                              : student
                              ? 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-sm'
                              : 'border-dashed border-slate-300 bg-slate-50/20 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold text-slate-400">
                              Bàn [{r + 1}-{c + 1}]
                            </span>
                            {student && (
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                student.gender === 'Nam' ? 'bg-blue-500' : 'bg-pink-500'
                              }`}></span>
                            )}
                          </div>

                          {student ? (
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-900 truncate">{student.name}</p>
                              <p className="text-[9px] font-mono text-slate-500 mt-0.5">{student.studentId}</p>
                            </div>
                          ) : (
                            <div className="text-center py-2 text-[10px] text-slate-400 font-mono">
                              (TRỐNG)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info / Legend */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="font-bold">Nam</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                <span className="font-bold">Nữ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded border border-dashed border-slate-300 bg-white"></span>
                <span className="font-bold">Bàn trống</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400 font-sans">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>Nhấn vào bàn để Sắp chỗ, Tráo vị trí hoặc Bỏ xếp.</span>
            </div>
          </div>
        </div>

        {/* Right Col: AI Advice Panel & Assignment form */}
        <div className="space-y-6">
          {/* Assignment UI if seat is selected */}
          {isAssigning && selectedSeat && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-sm text-slate-900">
                  Sắp Xếp Bàn [{selectedSeat.row + 1}-{selectedSeat.col + 1}]
                </h3>
                <button
                  onClick={() => {
                    setSelectedSeat(null);
                    setIsAssigning(false);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-950 font-bold cursor-pointer"
                >
                  ĐÓNG
                </button>
              </div>

              {/* Current seat owner info */}
              {getStudentAt(selectedSeat.row, selectedSeat.col) ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang xếp tại đây</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {getStudentAt(selectedSeat.row, selectedSeat.col)?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAssign(null)}
                    className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded border border-rose-200 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Bỏ xếp chỗ
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-mono">Bàn này hiện tại chưa xếp học sinh.</p>
              )}

              {/* Assign unseated student dropdown list */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Chỉ định học sinh (Chưa xếp: {unassignedStudents.length} em)
                </label>
                
                <div className="max-h-[160px] overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {unassignedStudents.map((std) => (
                    <button
                      key={std.id}
                      onClick={() => handleAssign(std.id)}
                      className="w-full text-left p-2.5 hover:bg-indigo-50/50 text-xs text-slate-800 font-bold flex justify-between items-center transition-colors cursor-pointer"
                    >
                      <span>{std.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">{std.studentId}</span>
                    </button>
                  ))}
                  {unassignedStudents.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      Tất cả học sinh trong lớp đã có chỗ ngồi.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Advisor Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trợ lý sư phạm</p>
                <h3 className="font-bold text-slate-900 text-sm">Tư Vấn Thiết Kế Sơ Đồ</h3>
              </div>
            </div>

            {loadingAi ? (
              <div className="space-y-3 py-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-xs text-slate-500 font-medium animate-pulse">
                  Gemini đang phân tích học lực và thi đua từng học sinh để đưa ra đề xuất sơ đồ lớp thông minh nhất...
                </p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4">
                {aiAnalysis.startsWith('[API ERROR]') ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                      <span>ĐÃ DỪNG DO LỖI</span>
                    </div>
                    <p className="text-[11px] font-mono whitespace-pre-wrap">{aiAnalysis.replace('[API ERROR] ', '')}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 text-xs text-slate-700 rounded-lg space-y-3 max-h-[380px] overflow-y-auto border border-slate-200 leading-relaxed font-sans scrollbar-thin">
                    <div className="prose prose-slate text-xs whitespace-pre-wrap">
                      {aiAnalysis}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setAiAnalysis('')}
                  className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-lg transition-all cursor-pointer"
                >
                  ĐÓNG LỜI KHUYÊN AI
                </button>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg">
                <AlertCircle className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
                <h4 className="text-xs font-bold text-slate-700">Chưa có phân tích AI</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  Chạy phân tích để Gemini tự động ghép cặp Bạn Cùng Tiến và tối ưu hóa không gian sư phạm lớp học!
                </p>
                <button
                  onClick={runAiOptimization}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  BẮT ĐẦU PHÂN TÍCH
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
