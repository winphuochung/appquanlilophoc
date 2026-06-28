import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import {
  Database,
  Link2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Table,
  ArrowRight,
  ArrowLeft,
  X,
  FileSpreadsheet,
  Layers,
  Sparkles
} from 'lucide-react';

// Dynamic Loader for mammoth (Word file extraction library)
const loadMammoth = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).mammoth) {
      resolve((window as any).mammoth);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';
    script.onload = () => {
      resolve((window as any).mammoth);
    };
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};

const cleanJsonString = (str: string): string => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

interface GoogleSheetsSyncProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudents: Student[];
  onSyncComplete: (syncedStudents: Student[], mode: 'overwrite' | 'merge') => void;
}

interface Mapping {
  studentId: string;
  name: string;
  gender: string;
  dob: string;
  parentName: string;
  parentPhone: string;
  email: string;
}

export default function GoogleSheetsSync({
  isOpen,
  onClose,
  currentStudents,
  onSyncComplete,
}: GoogleSheetsSyncProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importMethod, setImportMethod] = useState<'sheets' | 'file' | 'text'>('sheets');
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [textareaText, setTextareaText] = useState('');
  
  // Mapping state: maps fields of Student interface to CSV column headers
  const [mapping, setMapping] = useState<Mapping>({
    studentId: '',
    name: '',
    gender: '',
    dob: '',
    parentName: '',
    parentPhone: '',
    email: '',
  });

  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [syncMode, setSyncMode] = useState<'merge' | 'overwrite'>('merge');

  // Load last used URL
  useEffect(() => {
    if (isOpen) {
      const savedUrl = localStorage.getItem('google_sheet_url') || '';
      setSheetUrl(savedUrl);
      // Reset state on open
      setStep(1);
      setError('');
      setCsvData([]);
      setHeaders([]);
      setParsedStudents([]);
      setTextareaText('');
      setImportMethod('sheets');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Custom Separator Auto-detecting CSV Parser
  const parseCSV = (text: string): string[][] => {
    // Detect separator
    let separator = ',';
    const firstLine = text.split(/\r?\n/)[0] || '';
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;
    if (semicolons > commas && semicolons > tabs) separator = ';';
    else if (tabs > commas && tabs > semicolons) separator = '\t';

    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentToken = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentToken += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        row.push(currentToken.trim());
        currentToken = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        row.push(currentToken.trim());
        currentToken = '';
        if (row.length > 0 && row.some(cell => cell !== '')) {
          lines.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n
        }
      } else {
        currentToken += char;
      }
    }
    
    if (currentToken || row.length > 0) {
      row.push(currentToken.trim());
      if (row.some(cell => cell !== '')) {
        lines.push(row);
      }
    }
    
    return lines;
  };

  const handleFetchData = async () => {
    if (!sheetUrl.trim()) {
      setError('Vui lòng nhập đường dẫn Google Sheets.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      localStorage.setItem('google_sheet_url', sheetUrl.trim());

      // Parse Google Sheets URL to export direct CSV link
      let directUrl = sheetUrl.trim();
      const match = directUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        const sheetId = match[1];
        const gidMatch = directUrl.match(/gid=([0-9]+)/);
        const gid = gidMatch ? gidMatch[1] : '0';
        directUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      }

      let csvText = '';
      try {
        console.log(`[Google Sheets Client] Tải trực tiếp từ trình duyệt: ${directUrl}`);
        const directResponse = await fetch(directUrl);
        if (directResponse.ok) {
          csvText = await directResponse.text();
        } else {
          throw new Error(`Mã lỗi HTTP: ${directResponse.status}`);
        }
      } catch (directErr) {
        console.warn('Tải trực tiếp thất bại, thử qua proxy máy chủ...', directErr);
        // Fallback to proxy route
        const response = await fetch('/api/google-sheets/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: sheetUrl.trim() }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Lỗi tải file (${response.status})`);
        }
        const data = await response.json();
        csvText = data.csv;
      }
      
      if (!csvText || csvText.trim() === '') {
        throw new Error('Dữ liệu tải về trống.');
      }

      const rows = parseCSV(csvText);
      if (rows.length < 2) {
        throw new Error('Trang tính cần có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu.');
      }

      const csvHeaders = rows[0].map(h => h.trim());
      setCsvData(rows);
      setHeaders(csvHeaders);

      // Auto-mapping columns based on fuzzy header matches
      const idKeys = ['mã học sinh', 'mã hs', 'mã', 'studentid', 'id', 'mssv', 'stt', 'số thứ tự'];
      const nameKeys = ['họ và tên', 'họ tên', 'tên học sinh', 'tên', 'name', 'fullname', 'họ & tên'];
      const genderKeys = ['giới tính', 'giới', 'gender', 'phái'];
      const dobKeys = ['ngày sinh', 'ngaysinh', 'dob', 'ngày-tháng-năm-sinh', 'năm sinh', 'birthdate', 'birth'];
      const parentNameKeys = ['tên phụ huynh', 'phụ huynh', 'người giám hộ', 'parentname', 'parent_name', 'cha mẹ', 'họ tên phụ huynh'];
      const parentPhoneKeys = ['sđt', 'số điện thoại', 'sđt phụ huynh', 'sđt liên hệ', 'parentphone', 'phone', 'telephone', 'liên hệ'];
      const emailKeys = ['email', 'email học sinh', 'thư điện tử'];

      const findHeaderMatch = (keys: string[]) => {
        const index = csvHeaders.findIndex(h => {
          const norm = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/[\s-_]+/g, ' ');
          return keys.some(k => norm.includes(k) || k.includes(norm));
        });
        return index > -1 ? csvHeaders[index] : '';
      };

      setMapping({
        studentId: findHeaderMatch(idKeys) || csvHeaders[0] || '',
        name: findHeaderMatch(nameKeys) || (csvHeaders.length > 1 ? csvHeaders[1] : ''),
        gender: findHeaderMatch(genderKeys) || '',
        dob: findHeaderMatch(dobKeys) || '',
        parentName: findHeaderMatch(parentNameKeys) || '',
        parentPhone: findHeaderMatch(parentPhoneKeys) || '',
        email: findHeaderMatch(emailKeys) || '',
      });

      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi không xác định khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      if (file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const text = evt.target?.result as string;
          parseTextWithAI(text);
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.docx')) {
        const mammothLib = await loadMammoth();
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const arrayBuffer = evt.target?.result as ArrayBuffer;
            const result = await mammothLib.extractRawText({ arrayBuffer });
            const text = result.value;
            if (!text || text.trim() === '') {
              throw new Error('Không trích xuất được văn bản từ file Word.');
            }
            parseTextWithAI(text);
          } catch (mammothErr: any) {
            setError(`Lỗi đọc file Word: ${mammothErr.message}`);
            setLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        throw new Error('Định dạng tệp không được hỗ trợ. Vui lòng tải lên file .docx hoặc .txt.');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const parseTextWithAI = async (rawText: string) => {
    if (!rawText.trim()) {
      setError('Văn bản trống hoặc không đọc được.');
      setLoading(false);
      return;
    }
    
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const savedModel = localStorage.getItem('gemini_model') || 'gemini-3-flash-preview';

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'parse-student-text',
          payload: { text: rawText.substring(0, 15000) },
          apiKey: savedKey,
          model: savedModel
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi từ API Gemini.');
      }

      const cleanJson = cleanJsonString(data.text);
      const list = JSON.parse(cleanJson);
      
      if (!Array.isArray(list)) {
        throw new Error('Dữ liệu AI trả về không phải là mảng JSON học sinh.');
      }

      const studentsList: Student[] = list.map((item: any, index: number) => {
        const idVal = item.id || `HS${String(index + 1).padStart(3, '0')}`;
        return {
          id: idVal,
          studentId: idVal,
          name: item.name || 'Không rõ họ tên',
          gender: item.gender || 'Nam',
          dob: item.dob || '2012-01-01',
          parentName: item.parentName || 'Chưa cập nhật',
          parentPhone: item.parentPhone || '0900000000',
          email: item.email || `${idVal.toLowerCase()}@school.edu.vn`
        };
      });

      setParsedStudents(studentsList);
      setStep(3); // Skip step 2, go straight to preview
    } catch (err: any) {
      console.error(err);
      setError(`Lỗi trích xuất AI: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTextareaParse = () => {
    if (!textareaText.trim()) {
      setError('Vui lòng dán danh sách học sinh vào ô văn bản.');
      return;
    }
    setLoading(true);
    setError('');
    parseTextWithAI(textareaText);
  };

  const handleApplyMapping = () => {
    // Check if Name is mapped
    if (!mapping.name) {
      setError('Cột "Họ và Tên" là bắt buộc phải được ánh xạ.');
      return;
    }

    setError('');
    const nameColIdx = headers.indexOf(mapping.name);
    const idColIdx = mapping.studentId ? headers.indexOf(mapping.studentId) : -1;
    const genderColIdx = mapping.gender ? headers.indexOf(mapping.gender) : -1;
    const dobColIdx = mapping.dob ? headers.indexOf(mapping.dob) : -1;
    const parentNameColIdx = mapping.parentName ? headers.indexOf(mapping.parentName) : -1;
    const parentPhoneColIdx = mapping.parentPhone ? headers.indexOf(mapping.parentPhone) : -1;
    const emailColIdx = mapping.email ? headers.indexOf(mapping.email) : -1;

    const dataRows = csvData.slice(1);
    const parsed: Student[] = [];

    dataRows.forEach((row, idx) => {
      // Skip empty rows
      if (row.length === 0 || !row[nameColIdx]) return;

      // Extract details
      const name = row[nameColIdx]?.trim() || '';
      if (!name) return;

      // Generate or parse Student ID
      let rawStudentId = idColIdx > -1 ? row[idColIdx]?.trim() : '';
      // If it looks like a number index (e.g. "1"), convert to HS001
      if (rawStudentId && /^\d+$/.test(rawStudentId)) {
        rawStudentId = `HS${rawStudentId.padStart(3, '0')}`;
      }
      
      const studentId = rawStudentId || `HS${String(idx + 1).padStart(3, '0')}`;

      // Gender mapping
      const rawGender = genderColIdx > -1 ? row[genderColIdx]?.trim() : '';
      const gender: 'Nam' | 'Nữ' = 
        rawGender && (rawGender.toLowerCase().startsWith('n') || rawGender.toLowerCase() === 'female') 
          ? 'Nữ' 
          : 'Nam';

      // DOB
      let dob = dobColIdx > -1 ? row[dobColIdx]?.trim() : '';
      if (!dob) {
        dob = '2012-01-01'; // Default
      } else {
        // Simple date normalization (e.g., DD/MM/YYYY to YYYY-MM-DD)
        const dateParts = dob.split(/[\/\.-]/);
        if (dateParts.length === 3) {
          // If first part is 4 digits, assume YYYY-MM-DD
          if (dateParts[0].length === 4) {
            dob = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
          } else {
            // Assume DD/MM/YYYY
            dob = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
          }
        }
      }

      const parentName = parentNameColIdx > -1 ? row[parentNameColIdx]?.trim() : 'Chưa cập nhật';
      const parentPhone = parentPhoneColIdx > -1 ? row[parentPhoneColIdx]?.trim() : '0900000000';
      const email = emailColIdx > -1 ? row[emailColIdx]?.trim() : `${studentId.toLowerCase()}@school.edu.vn`;

      parsed.push({
        id: studentId, // Set primary ID to the student ID code to persist relationships
        studentId,
        name,
        gender,
        dob,
        parentName,
        parentPhone,
        email,
      });
    });

    if (parsed.length === 0) {
      setError('Không trích xuất được học sinh hợp lệ nào từ bảng tính.');
      return;
    }

    setParsedStudents(parsed);
    setStep(3);
  };

  const handleSyncSubmit = () => {
    onSyncComplete(parsedStudents, syncMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex justify-between items-center border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base font-sans tracking-tight">Nhập Danh Sách Học Sinh</h3>
              <p className="text-slate-300 text-[10px] font-mono mt-0.5 uppercase tracking-wider">Đồng bộ Google Sheets hoặc dùng AI đọc file Word/Text</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Tabs */}
        {step === 1 && (
          <div className="flex bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-500 flex-shrink-0">
            <button
              onClick={() => { setImportMethod('sheets'); setError(''); }}
              className={`flex-1 py-3 text-center border-r border-slate-200 transition-all cursor-pointer ${
                importMethod === 'sheets' ? 'bg-white text-indigo-600 border-b-2 border-b-indigo-600' : 'hover:bg-slate-50'
              }`}
            >
              🔗 Link Google Sheets
            </button>
            <button
              onClick={() => { setImportMethod('file'); setError(''); }}
              className={`flex-1 py-3 text-center border-r border-slate-200 transition-all cursor-pointer ${
                importMethod === 'file' ? 'bg-white text-indigo-600 border-b-2 border-b-indigo-600' : 'hover:bg-slate-50'
              }`}
            >
              📄 Tải file Word / Text (AI)
            </button>
            <button
              onClick={() => { setImportMethod('text'); setError(''); }}
              className={`flex-1 py-3 text-center transition-all cursor-pointer ${
                importMethod === 'text' ? 'bg-white text-indigo-600 border-b-2 border-b-indigo-600' : 'hover:bg-slate-50'
              }`}
            >
              📋 Dán văn bản thô (AI)
            </button>
          </div>
        )}

        {/* Steps Progress Indicator */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex justify-between items-center text-xs flex-shrink-0">
          <div className="flex items-center gap-6 w-full justify-around font-bold">
            <span className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${step >= 1 ? 'bg-indigo-50 border-indigo-200' : 'border-slate-300'}`}>1</span>
              {importMethod === 'sheets' ? 'Nhập Link Sheets' : importMethod === 'file' ? 'Tải File Word/Text' : 'Dán Roster'}
            </span>
            <div className="h-px bg-slate-200 flex-1 mx-2"></div>
            <span className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${step >= 2 ? 'bg-indigo-50 border-indigo-200' : 'border-slate-300'}`}>2</span>
              Ánh Xạ Cột
            </span>
            <div className="h-px bg-slate-200 flex-1 mx-2"></div>
            <span className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${step >= 3 ? 'bg-indigo-50 border-indigo-200' : 'border-slate-300'}`}>3</span>
              Xem Trước & Đồng Bộ
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: IMPORT OPTIONS */}
          {step === 1 && (
            <div className="space-y-4">
              {importMethod === 'sheets' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Liên kết trang tính Google Sheet của lớp học:</label>
                    <div className="relative">
                      <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                        className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-indigo-50/50 rounded-xl p-4.5 border border-indigo-100/50 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Hướng dẫn cấu hình chia sẻ Google Sheet:
                    </h4>
                    <ol className="text-xs text-indigo-900/80 list-decimal list-inside space-y-2 pl-1 leading-relaxed">
                      <li>Mở bảng tính Google Sheet chứa danh sách lớp học của bạn.</li>
                      <li>
                        Nhấn nút <strong>Chia sẻ (Share)</strong> ở góc trên bên phải, thiết lập quyền truy cập thành 
                        <span className="text-indigo-600 font-bold"> "Bất kỳ ai có liên kết đều có thể xem" (Anyone with the link can view)</span>.
                      </li>
                      <li>Copy đường dẫn của trình duyệt dán vào ô bên trên.</li>
                      <li>
                        <em>Hoặc thay thế:</em> Chọn <strong>Tệp &gt; Chia sẻ &gt; Công bố lên web</strong>. Chọn định dạng xuất bản là 
                        <strong> Giá trị phân tách bằng dấu phẩy (.csv)</strong>, bấm Công bố và copy liên kết đó dán vào đây.
                      </li>
                    </ol>
                  </div>

                  {/* Requirements */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-500">
                    💡 <strong>Yêu cầu cấu trúc cột trong bảng tính:</strong> Bảng tính nên có dòng đầu tiên làm tiêu đề. Hệ thống sẽ tự động đối chiếu các tiêu đề như: <em>Mã HS, Họ tên, Giới tính, Ngày sinh, Tên phụ huynh, SĐT...</em> để ánh xạ.
                  </div>
                </div>
              )}

              {importMethod === 'file' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-8 text-center transition-all bg-slate-50 relative cursor-pointer">
                    <input
                      type="file"
                      accept=".docx,.txt"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      disabled={loading}
                    />
                    <div className="space-y-3">
                      <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                        {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <FileSpreadsheet className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Tải lên file danh sách lớp học</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Chấp nhận định dạng file Word (.docx) hoặc file văn bản (.txt)</p>
                      </div>
                      <div className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-500">
                        Chọn tệp từ thiết bị
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                    <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      Cơ chế hoạt động của Trí Tuệ Nhân Tạo AI:
                    </h5>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      Hệ thống tích hợp AI sẽ tự động đọc toàn bộ văn bản trong file Word của bạn, tự động trích xuất các trường thông tin học sinh (Họ tên, Giới tính, Ngày sinh, SĐT...) và thiết lập danh sách lớp chỉ trong vài giây. Bạn không cần phải định dạng lại file phức tạp!
                    </p>
                  </div>
                </div>
              )}

              {importMethod === 'text' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Sao chép & dán danh sách học sinh thô của bạn tại đây:</label>
                    <textarea
                      value={textareaText}
                      onChange={(e) => setTextareaText(e.target.value)}
                      placeholder="Ví dụ:&#10;1. Nguyễn Văn A - Nam - 15/05/2012 - Phụ huynh: Nguyễn Văn B (SĐT: 0912345678)&#10;2. Lê Thị B - Nữ - Ngày sinh: 20/10/2012 - Mẹ: Lê Thị C (SĐT: 0987654321)..."
                      className="w-full h-44 text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-sans leading-relaxed scrollbar-thin"
                      disabled={loading}
                    ></textarea>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] text-slate-500 leading-relaxed">
                    💡 <strong>Mẹo nhỏ:</strong> Bạn có thể copy bất kỳ văn bản danh sách nào từ Email, trang web, file Excel thô hoặc tin nhắn Zalo, dán vào đây và nhấn <strong>"DÙNG AI TRÍCH XUẤT"</strong>. Trợ lý AI sẽ tự động dọn dẹp và chuẩn hóa dữ liệu học sinh giúp bạn.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Đã kết nối thành công! Vui lòng kiểm tra lại ánh xạ cột bên dưới.</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-black tracking-widest text-[9px]">
                    <tr>
                      <th className="px-4 py-2.5 w-1/3">Trường dữ liệu Hệ thống</th>
                      <th className="px-4 py-2.5">Cột tương ứng từ Sheet của bạn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {/* studentId */}
                    <tr>
                      <td className="px-4 py-3 font-semibold">Mã Học Sinh</td>
                      <td className="px-4 py-2">
                        <select
                          value={mapping.studentId}
                          onChange={(e) => setMapping({ ...mapping, studentId: e.target.value })}
                          className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        >
                          <option value="">-- [Tự động sinh mã / Không ánh xạ] --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </td>
                    </tr>
                    {/* name */}
                    <tr>
                      <td className="px-4 py-3 font-semibold">Họ và Tên *</td>
                      <td className="px-4 py-2">
                        <select
                          value={mapping.name}
                          onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                          className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        >
                          <option value="">-- Chọn cột Họ và Tên --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </td>
                    </tr>
                    {/* gender */}
                    <tr>
                      <td className="px-4 py-3 font-semibold">Giới Tính</td>
                      <td className="px-4 py-2">
                        <select
                          value={mapping.gender}
                          onChange={(e) => setMapping({ ...mapping, gender: e.target.value })}
                          className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        >
                          <option value="">-- Chọn cột Giới tính (mặc định Nam) --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </td>
                    </tr>
                    {/* dob */}
                    <tr>
                      <td className="px-4 py-3 font-semibold">Ngày Sinh</td>
                      <td className="px-4 py-2">
                        <select
                          value={mapping.dob}
                          onChange={(e) => setMapping({ ...mapping, dob: e.target.value })}
                          className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        >
                          <option value="">-- Chọn cột Ngày sinh (mặc định 01/01/2012) --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </td>
                    </tr>
                    {/* parentName */}
                    <tr>
                      <td className="px-4 py-3 font-semibold">Tên Phụ Huynh</td>
                      <td className="px-4 py-2">
                        <select
                          value={mapping.parentName}
                          onChange={(e) => setMapping({ ...mapping, parentName: e.target.value })}
                          className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        >
                          <option value="">-- Chọn cột Tên Phụ Huynh --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </td>
                    </tr>
                    {/* parentPhone */}
                    <tr>
                      <td className="px-4 py-3 font-semibold">SĐT Phụ Huynh</td>
                      <td className="px-4 py-2">
                        <select
                          value={mapping.parentPhone}
                          onChange={(e) => setMapping({ ...mapping, parentPhone: e.target.value })}
                          className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        >
                          <option value="">-- Chọn cột Số điện thoại --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </td>
                    </tr>
                    {/* email */}
                    <tr>
                      <td className="px-4 py-3 font-semibold">Email Học Sinh</td>
                      <td className="px-4 py-2">
                        <select
                          value={mapping.email}
                          onChange={(e) => setMapping({ ...mapping, email: e.target.value })}
                          className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        >
                          <option value="">-- [Tự động tạo email theo mã HS] --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & SYNC CONFIG */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  Cấu hình chế độ đồng bộ:
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <label className={`p-4 border rounded-xl flex flex-col justify-between gap-1 cursor-pointer transition-all ${
                    syncMode === 'merge'
                      ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="sync_mode"
                      checked={syncMode === 'merge'}
                      onChange={() => setSyncMode('merge')}
                      className="sr-only"
                    />
                    <div>
                      <span className="font-bold text-indigo-950 block">Cập nhật & Bổ sung (Merge)</span>
                      <span className="text-[10px] text-slate-500 leading-normal block mt-1">
                        Cập nhật hồ sơ của học sinh có mã trùng khớp, giữ nguyên điểm số, hạnh kiểm rèn luyện. Thêm mới học sinh chưa tồn tại. An toàn cao.
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-3">KHUYÊN DÙNG</span>
                  </label>

                  <label className={`p-4 border rounded-xl flex flex-col justify-between gap-1 cursor-pointer transition-all ${
                    syncMode === 'overwrite'
                      ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="sync_mode"
                      checked={syncMode === 'overwrite'}
                      onChange={() => setSyncMode('overwrite')}
                      className="sr-only"
                    />
                    <div>
                      <span className="font-bold text-rose-950 block">Ghi đè hoàn toàn (Overwrite)</span>
                      <span className="text-[10px] text-slate-500 leading-normal block mt-1">
                        Thay thế toàn bộ danh sách lớp bằng dữ liệu Sheet này. Xóa các học sinh cũ không nằm trong Sheet. Điểm và hạnh kiểm của học sinh bị xóa sẽ bị dọn dẹp.
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-3">CẨN THẬN</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-slate-500" />
                  Bản xem trước dữ liệu trích xuất (Tối đa 5 dòng đầu):
                </h4>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-black text-[9px] tracking-wider">
                      <tr>
                        <th className="px-3 py-2">Mã HS</th>
                        <th className="px-3 py-2">Họ & Tên</th>
                        <th className="px-3 py-2">Giới Tính</th>
                        <th className="px-3 py-2">Ngày Sinh</th>
                        <th className="px-3 py-2">Phụ Huynh</th>
                        <th className="px-3 py-2">SĐT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedStudents.slice(0, 5).map((std) => (
                        <tr key={std.studentId}>
                          <td className="px-3 py-2 font-mono font-bold text-slate-900">{std.studentId}</td>
                          <td className="px-3 py-2 font-bold">{std.name}</td>
                          <td className="px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              std.gender === 'Nam' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-pink-50 text-pink-700 border border-pink-100'
                            }`}>
                              {std.gender}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono">{std.dob}</td>
                          <td className="px-3 py-2 truncate max-w-[100px]">{std.parentName}</td>
                          <td className="px-3 py-2 font-mono">{std.parentPhone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-400 text-right italic">Tổng số tìm thấy: <strong>{parsedStudents.length}</strong> học sinh trong Google Sheet.</p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step === 3 ? 2 : 1)}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                QUAY LẠI
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              HỦY
            </button>
            
            {step === 1 && importMethod === 'sheets' && (
              <button
                type="button"
                disabled={loading}
                onClick={handleFetchData}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                TẢI DỮ LIỆU
              </button>
            )}

            {step === 1 && importMethod === 'text' && (
              <button
                type="button"
                disabled={loading}
                onClick={handleTextareaParse}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                DÙNG AI TRÍCH XUẤT
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleApplyMapping}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                XEM TRƯỚC DỮ LIỆU
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleSyncSubmit}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                BẮT ĐẦU ĐỒNG BỘ
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
