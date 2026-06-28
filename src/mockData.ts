import { Student, Grade, GradeWeights, BehaviorLog, Seat, LessonPlan, TimetableSlot } from './types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'HS001',
    studentId: 'HS001',
    name: 'Nguyễn Minh Triết',
    gender: 'Nam',
    dob: '2012-05-15',
    parentName: 'Nguyễn Minh Tuấn',
    parentPhone: '0901234567',
    email: 'triet.nm@school.edu.vn',
  },
  {
    id: 'HS002',
    studentId: 'HS002',
    name: 'Lê Thị Mai Anh',
    gender: 'Nữ',
    dob: '2012-09-20',
    parentName: 'Lê Văn Tám',
    parentPhone: '0912345678',
    email: 'anh.ltm@school.edu.vn',
  },
  {
    id: 'HS003',
    studentId: 'HS003',
    name: 'Trần Hoàng Nam',
    gender: 'Nam',
    dob: '2012-02-10',
    parentName: 'Trần Hoàng Long',
    parentPhone: '0987654321',
    email: 'nam.th@school.edu.vn',
  },
  {
    id: 'HS004',
    studentId: 'HS004',
    name: 'Phạm Thanh Thảo',
    gender: 'Nữ',
    dob: '2012-11-05',
    parentName: 'Phạm Văn Hùng',
    parentPhone: '0923456789',
    email: 'thao.pt@school.edu.vn',
  },
  {
    id: 'HS005',
    studentId: 'HS005',
    name: 'Đỗ Văn Hùng',
    gender: 'Nam',
    dob: '2012-07-25',
    parentName: 'Đỗ Văn Dũng',
    parentPhone: '0934567890',
    email: 'hung.dv@school.edu.vn',
  },
  {
    id: 'HS006',
    studentId: 'HS006',
    name: 'Ngô Mỹ Linh',
    gender: 'Nữ',
    dob: '2012-03-30',
    parentName: 'Ngô Xuân Sơn',
    parentPhone: '0945678901',
    email: 'linh.nm@school.edu.vn',
  },
  {
    id: 'HS007',
    studentId: 'HS007',
    name: 'Vũ Minh Quân',
    gender: 'Nam',
    dob: '2012-12-12',
    parentName: 'Vũ Quốc Khánh',
    parentPhone: '0956789012',
    email: 'quan.vm@school.edu.vn',
  },
  {
    id: 'HS008',
    studentId: 'HS008',
    name: 'Hoàng Thu Trang',
    gender: 'Nữ',
    dob: '2012-08-18',
    parentName: 'Hoàng Văn Minh',
    parentPhone: '0967890123',
    email: 'trang.ht@school.edu.vn',
  },
  {
    id: 'HS009',
    studentId: 'HS009',
    name: 'Phan Bảo Lâm',
    gender: 'Nam',
    dob: '2012-04-05',
    parentName: 'Phan Thanh Hải',
    parentPhone: '0978901234',
    email: 'lam.pb@school.edu.vn',
  },
  {
    id: 'HS010',
    studentId: 'HS010',
    name: 'Đặng Hồng Nhung',
    gender: 'Nữ',
    dob: '2012-10-14',
    parentName: 'Đặng Văn Tiến',
    parentPhone: '0989012345',
    email: 'nhung.dh@school.edu.vn',
  },
  {
    id: 'HS011',
    studentId: 'HS011',
    name: 'Bùi Quốc Anh',
    gender: 'Nam',
    dob: '2012-01-22',
    parentName: 'Bùi Tiến Dũng',
    parentPhone: '0990123456',
    email: 'anh.bq@school.edu.vn',
  },
  {
    id: 'HS012',
    studentId: 'HS012',
    name: 'Trịnh Gia Huy',
    gender: 'Nam',
    dob: '2012-06-08',
    parentName: 'Trịnh Quốc Bảo',
    parentPhone: '0321456789',
    email: 'huy.tg@school.edu.vn',
  }
];

