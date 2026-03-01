
import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Upload, Loader2, Download, CheckCircle2, AlertCircle, Trash2, FileOutput } from 'lucide-react';
import { initPdfJs, pdfToImages } from './services/pdfUtils';
import { analyzePdfPage } from './services/geminiService';
import { generateDocx } from './services/docxGenerator';
import { ProcessingStatus } from './types';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    step: 'idle',
    progress: 0,
    message: ''
  });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    initPdfJs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        alert('Vui lòng chọn tệp PDF.');
        return;
      }
      setFile(selectedFile);
      setDownloadUrl(null);
      setStatus({ step: 'idle', progress: 0, message: 'Đã sẵn sàng chuyển đổi' });
    }
  };

  const reset = () => {
    setFile(null);
    setDownloadUrl(null);
    setStatus({ step: 'idle', progress: 0, message: '' });
  };

  const startConversion = async () => {
    if (!file) return;

    try {
      setStatus({ step: 'extracting', progress: 10, message: 'Đang trích xuất hình ảnh từ PDF...' });
      const pageImages = await pdfToImages(file);
      
      setStatus({ step: 'analyzing', progress: 30, message: 'Gemini đang phân tích cấu trúc tài liệu...' });
      
      const analyzedPages = [];
      for (let i = 0; i < pageImages.length; i++) {
        const pageNum = i + 1;
        setStatus(prev => ({ 
          ...prev, 
          message: `Đang phân tích trang ${pageNum}/${pageImages.length}...`,
          progress: 30 + Math.floor((i / pageImages.length) * 50)
        }));
        
        const elements = await analyzePdfPage(pageImages[i]);
        analyzedPages.push({ pageNumber: pageNum, elements });
      }

      setStatus({ step: 'generating', progress: 90, message: 'Đang tạo tệp Word (.docx)...' });
      const docxBlob = await generateDocx(analyzedPages);
      
      const url = URL.createObjectURL(docxBlob);
      setDownloadUrl(url);
      setStatus({ step: 'completed', progress: 100, message: 'Chuyển đổi hoàn tất!' });

    } catch (error) {
      console.error(error);
      setStatus({ 
        step: 'error', 
        progress: 0, 
        message: 'Có lỗi xảy ra trong quá trình chuyển đổi. Vui lòng thử lại.' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      {/* Header */}
      <header className="max-w-4xl w-full text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 mb-6">
          <FileOutput size={40} />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          PDF to Word <span className="text-blue-600">Pro</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Chuyển đổi tệp PDF sang tài liệu Word có thể chỉnh sửa dễ dàng bằng sức mạnh của AI. 
          Giữ nguyên cấu trúc, bảng biểu và văn bản.
        </p>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8">
          
          {/* Upload Area */}
          {!file && (
            <div className="relative group">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center transition-all group-hover:border-blue-400 group-hover:bg-blue-50/30">
                <div className="mx-auto w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 transition-colors group-hover:bg-blue-100 group-hover:text-blue-500">
                  <Upload size={32} />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-1">Kéo thả hoặc bấm để tải PDF</h3>
                <p className="text-slate-500">Tối đa 10 trang để đảm bảo hiệu suất tốt nhất</p>
              </div>
            </div>
          )}

          {/* File Selected / Processing Info */}
          {file && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-md">{file.name}</h4>
                    <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                {status.step === 'idle' && (
                  <button 
                    onClick={reset}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {status.step !== 'idle' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600 flex items-center gap-2">
                      {status.step !== 'completed' && status.step !== 'error' && (
                        <Loader2 size={16} className="animate-spin text-blue-500" />
                      )}
                      {status.message}
                    </span>
                    <span className="text-blue-600">{status.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-500 ease-out"
                      style={{ width: `${status.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {status.step === 'idle' && (
                  <button
                    onClick={startConversion}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    Bắt đầu chuyển đổi
                  </button>
                )}

                {status.step === 'completed' && downloadUrl && (
                  <>
                    <a
                      href={downloadUrl}
                      download={`${file.name.replace('.pdf', '')}_converted.docx`}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg shadow-green-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Tải về File Word (.docx)
                    </a>
                    <button
                      onClick={reset}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 px-8 rounded-xl transition-all"
                    >
                      Chuyển file khác
                    </button>
                  </>
                )}

                {status.step === 'error' && (
                  <button
                    onClick={reset}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-8 rounded-xl transition-all"
                  >
                    Thử lại
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Features Grid */}
      <section className="max-w-4xl w-full mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h4 className="font-semibold text-slate-900 mb-2">Chỉnh sửa tối đa</h4>
          <p className="text-slate-500 text-sm leading-relaxed">
            AI phân tích cấu trúc đoạn văn, tiêu đề và danh sách thay vì chỉ là các khối văn bản rời rạc.
          </p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h4 className="font-semibold text-slate-900 mb-2">Thông minh hơn</h4>
          <p className="text-slate-500 text-sm leading-relaxed">
            Sử dụng mô hình Gemini mới nhất để nhận diện bảng biểu và các định dạng phức tạp.
          </p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h4 className="font-semibold text-slate-900 mb-2">An toàn & Riêng tư</h4>
          <p className="text-slate-500 text-sm leading-relaxed">
            Tài liệu được xử lý trực tiếp và chuyển đổi thành định dạng Word chuẩn (.docx).
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 text-slate-400 text-sm">
        &copy; 2024 PDF to Word Pro. Powered by Gemini AI.
      </footer>
    </div>
  );
};

export default App;
