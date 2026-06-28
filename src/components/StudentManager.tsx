import React, { useState } from 'react';
import { Student, Grade, BehaviorLog } from '../types';
import { Search, Plus, Edit2, Trash2, Mail, Phone, Calendar, User, UserX, Check, AlertCircle, Database, FileSpreadsheet } from 'lucide-react';
import GoogleSheetsSync from './GoogleSheetsSync';

// Dynamic Loader for docx library
const loadDocx = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).docx) {
      resolve((window as any).docx);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/docx@8.2.4/build/index.umd.min.js';
    script.onload = () => {
      resolve((window as any).docx);
    };
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};

// Competency Bars Visualizer
const RenderCompetencyBars = ({ studentGrade, gpa }: { studentGrade: Grade; gpa: number }) => {
  const oralAvg = studentGrade.oral.length > 0 ? studentGrade.oral.reduce((a, b) => a + b, 0) / studentGrade.oral.length : 0;
  const quizAvg = studentGrade.quiz15m.length > 0 ? studentGrade.quiz15m.reduce((a, b) => a + b, 0) / studentGrade.quiz15m.length : 0;
  const midtermAvg = studentGrade.midterm.length > 0 ? studentGrade.midterm.reduce((a, b) => a + b, 0) / studentGrade.midterm.length : 0;
  const finalAvg = studentGrade.final.length > 0 ? studentGrade.final.reduce((a, b) => a + b, 0) / studentGrade.final.length : 0;

  const data = [
    { label: 'Điểm Miệng', val: oralAvg },
    { label: 'Điểm 15p', val: quizAvg },
    { label: 'Giữa Kỳ (x2)', val: midtermAvg },
    { label: 'Cuối Kỳ (x3)', val: finalAvg },
    { label: 'Cả Học Kỳ (GPA)', val: gpa, highlight: true },
  ];

  const getBarColor = (val: number, highlight?: boolean) => {
    if (highlight) return 'bg-indigo-600';
    if (val >= 8.0) return 'bg-emerald-500';
    if (val >= 6.5) return 'bg-sky-500';
    if (val >= 5.0) return 'bg-amber-500';
    if (val > 0) return 'bg-rose-500';
    return 'bg-slate-200';
  };

  return (
    <div className="space-y-2.5 pt-4 border-t border-slate-200">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
        Biểu Đồ Năng Lực Học Tập
      </h4>
      <div className="space-y-2 text-xs">
        {data.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-600">
              <span>{item.label}</span>
              <span className="font-bold font-mono">{item.val > 0 ? item.val.toFixed(1) : 'Chưa có'}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(item.val, item.highlight)}`}
                style={{ width: `${item.val > 0 ? item.val * 10 : 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface StudentManagerProps {
  students: Student[];
  grades: Grade[];
  behaviors: BehaviorLog[];
  onAddStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onSyncStudents: (syncedStudents: Student[], mode: 'overwrite' | 'merge') => void;
}

export default function StudentManager({
  students,
  grades,
  behaviors,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onSyncStudents,
}: StudentManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'Tất cả' | 'Nam' | 'Nữ'>('Tất cả');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const handleExportWord = async (student: Student) => {
    try {
      const docxLib = await loadDocx();
      if (!docxLib) {
        alert('Không thể tải thư viện Word Exporter. Vui lòng kiểm tra lại kết nối mạng.');
        return;
      }

      const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, Packer } = docxLib;

      // Calculate GPA and Behavior
      const g = grades.find(gr => gr.studentId === student.id) || { oral: [], quiz15m: [], midterm: [], final: [] };
      const oralAvg = g.oral.length > 0 ? g.oral.reduce((a,b)=>a+b,0)/g.oral.length : 0;
      const quizAvg = g.quiz15m.length > 0 ? g.quiz15m.reduce((a,b)=>a+b,0)/g.quiz15m.length : 0;
      const midtermAvg = g.midterm.length > 0 ? g.midterm.reduce((a,b)=>a+b,0)/g.midterm.length : 0;
      const finalAvg = g.final.length > 0 ? g.final.reduce((a,b)=>a+b,0)/g.final.length : 0;

      let scoreSum = 0;
      let weightSum = 0;
      if (g.oral.length > 0) { scoreSum += oralAvg * 1; weightSum += 1; }
      if (g.quiz15m.length > 0) { scoreSum += quizAvg * 1; weightSum += 1; }
      if (g.midterm.length > 0) { scoreSum += midtermAvg * 2; weightSum += 2; }
      if (g.final.length > 0) { scoreSum += finalAvg * 3; weightSum += 3; }
      const gpa = weightSum > 0 ? Number((scoreSum / weightSum).toFixed(2)) : 0;

      const studentBehaviors = behaviors.filter(b => b.studentId === student.id);
      const behaviorPoints = studentBehaviors.reduce((sum, b) => sum + b.points, 0);
      let conduct = 'Trung bình';
      if (behaviorPoints >= 30) conduct = 'Tốt';
      else if (behaviorPoints >= 10) conduct = 'Khá';
      else if (behaviorPoints >= -5) conduct = 'Trung bình';
      else conduct = 'Yếu';

      // Create Document
      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: "Arial",
                size: 24, // 12pt
              }
            }
          }
        },
        sections: [{
          properties: {},
          children: [
            // Header National Motto
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n", bold: true, size: 24 }),
                new TextRun({ text: "Độc lập - Tự do - Hạnh phúc\n", bold: true, size: 22 }),
                new TextRun({ text: "-----------------------", size: 22 }),
              ]
            }),
            new Paragraph({ spacing: { after: 160 } }),

            // Title
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "PHIẾU ĐÁNH GIÁ HỌC TẬP & RÈN LUYỆN\n", bold: true, size: 32, color: "1a365d" }),
                new TextRun({ text: "LỚP 9A1-SWIN • HỌC KỲ I • NĂM HỌC 2026-2027\n", bold: true, size: 22, color: "4a5568" }),
              ]
            }),
            new Paragraph({ spacing: { after: 240 } }),

            // Student Info Header
            new Paragraph({
              children: [
                new TextRun({ text: "I. THÔNG TIN HỌC SINH\n", bold: true, size: 26, color: "2b6cb0" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `• Họ và tên: `, bold: true }),
                new TextRun({ text: `${student.name}       ` }),
                new TextRun({ text: `• Mã học sinh: `, bold: true }),
                new TextRun({ text: `${student.studentId}\n` }),
                new TextRun({ text: `• Ngày sinh: `, bold: true }),
                new TextRun({ text: `${student.dob}       ` }),
                new TextRun({ text: `• Giới tính: `, bold: true }),
                new TextRun({ text: `${student.gender}\n` }),
                new TextRun({ text: `• Phụ huynh liên hệ: `, bold: true }),
                new TextRun({ text: `${student.parentName} (${student.parentPhone})\n` }),
                new TextRun({ text: `• Email học sinh: `, bold: true }),
                new TextRun({ text: `${student.email}\n` }),
              ]
            }),
            new Paragraph({ spacing: { after: 240 } }),

            // Grades Section
            new Paragraph({
              children: [
                new TextRun({ text: "II. KẾT QUẢ HỌC TẬP MÔN HỌC CHỦ CHỐT\n", bold: true, size: 26, color: "2b6cb0" })
              ]
            }),
            
            // Grades Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                // Header Row
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Điểm Miệng (x1)", alignment: AlignmentType.CENTER, style: { run: { bold: true } } })] }),
                    new TableCell({ children: [new Paragraph({ text: "Kiểm Tra 15p (x1)", alignment: AlignmentType.CENTER, style: { run: { bold: true } } })] }),
                    new TableCell({ children: [new Paragraph({ text: "Giữa Học Kỳ (x2)", alignment: AlignmentType.CENTER, style: { run: { bold: true } } })] }),
                    new TableCell({ children: [new Paragraph({ text: "Cuối Học Kỳ (x3)", alignment: AlignmentType.CENTER, style: { run: { bold: true } } })] }),
                    new TableCell({ children: [new Paragraph({ text: "Điểm GPA học kỳ", alignment: AlignmentType.CENTER, style: { run: { bold: true } } })] }),
                  ]
                }),
                // Values Row
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: g.oral.join(', ') || '-', alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: g.quiz15m.join(', ') || '-', alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: g.midterm.join(', ') || '-', alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: g.final.join(', ') || '-', alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: gpa > 0 ? gpa.toString() : '-', alignment: AlignmentType.CENTER, style: { run: { bold: true, color: "2b6cb0" } } })] }),
                  ]
                })
              ]
            }),
            new Paragraph({ spacing: { after: 240 } }),

            // Conduct Section
            new Paragraph({
              children: [
                new TextRun({ text: "III. KẾT QUẢ RÈN LUYỆN THI ĐUA HÀNH VI\n", bold: true, size: 26, color: "2b6cb0" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `• Tổng số điểm thi đua rèn luyện: `, bold: true }),
                new TextRun({ text: `${behaviorPoints} điểm (${studentBehaviors.filter(b=>b.type==='merit').length} cộng, ${studentBehaviors.filter(b=>b.type==='demerit').length} phạt)\n` }),
                new TextRun({ text: `• Xếp loại rèn luyện hạnh kiểm: `, bold: true }),
                new TextRun({ text: `${conduct}\n`, bold: true, color: conduct === 'Tốt' ? '38a169' : conduct === 'Khá' ? '3182ce' : 'd69e2e' }),
              ]
            }),
            new Paragraph({ spacing: { after: 240 } }),

            // Remarks Section
            new Paragraph({
              children: [
                new TextRun({ text: "IV. NHẬN XÉT CỦA GIÁO VIÊN CHỦ NHIỆM\n", bold: true, size: 26, color: "2b6cb0" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Em ${student.name} có điểm GPA học kỳ đạt `, italics: true }),
                new TextRun({ text: `${gpa > 0 ? gpa : 'chưa đánh giá'}`, bold: true, italics: true }),
                new TextRun({ text: ` và xếp loại hạnh kiểm `, italics: true }),
                new TextRun({ text: `${conduct}`, bold: true, italics: true }),
                new TextRun({ text: `. Trong quá trình rèn luyện trên lớp, em luôn nỗ lực đạt kết quả tốt nhất, có tinh thần tương tác tập thể cao. Cần phát huy hơn nữa ở học kỳ tiếp theo.\n\n`, italics: true }),
                new TextRun({ text: `Ý kiến khác của GVCN:\n_________________________________________________________________________________\n_________________________________________________________________________________` })
              ]
            }),
            new Paragraph({ spacing: { after: 320 } }),

            // Footer Signature
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({ text: "PHỤ HUYNH HỌC SINH\n", bold: true, size: 20 }),
                            new TextRun({ text: "(Ký và ghi rõ họ tên)\n\n\n\n", size: 16, italics: true }),
                          ]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({ text: "GIÁO VIÊN CHỦ NHIỆM\n", bold: true, size: 20 }),
                            new TextRun({ text: "(Ký và ghi rõ họ tên)\n\n\n\n", size: 16, italics: true }),
                          ]
                        })
                      ]
                    }),
                  ]
                })
              ]
            })
          ]
        }]
      });

      // Save File
      Packer.toBlob(doc).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Phieu_Bao_Diem_9A1_${student.studentId}_${student.name.replace(/\s+/g, '_')}.docx`;
        a.click();
        URL.revokeObjectURL(url);
      });

    } catch (err: any) {
      console.error(err);
      alert('Gặp lỗi khi xuất tệp Word: ' + err.message);
    }
  };

  // Form State
  const [formId, setFormId] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [formDob, setFormDob] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formError, setFormError] = useState('');

  // Handle opening Add Modal
  const openAddModal = () => {
    setModalMode('add');
    const nextId = students.length > 0 
      ? `HS${String(Math.max(...students.map(s => parseInt(s.studentId.replace('HS', '')) || 0)) + 1).padStart(3, '0')}`
      : 'HS001';
    setFormId(nextId);
    setFormStudentId(nextId);
    setFormName('');
    setFormGender('Nam');
    setFormDob('2012-01-01');
    setFormParentName('');
    setFormParentPhone('');
    setFormEmail('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle opening Edit Modal
  const openEditModal = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting/opening profile drawer
    setModalMode('edit');
    setFormId(student.id);
    setFormStudentId(student.studentId);
    setFormName(student.name);
    setFormGender(student.gender);
    setFormDob(student.dob);
    setFormParentName(student.parentName);
    setFormParentPhone(student.parentPhone);
    setFormEmail(student.email);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formParentName.trim() || !formParentPhone.trim()) {
      setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
      return;
    }

    // Basic email validation if entered
    if (formEmail && !formEmail.includes('@')) {
      setFormError('Định dạng email của học sinh không hợp lệ.');
      return;
    }

    const studentData: Student = {
      id: formId,
      studentId: formStudentId,
      name: formName.trim(),
      gender: formGender,
      dob: formDob,
      parentName: formParentName.trim(),
      parentPhone: formParentPhone.trim(),
      email: formEmail.trim() || `${formStudentId.toLowerCase()}@school.edu.vn`,
    };

    if (modalMode === 'add') {
      // Check duplicate studentId
      if (students.some(s => s.studentId === formStudentId)) {
        setFormError('Mã học sinh này đã tồn tại trong hệ thống.');
        return;
      }
      onAddStudent(studentData);
    } else {
      onEditStudent(studentData);
    }

    setIsModalOpen(false);
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'Tất cả' || s.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Calculate stats for a single student for the detail card
  const getStudentStats = (studentId: string) => {
    const studentBehaviors = behaviors.filter(b => b.studentId === studentId);
    const meritCount = studentBehaviors.filter(b => b.type === 'merit').length;
    const demeritCount = studentBehaviors.filter(b => b.type === 'demerit').length;
    const behaviorPoints = studentBehaviors.reduce((sum, b) => sum + b.points, 0);

    return {
      merits: meritCount,
      demerits: demeritCount,
      behaviorPoints,
    };
  };

  return (
    <div id="students-tab" className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Số Hóa Danh Sách Học Sinh</h2>
          <p className="text-xs text-slate-500">Quản lý hồ sơ định danh, thông tin liên lạc phụ huynh và cập nhật tiến trình</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 justify-center cursor-pointer"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            ĐỒNG BỘ GOOGLE SHEETS
          </button>

          <button
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            THÊM HỌC SINH MỚI
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên học sinh, mã số HS, hoặc tên phụ huynh..."
            className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-sans"
          />
        </div>

        {/* Gender Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50">
          {(['Tất cả', 'Nam', 'Nữ'] as const).map((gender) => (
            <button
              key={gender}
              onClick={() => setGenderFilter(gender)}
              className={`px-4 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                genderFilter === gender
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Student List & Selected Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Cards Grid (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredStudents.map((s) => {
              const stats = getStudentStats(s.id);
              const isSelected = selectedStudent?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudent(isSelected ? null : s)}
                  className={`p-4 bg-white rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-50/50 shadow-md'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          s.gender === 'Nam' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-pink-50 text-pink-600 border border-pink-100'
                        }`}>
                          {s.name.split(' ').pop()?.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 truncate max-w-[130px]">{s.name}</h4>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {s.studentId}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons on card */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => openEditModal(s, e)}
                          className="p-1.5 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Bạn có chắc chắn muốn xóa học sinh ${s.name} khỏi hệ thống?`)) {
                              onDeleteStudent(s.id);
                              if (selectedStudent?.id === s.id) setSelectedStudent(null);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 rounded border border-transparent hover:border-rose-200 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>NS: {s.dob} • Giới tính: {s.gender}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">PH: {s.parentName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges and performance summary */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thi đua lớp:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                        +{stats.merits} cộng
                      </span>
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-100">
                        -{stats.demerits} phạt
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        stats.behaviorPoints >= 0 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {stats.behaviorPoints > 0 ? `+${stats.behaviorPoints}` : stats.behaviorPoints}đ
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="col-span-2 bg-slate-50 p-8 rounded-xl text-center border border-dashed border-slate-200">
                <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-semibold text-slate-700">Không tìm thấy học sinh nào</h4>
                <p className="text-xs text-slate-400 mt-1">Vui lòng thử từ khóa tìm kiếm hoặc lọc giới tính khác.</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Student Detail Card (Right Column) */}
        <div className="lg:col-span-1">
          {selectedStudent ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 space-y-5 sticky top-6">
              <div className="text-center pb-4 border-b border-slate-200">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-3 border ${
                  selectedStudent.gender === 'Nam' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-pink-50 text-pink-700 border-pink-100'
                }`}>
                  {selectedStudent.name.split(' ').pop()?.substring(0, 2)}
                </div>
                <h3 className="font-bold text-lg text-slate-900">{selectedStudent.name}</h3>
                <span className="text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                  ID: {selectedStudent.studentId}
                </span>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Hồ Sơ Định Danh Chi Tiết</h4>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngày sinh:</span>
                    <span className="font-semibold font-mono">{selectedStudent.dob}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giới tính:</span>
                    <span className="font-semibold">{selectedStudent.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phụ huynh liên hệ:</span>
                    <span className="font-semibold">{selectedStudent.parentName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">SĐT phụ huynh:</span>
                    <span className="font-semibold font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-indigo-500" />
                      {selectedStudent.parentPhone}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Email trường cấp:</span>
                    <span className="font-semibold font-mono flex items-center gap-1 truncate max-w-[160px]" title={selectedStudent.email}>
                      <Mail className="w-3 h-3 text-indigo-500" />
                      {selectedStudent.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Competency Bars Chart */}
              {(() => {
                const sGrade = grades.find(g => g.studentId === selectedStudent.id) || { oral: [], quiz15m: [], midterm: [], final: [] };
                const oAvg = sGrade.oral.length > 0 ? sGrade.oral.reduce((a,b)=>a+b,0)/sGrade.oral.length : 0;
                const qAvg = sGrade.quiz15m.length > 0 ? sGrade.quiz15m.reduce((a,b)=>a+b,0)/sGrade.quiz15m.length : 0;
                const mAvg = sGrade.midterm.length > 0 ? sGrade.midterm.reduce((a,b)=>a+b,0)/sGrade.midterm.length : 0;
                const fAvg = sGrade.final.length > 0 ? sGrade.final.reduce((a,b)=>a+b,0)/sGrade.final.length : 0;

                let scoreSum = 0;
                let weightSum = 0;
                if (sGrade.oral.length > 0) { scoreSum += oAvg * 1; weightSum += 1; }
                if (sGrade.quiz15m.length > 0) { scoreSum += qAvg * 1; weightSum += 1; }
                if (sGrade.midterm.length > 0) { scoreSum += mAvg * 2; weightSum += 2; }
                if (sGrade.final.length > 0) { scoreSum += fAvg * 3; weightSum += 3; }
                const gpa = weightSum > 0 ? Number((scoreSum / weightSum).toFixed(2)) : 0;

                return (
                  <RenderCompetencyBars
                    studentGrade={sGrade}
                    gpa={gpa}
                  />
                );
              })()}

              {/* Behavior Log Summary */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
                  Nhật Ký Thi Đua Học Đường
                </h4>
                <div className="space-y-2">
                  {behaviors.filter(b => b.studentId === selectedStudent.id).slice(0, 3).map((log) => (
                    <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800">{log.title}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{log.date}</p>
                      </div>
                      <span className={`font-bold font-mono text-xs ${
                        log.type === 'merit' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {log.points > 0 ? `+${log.points}` : log.points}
                      </span>
                    </div>
                  ))}
                  {behaviors.filter(b => b.studentId === selectedStudent.id).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2 italic">Học sinh chưa có vi phạm hoặc khen thưởng nào.</p>
                  )}
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => handleExportWord(selectedStudent)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  XUẤT PHIẾU BÁO ĐIỂM (WORD)
                </button>

                <button
                  onClick={() => setSelectedStudent(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  ĐÓNG CHI TIẾT
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 sticky top-6">
              <User className="w-10 h-10 mx-auto mb-3 opacity-60" />
              <p className="text-xs font-semibold leading-relaxed">Chọn một học sinh từ danh sách để kiểm tra hồ sơ liên hệ, điểm rèn luyện & tiến độ học tập chi tiết.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 border-b border-slate-800">
              <h3 className="font-bold text-lg font-sans tracking-tight">
                {modalMode === 'add' ? 'Thêm Học Sinh Mới Vào Lớp' : 'Cập Nhật Thông Tin Học Sinh'}
              </h3>
              <p className="text-slate-300 text-[10px] font-mono mt-1">LƯU TRỮ TỰ ĐỘNG CHUẨN CƠ SỞ DỮ LIỆU</p>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Mã Học Sinh *
                  </label>
                  <input
                    type="text"
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value.toUpperCase())}
                    disabled={modalMode === 'edit'}
                    placeholder="e.g., HS013"
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Họ và Tên *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Nguyễn Đức Toàn"
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Giới Tính
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'Nam' | 'Nữ')}
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Ngày Sinh *
                  </label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3">Thông Tin Liên Hệ Phụ Huynh</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Tên Phụ Huynh *
                    </label>
                    <input
                      type="text"
                      value={formParentName}
                      onChange={(e) => setFormParentName(e.target.value)}
                      placeholder="e.g., Nguyễn Văn A"
                      className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Số Điện Thoại PH *
                    </label>
                    <input
                      type="text"
                      value={formParentPhone}
                      onChange={(e) => setFormParentPhone(e.target.value)}
                      placeholder="e.g., 0901234567"
                      className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Email Học Sinh (Tùy chọn)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g., toan.nd@school.edu.vn"
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {modalMode === 'add' ? 'THÊM MỚI' : 'LƯU THAY ĐỔI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsSync
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        currentStudents={students}
        onSyncComplete={onSyncStudents}
      />
    </div>
  );
}