export const INITIAL_GRADES: Grade[] = [
  { studentId: 'HS001', oral: [9, 10], quiz15m: [8, 9], midterm: [9.5], final: [9.0] },
  { studentId: 'HS002', oral: [8, 9], quiz15m: [9, 8.5], midterm: [8.5], final: [8.5] },
  { studentId: 'HS003', oral: [7, 6], quiz15m: [8, 7], midterm: [6.5], final: [7.0] },
  { studentId: 'HS004', oral: [8, 8], quiz15m: [7.5, 8], midterm: [8.0], final: [7.5] },
  { studentId: 'HS005', oral: [5, 6], quiz15m: [5, 5.5], midterm: [6.0], final: [5.0] },
  { studentId: 'HS006', oral: [10, 10], quiz15m: [9.5, 10], midterm: [10], final: [9.5] },
  { studentId: 'HS007', oral: [8, 7], quiz15m: [7, 7.5], midterm: [8.0], final: [8.5] },
  { studentId: 'HS008', oral: [8, 9], quiz15m: [8, 8], midterm: [7.5], final: [8.0] },
  { studentId: 'HS009', oral: [4, 5], quiz15m: [4, 4.5], midterm: [5.0], final: [4.5] },
  { studentId: 'HS010', oral: [9, 8], quiz15m: [8.5, 9], midterm: [8.0], final: [8.5] },
  { studentId: 'HS011', oral: [7, 8], quiz15m: [6.5, 7], midterm: [7.5], final: [7.0] },
  { studentId: 'HS012', oral: [8, 9], quiz15m: [7, 8.5], midterm: [8.0], final: [8.0] }
];

export const DEFAULT_WEIGHTS: GradeWeights = {
  oral: 1,
  quiz15m: 1,
  midterm: 2,
  final: 3
};

export const INITIAL_BEHAVIORS: BehaviorLog[] = [
  { id: 'b1', studentId: 'HS001', type: 'merit', title: 'Hăng hái phát biểu xây dựng bài', points: 10, date: '2026-06-25', description: 'Phát biểu 3 lần trong tiết Toán', badge: 'Chăm chỉ' },
  { id: 'b2', studentId: 'HS001', type: 'merit', title: 'Giúp đỡ bạn học tập', points: 15, date: '2026-06-26', description: 'Hướng dẫn bạn Lâm làm bài tập nhóm', badge: 'Đồng đội' },
  { id: 'b3', studentId: 'HS003', type: 'demerit', title: 'Nói chuyện riêng trong giờ học', points: -5, date: '2026-06-24', description: 'Nói chuyện tự do trong tiết Văn' },
  { id: 'b4', studentId: 'HS005', type: 'demerit', title: 'Thiếu bài tập về nhà', points: -10, date: '2026-06-25', description: 'Không hoàn thành bài tập hình học số 3' },
  { id: 'b5', studentId: 'HS002', type: 'merit', title: 'Trực nhật lớp sạch sẽ', points: 10, date: '2026-06-26', description: 'Làm nhiệm vụ trực nhật xuất sắc', badge: 'Trách nhiệm' },
  { id: 'b6', studentId: 'HS006', type: 'merit', title: 'Đạt điểm tối đa kiểm tra giữa kỳ', points: 20, date: '2026-06-23', description: 'Đạt điểm 10 tuyệt đối môn Vật lý', badge: 'Học thuật' },
  { id: 'b7', studentId: 'HS009', type: 'merit', title: 'Có sự tiến bộ vượt bậc', points: 15, date: '2026-06-26', description: 'Rất cố gắng phát biểu và làm đúng bài kiểm tra 15p', badge: 'Nỗ lực' },
  { id: 'b8', studentId: 'HS011', type: 'demerit', title: 'Đi học muộn', points: -5, date: '2026-06-27', description: 'Trễ giờ sinh hoạt đầu tuần 10 phút' }
];

export const INITIAL_SEATS: Seat[] = [
  // Hàng 1 (Gần bảng) - Trái sang Phải
  { row: 0, col: 0, studentId: 'HS009' }, // Phan Bảo Lâm (Cần kèm cặp)
  { row: 0, col: 1, studentId: 'HS001' }, // Nguyễn Minh Triết (Bạn học giỏi kèm Lâm)
  { row: 0, col: 2, studentId: null },
  { row: 0, col: 3, studentId: 'HS002' }, // Lê Thị Mai Anh
  { row: 0, col: 4, studentId: 'HS010' }, // Đặng Hồng Nhung

  // Hàng 2
  { row: 1, col: 0, studentId: 'HS005' }, // Đỗ Văn Hùng
  { row: 1, col: 1, studentId: 'HS006' }, // Ngô Mỹ Linh
  { row: 1, col: 2, studentId: null },
  { row: 1, col: 3, studentId: 'HS004' }, // Phạm Thanh Thảo
  { row: 1, col: 4, studentId: 'HS007' }, // Vũ Minh Quân

  // Hàng 3
  { row: 2, col: 0, studentId: 'HS003' }, // Trần Hoàng Nam
  { row: 2, col: 1, studentId: 'HS012' }, // Trịnh Gia Huy (Hai bạn hay nói chuyện, ngồi cùng)
  { row: 2, col: 2, studentId: null },
  { row: 2, col: 3, studentId: 'HS008' }, // Hoàng Thu Trang
  { row: 2, col: 4, studentId: 'HS011' }  // Bùi Quốc Anh
];

