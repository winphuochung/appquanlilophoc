import React, { useState } from 'react';
import { LessonPlan, TimetableSlot } from '../types';
import { BookOpen, Plus, Trash2, Calendar, CheckSquare, Square, Clock, ChevronDown, Check, AlertCircle, FileSpreadsheet } from 'lucide-react';

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

interface LessonPlannerProps {
  lessonPlans: LessonPlan[];
  timetable: TimetableSlot[];
  onAddLessonPlan: (plan: LessonPlan) => void;
  onUpdateLessonPlan: (plan: LessonPlan) => void;
  onDeleteLessonPlan: (id: string) => void;
  onUpdateTimetableSlot: (slot: TimetableSlot) => void;
}

export default function LessonPlanner({
  lessonPlans,
  timetable,
  onAddLessonPlan,
  onUpdateLessonPlan,
  onDeleteLessonPlan,
  onUpdateTimetableSlot,
}: LessonPlannerProps) {
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  const handleExportPPTX = async (lessonPlan: LessonPlan) => {
    try {
      const PptxGenJSClass = await loadPptxGenJS();
      if (!PptxGenJSClass) {
        alert('Không thể tải thư viện PowerPoint Exporter. Vui lòng kiểm tra lại kết nối mạng.');
        return;
      }
      
      const pptx = new PptxGenJSClass();
      pptx.layout = 'LAYOUT_16x9';

      // Slide 1: Title (Dark Theme)
      const slide1 = pptx.addSlide();
      slide1.background = { fill: '0f172a' }; // slate-900
      slide1.addText('GIÁO ÁN GIẢNG DẠY', {
        x: 0.5, y: 1.0, w: '90%', h: 0.5,
        fontSize: 18, bold: true, color: '6366f1', fontFace: 'Arial'
      });
      slide1.addText(lessonPlan.title, {
        x: 0.5, y: 1.5, w: '90%', h: 1.2,
        fontSize: 30, bold: true, color: 'ffffff', fontFace: 'Arial'
      });
      slide1.addText(`Môn học: ${lessonPlan.subject}  |  Lớp: 9A1-SWIN`, {
        x: 0.5, y: 2.8, w: '90%', h: 0.4,
        fontSize: 14, color: '94a3b8', fontFace: 'Arial'
      });
      slide1.addText(`Ngày thực hiện: ${lessonPlan.date}  |  Thời lượng: ${lessonPlan.duration} phút`, {
        x: 0.5, y: 3.2, w: '90%', h: 0.4,
        fontSize: 12, color: '64748b', fontFace: 'Arial', italic: true
      });

      // Slide 2: Objectives
      const slide2 = pptx.addSlide();
      slide2.background = { fill: 'f8fafc' }; // slate-50
      slide2.addText('I. MỤC TIÊU BÀI HỌC', {
        x: 0.5, y: 0.4, w: '90%', h: 0.5,
        fontSize: 20, bold: true, color: '1e1b4b', fontFace: 'Arial'
      });
      slide2.addText(lessonPlan.objective || 'Chưa cập nhật mục tiêu cụ thể.', {
        x: 0.5, y: 1.0, w: '90%', h: 2.5,
        fontSize: 14, color: '334155', fontFace: 'Arial', lineSpacing: 22
      });

      // Slides 3+: Activities
      if (lessonPlan.activities && lessonPlan.activities.length > 0) {
        lessonPlan.activities.forEach((act, index) => {
          const slideAct = pptx.addSlide();
          slideAct.background = { fill: 'ffffff' };
          
          slideAct.addText(`HOẠT ĐỘNG ${index + 1}`, {
            x: 0.5, y: 0.4, w: '90%', h: 0.4,
            fontSize: 12, bold: true, color: '4f46e5', fontFace: 'Arial'
          });
          
          slideAct.addText(act.name, {
            x: 0.5, y: 0.8, w: '90%', h: 0.8,
            fontSize: 22, bold: true, color: '0f172a', fontFace: 'Arial'
          });

          // Metadata Card
          slideAct.addShape(pptx.shapes.RECTANGLE, {
            x: 0.5, y: 1.8, w: 2.5, h: 1.5,
            fill: { color: 'f1f5f9' },
            line: { color: 'cbd5e1', width: 1 }
          });
          slideAct.addText(`Thời lượng:\n${act.duration} phút\n\nTrạng thái:\n${act.isCompleted ? 'Đã hoàn thành' : 'Chưa thực hiện'}`, {
            x: 0.7, y: 2.0, w: 2.1, h: 1.1,
            fontSize: 11, color: '475569', fontFace: 'Arial'
          });

          // Description Placeholder
          slideAct.addText(`Các bước thực hiện dự kiến:\n1. Giáo viên giới thiệu nhiệm vụ và chia nhóm.\n2. Học sinh tiến hành thảo luận và ghi nhận kết quả.\n3. Trình bày sản phẩm và chấm điểm rèn luyện rèn thi đua.`, {
            x: 3.4, y: 1.8, w: 5.5, h: 1.8,
            fontSize: 12, color: '334155', fontFace: 'Arial', lineSpacing: 20
          });
        });
      }

      // Slide Last: Notes
      const slideLast = pptx.addSlide();
      slideLast.background = { fill: '0f172a' };
      slideLast.addText('GHI CHÚ & DẶN DÒ SƯ PHẠM', {
        x: 0.5, y: 0.5, w: '90%', h: 0.5,
        fontSize: 18, bold: true, color: 'facc15', fontFace: 'Arial'
      });
      slideLast.addText(lessonPlan.notes || 'Không có ghi chú thêm.', {
        x: 0.5, y: 1.2, w: '90%', h: 2.0,
        fontSize: 14, color: 'cbd5e1', fontFace: 'Arial', lineSpacing: 22
      });
      
      pptx.writeFile({ fileName: `Giao_An_9A1_${lessonPlan.title.replace(/\s+/g, '_')}.pptx` });
      
    } catch (err: any) {
      console.error(err);
      alert('Gặp lỗi khi tạo tệp PowerPoint: ' + err.message);
    }
  };
  
  // Timetable Edit State
  const [editSubjectName, setEditSubjectName] = useState('');

  // Lesson Plan Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('Toán học');
  const [formDate, setFormDate] = useState('');
  const [formObjective, setFormObjective] = useState('');
  const [formDuration, setFormDuration] = useState(45);
  const [activitiesList, setActivitiesList] = useState<{ name: string; duration: number }[]>([
    { name: 'Khởi động kiểm tra bài cũ', duration: 10 },
    { name: 'Giảng dạy lý thuyết bài mới', duration: 15 },
    { name: 'Luyện tập bài tập nhóm tại lớp', duration: 15 },
    { name: 'Tổng kết dặn dò học sinh', duration: 5 }
  ]);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Save lesson plan
  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formObjective.trim()) {
      setFormError('Vui lòng điền đầy đủ tiêu đề và mục tiêu bài học.');
      return;
    }

    const totalActDuration = activitiesList.reduce((sum, act) => sum + act.duration, 0);

    const newPlan: LessonPlan = {
      id: `LP_${Date.now()}`,
      title: formTitle.trim(),
      subject: formSubject,
      date: formDate || new Date().toISOString().split('T')[0],
      objective: formObjective.trim(),
      duration: totalActDuration || formDuration,
      status: 'Chưa bắt đầu',
      activities: activitiesList.map((act, index) => ({
        id: `act_${Date.now()}_${index}`,
        name: act.name,
        duration: act.duration,
        isCompleted: false
      })),
      notes: formNotes.trim()
    };

    onAddLessonPlan(newPlan);
    setIsNewPlanModalOpen(false);

    // Reset Form
    setFormTitle('');
    setFormObjective('');
    setFormNotes('');
    setActivitiesList([
      { name: 'Khởi động kiểm tra bài cũ', duration: 10 },
      { name: 'Giảng dạy lý thuyết bài mới', duration: 15 },
      { name: 'Luyện tập bài tập nhóm tại lớp', duration: 15 },
      { name: 'Tổng kết dặn dò học sinh', duration: 5 }
    ]);
  };

  // Toggle activity checkbox
  const toggleActivity = (planId: string, actId: string) => {
    const plan = lessonPlans.find(lp => lp.id === planId);
    if (!plan) return;

    const updatedActivities = plan.activities.map(act => {
      if (act.id === actId) {
        return { ...act, isCompleted: !act.isCompleted };
      }
      return act;
    });

    // Check if all activities are completed to auto-update status
    const allCompleted = updatedActivities.every(act => act.isCompleted);
    const anyCompleted = updatedActivities.some(act => act.isCompleted);
    
    let newStatus = plan.status;
    if (allCompleted) {
      newStatus = 'Đã hoàn thành';
    } else if (anyCompleted) {
      newStatus = 'Đang thực hiện';
    } else {
      newStatus = 'Chưa bắt đầu';
    }

    onUpdateLessonPlan({
      ...plan,
      activities: updatedActivities,
      status: newStatus
    });
  };

  // Add/Remove activity rows inside new plan modal
  const addActivityRow = () => {
    setActivitiesList([...activitiesList, { name: '', duration: 10 }]);
  };

  const removeActivityRow = (idx: number) => {
    setActivitiesList(activitiesList.filter((_, i) => i !== idx));
  };

  const updateActivityRow = (idx: number, field: 'name' | 'duration', value: any) => {
    const newList = [...activitiesList];
    if (field === 'name') {
      newList[idx].name = value;
    } else {
      newList[idx].duration = parseInt(value) || 0;
    }
    setActivitiesList(newList);
  };

  // Timetable helpers
  const DAYS = [2, 3, 4, 5, 6]; // Thứ 2 đến Thứ 6
  const PERIODS = [1, 2, 3, 4, 5]; // Tiết 1 đến Tiết 5

  const getSlotAt = (day: number, period: number) => {
    return timetable.find(s => s.dayOfWeek === day && s.period === period);
  };

  const startEditSlot = (day: number, period: number) => {
    const slot = getSlotAt(day, period);
    setEditingSlotId(`${day}_${period}`);
    setEditSubjectName(slot ? slot.subject : '');
  };

  const saveSlot = (day: number, period: number) => {
    const slot = getSlotAt(day, period);
    const updatedSlot: TimetableSlot = {
      id: slot?.id || `t_slot_${day}_${period}`,
      dayOfWeek: day,
      period,
      subject: editSubjectName.trim() || 'Trống'
    };
    onUpdateTimetableSlot(updatedSlot);
    setEditingSlotId(null);
  };

  return (
    <div id="lesson-planner-tab" className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">Quản Trị Giảng Dạy & Kế Hoạch Bài Giảng</h2>
          <p className="text-xs text-slate-500">Soạn giáo án thông minh, quản lý thời lượng hoạt động tương tác và thiết lập thời khóa biểu</p>
        </div>

        <button
          onClick={() => setIsNewPlanModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          SOẠN GIÁO ÁN MỚI
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Lesson Plans List and Active Plan Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Lesson Plan details */}
          {activePlanId ? (() => {
            const plan = lessonPlans.find(lp => lp.id === activePlanId);
            if (!plan) return null;

            const completedActivities = plan.activities.filter(act => act.isCompleted).length;
            const progressPercent = Math.round((completedActivities / plan.activities.length) * 100) || 0;

            return (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                  <div>
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                      {plan.subject}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-1">{plan.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      Ngày thực hiện: {plan.date} • Tổng lượng: {plan.duration} phút
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black border font-mono uppercase tracking-wider ${
                      plan.status === 'Đã hoàn thành' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      plan.status === 'Đang thực hiện' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {plan.status}
                    </span>
                    <button
                      onClick={() => handleExportPPTX(plan)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-700 block mt-2 font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1 justify-end ml-auto"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Xuất PPTX Slide
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Xóa giáo án này?')) {
                          onDeleteLessonPlan(plan.id);
                          setActivePlanId(null);
                        }
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-600 block mt-2 font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Xóa giáo án
                    </button>
                  </div>
                </div>

                {/* Objective */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-sans">Mục Tiêu Bài Học</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-200">{plan.objective}</p>
                </div>

                {/* Interactive checklist progress */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center text-xs">
                    <h4 className="font-bold text-slate-700">Tiến độ hoạt động ({completedActivities}/{plan.activities.length})</h4>
                    <span className="font-bold text-indigo-600 font-mono">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all duration-300 animate-pulse" style={{ width: `${progressPercent}%` }}></div>
                  </div>

                  {/* Checklist cards */}
                  <div className="space-y-2 mt-3">
                    {plan.activities.map((act) => (
                      <div
                        key={act.id}
                        onClick={() => toggleActivity(plan.id, act.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between hover:border-indigo-300 ${
                          act.isCompleted ? 'bg-slate-50/50 border-slate-200 opacity-70' : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {act.isCompleted ? (
                            <CheckSquare className="w-4.5 h-4.5 text-indigo-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-4.5 h-4.5 text-slate-300 flex-shrink-0" />
                          )}
                          <span className={`text-xs font-semibold ${act.isCompleted ? 'line-through text-slate-400 font-normal' : 'text-slate-800'}`}>
                            {act.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-bold font-mono uppercase tracking-wider">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {act.duration}P
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {plan.notes && (
                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <span className="font-bold text-amber-900 block mb-0.5">💡 Lưu ý chuyên môn giáo cụ:</span>
                    {plan.notes}
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-60 text-indigo-400 animate-bounce" />
              <p className="text-xs font-bold font-sans text-slate-600">Chọn một giáo án từ danh mục bên phải để xem chi tiết hoạt động.</p>
            </div>
          )}

          {/* Timetable/Schedule Manager */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-1">Thời Khóa Biểu Giảng Dạy Tuần</h3>
            <p className="text-xs text-slate-500 mb-4">Click vào từng tiết để điều chỉnh hoặc thay đổi chủ đề môn học trực quan</p>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border border-slate-200 min-w-[500px] rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-3 px-2 border-r border-slate-200">TIẾT</th>
                    <th className="py-3 px-2 border-r border-slate-200">THỨ 2</th>
                    <th className="py-3 px-2 border-r border-slate-200">THỨ 3</th>
                    <th className="py-3 px-2 border-r border-slate-200">THỨ 4</th>
                    <th className="py-3 px-2 border-r border-slate-200">THỨ 5</th>
                    <th className="py-3 px-2">THỨ 6</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
                  {PERIODS.map(period => (
                    <tr key={period} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-2.5 px-2 font-bold bg-slate-50/50 border-r border-slate-200 text-slate-500 font-mono text-[10px]">TIẾT {period}</td>
                      {DAYS.map(day => {
                        const slot = getSlotAt(day, period);
                        const isEditing = editingSlotId === `${day}_${period}`;

                        return (
                          <td key={day} className="py-2.5 px-2 border-r border-b border-slate-200">
                            {isEditing ? (
                              <div className="flex gap-1 items-center">
                                <input
                                  type="text"
                                  value={editSubjectName}
                                  onChange={(e) => setEditSubjectName(e.target.value)}
                                  className="w-full text-xs p-1 border border-slate-200 rounded bg-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  placeholder="Môn học..."
                                />
                                <button
                                  onClick={() => saveSlot(day, period)}
                                  className="bg-emerald-600 text-white px-2 py-1 rounded font-bold hover:bg-emerald-500 text-[9px] cursor-pointer font-mono uppercase tracking-wider"
                                >
                                  LƯU
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => startEditSlot(day, period)}
                                className={`p-1.5 rounded cursor-pointer transition-colors font-bold text-xs ${
                                  slot && slot.subject !== 'Trống'
                                    ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100'
                                    : 'hover:bg-slate-100 text-slate-400 font-normal'
                                }`}
                              >
                                {slot ? slot.subject : 'Trống'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Lesson plans catalog */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 font-sans tracking-tight">Danh Mục Giáo Án ({lessonPlans.length})</h3>
            
            <div className="space-y-2.5">
              {lessonPlans.map((lp) => {
                const isActive = activePlanId === lp.id;
                return (
                  <div
                    key={lp.id}
                    onClick={() => setActivePlanId(isActive ? null : lp.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50/25 ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                        {lp.subject}
                      </span>
                      <span className={`text-[9px] font-black border px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                        lp.status === 'Đã hoàn thành' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                        lp.status === 'Đang thực hiện' ? 'text-amber-700 bg-amber-50 border-amber-100' :
                        'text-slate-500 bg-slate-50 border-slate-200'
                      }`}>
                        {lp.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 mt-2 line-clamp-1">{lp.title}</h4>
                    <div className="flex justify-between items-center mt-2.5 text-[9px] text-slate-400 font-black font-mono uppercase tracking-wider">
                      <span>{lp.activities.length} HOẠT ĐỘNG</span>
                      <span>DỰ KIẾN: {lp.duration}P</span>
                    </div>
                  </div>
                );
              })}

              {lessonPlans.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6 italic">Chưa có kế hoạch bài giảng nào được lập.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Lesson Plan Modal */}
      {isNewPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 border-b border-slate-800">
              <h3 className="font-bold text-md font-sans tracking-tight">Lập Kế Hoạch Bài Giảng / Giáo Án Mới</h3>
              <p className="text-slate-300 text-[10px] font-mono mt-1">THIẾT LẬP CẤU TRÚC HOẠT ĐỘNG VÀ THỜI LƯỢNG GIẢNG DẠY</p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreatePlan} className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Tiêu Đề Bài Giảng *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Cộng trừ phân số nâng cao"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Môn Học
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Toán học">Toán học</option>
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Mục Tiêu Sư Phạm Bài Học *
                </label>
                <textarea
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  placeholder="e.g., Học sinh giải thành thạo các bài toán quy đồng mẫu số và áp dụng đố vui thực tế..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-medium"
                />
              </div>

              {/* Dynamic Activities checklist items */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Các hoạt động bài học & Phân bổ thời lượng (phút)
                  </label>
                  <button
                    type="button"
                    onClick={addActivityRow}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider cursor-pointer"
                  >
                    + THÊM HOẠT ĐỘNG
                  </button>
                </div>

                <div className="space-y-2 max-h-[140px] overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 scrollbar-thin">
                  {activitiesList.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={act.name}
                        onChange={(e) => updateActivityRow(idx, 'name', e.target.value)}
                        placeholder={`Hoạt động ${idx + 1}`}
                        className="flex-1 text-xs p-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                      <input
                        type="number"
                        value={act.duration}
                        onChange={(e) => updateActivityRow(idx, 'duration', e.target.value)}
                        className="w-16 text-xs p-1.5 bg-white border border-slate-200 rounded-md text-center font-mono font-bold"
                        title="Thời lượng"
                      />
                      <button
                        type="button"
                        onClick={() => removeActivityRow(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer border border-transparent hover:border-slate-100 rounded bg-white hover:bg-slate-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Ghi chú dụng cụ dạy học (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g., Chuẩn bị phiếu bài tập, máy chiếu, bảng màu nhóm"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewPlanModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  LƯU GIÁO ÁN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
