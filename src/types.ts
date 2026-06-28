export interface Student {
  id: string;
  studentId: string; // e.g., "HS001"
  name: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  parentName: string;
  parentPhone: string;
  email: string;
  avatarUrl?: string;
}

export interface Grade {
  studentId: string;
  oral: number[]; // Điểm miệng (hệ số 1)
  quiz15m: number[]; // Điểm 15 phút (hệ số 1)
  midterm: number[]; // Điểm giữa kỳ (hệ số 2)
  final: number[]; // Điểm cuối kỳ (hệ số 3)
}

export interface GradeWeights {
  oral: number;
  quiz15m: number;
  midterm: number;
  final: number;
}

export type ConductType = 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu';

export interface BehaviorLog {
  id: string;
  studentId: string;
  type: 'merit' | 'demerit'; // Điểm cộng (khen thưởng) hoặc điểm trừ (vi phạm)
  title: string; // e.g., "Hăng hái phát biểu", "Đi học muộn"
  points: number; // e.g., +10 or -5
  date: string;
  description?: string;
  badge?: string; // Optional badge name like "Chăm chỉ", "Kỷ luật", etc.
}

export interface Seat {
  row: number; // 0-based
  col: number; // 0-based
  studentId: string | null;
}

export interface LessonActivity {
  id: string;
  name: string;
  duration: number; // minutes
  isCompleted: boolean;
}

export interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  date: string;
  objective: string;
  duration: number; // total expected minutes
  activities: LessonActivity[];
  status: 'Chưa bắt đầu' | 'Đang thực hiện' | 'Đã hoàn thành';
  realDuration?: number; // actual minutes spent
  notes?: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 2 to 7 (Thứ 2 đến Thứ 7)
  period: number; // Tiết 1 đến Tiết 5
  subject: string;
  topic?: string;
}