export const INITIAL_LESSON_PLANS: LessonPlan[] = [
  {
    id: 'LP001',
    title: 'Phép Nhân Phân Số - Toán Lớp 6',
    subject: 'Toán học',
    date: '2026-06-29',
    objective: 'Học sinh nắm vững quy tắc nhân hai phân số, giải thành thạo bài toán có lời văn và áp dụng thực tế chia tài nguyên.',
    duration: 45,
    status: 'Chưa bắt đầu',
    activities: [
      { id: 'act1', name: 'Khởi động: Trò chơi ghép mảnh tính nhẩm nhanh', duration: 10, isCompleted: false },
      { id: 'act2', name: 'Khám phá kiến thức mới: Hình thành quy tắc nhân hai phân số thông qua trực quan diện tích', duration: 15, isCompleted: false },
      { id: 'act3', name: 'Luyện tập nhóm: Làm bài tập 1, 2 trang 85 SGK', duration: 15, isCompleted: false },
      { id: 'act4', name: 'Vận dụng: Giải đố phân chia bánh chưng ngày tết và tổng kết dặn dò', duration: 5, isCompleted: false }
    ],
    notes: 'Chuẩn bị giáo cụ trực quan là các mô hình giấy chia tỉ lệ.'
  },
  {
    id: 'LP002',
    title: 'Đại từ nhân xưng - Tiếng Anh Unit 4',
    subject: 'Tiếng Anh',
    date: '2026-06-30',
    objective: 'Hiểu và áp dụng đúng các đại từ nhân xưng (Subject/Object Pronouns) trong hội thoại ngắn hằng ngày.',
    duration: 45,
    status: 'Chưa bắt đầu',
    activities: [
      { id: 'act2_1', name: 'Kiểm tra từ vựng cũ bằng Quizizz sôi động', duration: 10, isCompleted: false },
      { id: 'act2_2', name: 'Giảng dạy: Phân biệt Subject pronouns và Object pronouns', duration: 15, isCompleted: false },
      { id: 'act2_3', name: 'Hoạt động nhập vai đóng kịch mua sắm theo cặp', duration: 15, isCompleted: false },
      { id: 'act2_4', name: 'Viết thiệp ngắn gửi bạn bè áp dụng đúng pronoun', duration: 5, isCompleted: false }
    ]
  }
];

export const INITIAL_TIMETABLE: TimetableSlot[] = [
  // Thứ 2
  { id: 't1', dayOfWeek: 2, period: 1, subject: 'Chào cờ' },
  { id: 't2', dayOfWeek: 2, period: 2, subject: 'Toán học' },
  { id: 't3', dayOfWeek: 2, period: 3, subject: 'Ngữ văn' },
  { id: 't4', dayOfWeek: 2, period: 4, subject: 'Tiếng Anh' },
  { id: 't5', dayOfWeek: 2, period: 5, subject: 'Sinh hoạt lớp' },

  // Thứ 3
  { id: 't6', dayOfWeek: 3, period: 1, subject: 'Vật lý' },
  { id: 't7', dayOfWeek: 3, period: 2, subject: 'Hóa học' },
  { id: 't8', dayOfWeek: 3, period: 3, subject: 'Toán học' },
  { id: 't9', dayOfWeek: 3, period: 4, subject: 'Thể dục' },

  // Thứ 4
  { id: 't10', dayOfWeek: 4, period: 1, subject: 'Lịch sử' },
  { id: 't11', dayOfWeek: 4, period: 2, subject: 'Địa lý' },
  { id: 't12', dayOfWeek: 4, period: 3, subject: 'Ngữ văn' },
  { id: 't13', dayOfWeek: 4, period: 4, subject: 'Tiếng Anh' },

  // Thứ 5
  { id: 't14', dayOfWeek: 5, period: 1, subject: 'Toán học' },
  { id: 't15', dayOfWeek: 5, period: 2, subject: 'Vật lý' },
  { id: 't16', dayOfWeek: 5, period: 3, subject: 'Tin học' },
  { id: 't17', dayOfWeek: 5, period: 4, subject: 'Sinh học' },

  // Thứ 6
  { id: 't18', dayOfWeek: 6, period: 1, subject: 'Ngữ văn' },
  { id: 't19', dayOfWeek: 6, period: 2, subject: 'Hóa học' },
  { id: 't20', dayOfWeek: 6, period: 3, subject: 'Âm nhạc' },
  { id: 't21', dayOfWeek: 6, period: 4, subject: 'Công nghệ' }
];
