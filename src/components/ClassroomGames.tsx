import React, { useState, useRef, useEffect } from 'react';
import { Student, BehaviorLog } from '../types';
import { Award, RefreshCw, Volume2, VolumeX, Sparkles, User, Gift, ThumbsUp, ThumbsDown } from 'lucide-react';

interface ClassroomGamesProps {
  students: Student[];
  onAddBehavior: (log: BehaviorLog) => void;
}

export default function ClassroomGames({ students, onAddBehavior }: ClassroomGamesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [awardMessage, setAwardMessage] = useState('');
  
  // Animation ref
  const animationRef = useRef<number | null>(null);
  
  // Angle states
  const angleRef = useRef(0);
  const velocityRef = useRef(0);

  // Play tick sound using Web Audio API
  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {
      // browser blocks audio or not supported
    }
  };

  // Play win sound using Web Audio API
  const playWinSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Play a short arpeggio
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
        
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.25);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.25);
      });
    } catch (e) {
      // ignore
    }
  };

  // Draw the Wheel
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas || students.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 15;

    ctx.clearRect(0, 0, width, height);

    const arcSize = (2 * Math.PI) / students.length;
    
    // Color Palette
    const colors = [
      '#4f46e5', // indigo-600
      '#0ea5e9', // sky-500
      '#10b981', // emerald-500
      '#f59e0b', // amber-500
      '#ef4444', // rose-500
      '#8b5cf6', // violet-500
      '#ec4899', // pink-500
      '#14b8a6', // teal-500
    ];

    students.forEach((s, idx) => {
      const angle = angleRef.current + idx * arcSize;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle, angle + arcSize);
      ctx.closePath();
      
      ctx.fillStyle = colors[idx % colors.length];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      
      // Get short name (last word)
      const parts = s.name.trim().split(' ');
      const displayName = parts.length > 1 ? `${parts[parts.length - 2]} ${parts[parts.length - 1]}` : s.name;
      
      ctx.fillText(displayName, radius - 15, 0);
      ctx.restore();
    });

    // Draw central hub
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Text in hub
    ctx.fillStyle = '#facc15'; // yellow-400
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px font-sans';
    ctx.fillText('9A1-SWIN', cx, cy);

    // Draw Outer border ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel();
    // Cleanup animation on unmount
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [students]);

  // Handle spin button
  const startSpin = () => {
    if (isSpinning || students.length === 0) return;
    
    setIsSpinning(true);
    setSelectedStudent(null);
    setAwardMessage('');

    // Physics constants
    velocityRef.current = 0.25 + Math.random() * 0.25; // Initial spin speed (radians per frame)
    const friction = 0.982 + Math.random() * 0.005; // High-precision friction index
    
    let lastTickAngle = angleRef.current;
    const arcSize = (2 * Math.PI) / students.length;

    const animate = () => {
      // Update angle
      angleRef.current += velocityRef.current;
      velocityRef.current *= friction;

      // Play tick sound when crossing a sector boundary
      const currentCrossedSector = Math.floor(angleRef.current / arcSize);
      const lastCrossedSector = Math.floor(lastTickAngle / arcSize);
      if (currentCrossedSector !== lastCrossedSector) {
        playTickSound();
        lastTickAngle = angleRef.current;
      }

      drawWheel();

      // Check if spin finished
      if (velocityRef.current < 0.0012) {
        setIsSpinning(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }

        // Calculate Winner
        // Top arrow is at 270 deg (1.5 * Math.PI)
        const normalizedAngle = (1.5 * Math.PI - angleRef.current) % (2 * Math.PI);
        const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle;
        const winnerIndex = Math.floor(positiveAngle / arcSize) % students.length;
        
        const winner = students[winnerIndex];
        setSelectedStudent(winner);
        playWinSound();
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Quick rewards
  const handleReward = (type: 'merit' | 'demerit', points: number, title: string) => {
    if (!selectedStudent) return;

    const newLog: BehaviorLog = {
      id: `BH${Date.now()}`,
      studentId: selectedStudent.id,
      type,
      title,
      points: type === 'merit' ? points : -points,
      date: new Date().toISOString().split('T')[0],
      description: 'Ghi nhận trực tiếp từ Vòng Quay May Mắn',
      badge: type === 'merit' ? 'Hăng hái' : 'Nhắc nhở',
    };

    onAddBehavior(newLog);
    setAwardMessage(
      `Đã ${type === 'merit' ? 'cộng' : 'trừ'} ${points} điểm cho ${selectedStudent.name} với lý do: "${title}"!`
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Wheel Panel (Left 2 cols) */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-between min-h-[500px]">
        <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              Vòng Quay Ngẫu Nhiên Lớp Học
            </h3>
            <p className="text-[11px] text-slate-500">Quay số gọi tên phát biểu bài và thưởng điểm rèn luyện thi đua</p>
          </div>
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              soundEnabled 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Canvas & Pointer container */}
        <div className="relative my-6 flex items-center justify-center">
          {/* Wheel Pointer Arrow */}
          <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[20px] border-t-rose-600 drop-shadow-md"></div>
          
          {/* Circular glow background */}
          <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-xl scale-95 pointer-events-none"></div>

          <canvas
            ref={canvasRef}
            width={380}
            height={380}
            className="max-w-full aspect-square block bg-transparent"
          />
        </div>

        <button
          onClick={startSpin}
          disabled={isSpinning || students.length === 0}
          className={`w-full max-w-sm py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isSpinning || students.length === 0
              ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-lg active:scale-[0.98]'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
          {isSpinning ? 'ĐANG QUAY...' : 'QUAY NGAY'}
        </button>
      </div>

      {/* Result Panel (Right 1 col) */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Selected Profile card */}
        {selectedStudent ? (
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-xl shadow-lg border border-slate-800 p-6 space-y-5 flex flex-col justify-between min-h-[350px] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center space-y-3">
              <div className="p-1.5 bg-indigo-500/20 rounded-md border border-indigo-500/20 uppercase tracking-widest text-[9px] font-mono text-indigo-300 font-bold inline-block">
                HỌC SINH ĐÃ CHỌN
              </div>

              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold border-2 border-indigo-400 shadow-md ${
                selectedStudent.gender === 'Nam' ? 'bg-blue-500/10 text-blue-300' : 'bg-pink-500/10 text-pink-300'
              }`}>
                {selectedStudent.name.split(' ').pop()?.substring(0, 2)}
              </div>

              <div>
                <h3 className="text-lg font-bold tracking-tight text-white">{selectedStudent.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">Mã HS: {selectedStudent.studentId} • Giới tính: {selectedStudent.gender}</p>
              </div>
            </div>

            {/* Quick Reward Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Ghi nhận điểm thi đua rèn luyện</p>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleReward('merit', 5, 'Phát biểu xây dựng bài')}
                  className="bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-900/40 hover:border-emerald-600 rounded-lg p-2.5 text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
                >
                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                  <span>+5đ Phát biểu</span>
                </button>

                <button
                  onClick={() => handleReward('merit', 10, 'Trả lời bài xuất sắc')}
                  className="bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-800/40 hover:border-indigo-500 rounded-lg p-2.5 text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-indigo-400" />
                  <span>+10đ Xuất sắc</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleReward('demerit', 5, 'Mất tập trung trong lớp')}
                  className="bg-amber-950/20 hover:bg-amber-900/40 text-amber-200 border border-amber-900/20 hover:border-amber-600 rounded-lg p-2.5 text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
                >
                  <ThumbsDown className="w-4 h-4 text-amber-400" />
                  <span>-5đ Mất tập trung</span>
                </button>

                <button
                  onClick={() => handleReward('demerit', 10, 'Không làm bài tập cũ')}
                  className="bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-900/30 hover:border-rose-600 rounded-lg p-2.5 text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-rose-400" />
                  <span>-10đ Thiếu bài</span>
                </button>
              </div>
            </div>

            {awardMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold text-center mt-2 animate-in fade-in duration-200">
                {awardMessage}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 min-h-[350px] flex flex-col items-center justify-center">
            <User className="w-10 h-10 opacity-40 mb-3" />
            <h4 className="font-semibold text-slate-700 text-sm">Chưa có kết quả quay</h4>
            <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-1 leading-normal">
              Nhấn nút quay để chọn ngẫu nhiên học sinh trả lời câu hỏi và thưởng phạt điểm rèn luyện rèn thi đua.
            </p>
          </div>
        )}

        {/* Quick classroom tip card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-500" />
            Mẹo sư phạm của tuần
          </h4>
          <p className="text-xs text-slate-500 leading-normal">
            Sử dụng vòng quay ngẫu nhiên giúp duy trì sự tập trung của học sinh trong lớp học. Kết hợp việc thưởng điểm tích lũy thi đua rèn luyện (+5 hoặc +10) sẽ tăng động lực đóng góp xây dựng bài giảng tích cực hơn.
          </p>
        </div>

      </div>

    </div>
  );
}
