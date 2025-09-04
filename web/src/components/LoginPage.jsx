import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function LoginPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  const handleMicrosoftLogin = () => {
    // Redirect to Microsoft OAuth endpoint
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    window.location.href = `${API_BASE}/api/v1/oauth/microsoft`;
    //window.location.href = `https://api-sales-visit.ezcow.net/api/v1/oauth/microsoft`;
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'unauthorized':
        return 'คุณไม่มีสิทธิ์เข้าใช้งานระบบนี้ กรุณาติดต่อผู้ดูแลระบบ';
      case 'auth_failed':
        return 'การเข้าสู่ระบบผิดพลาด กรุณาลองใหม่อีกครั้ง';
      case 'server_error':
        return 'เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง';
      case 'session_error':
        return 'เกิดข้อผิดพลาดในการสร้าง session กรุณาลองใหม่อีกครั้ง';
      default:
        return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">PCK Sales Visit</h2>
          <p className="mt-2 text-sm text-gray-600">
            เข้าสู่ระบบด้วย Microsoft Account
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    {getErrorMessage(error)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={handleMicrosoftLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-blue-300 group-hover:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.15 2.587L23.15 21.413c0 .316-.256.572-.572.572L2.572 21.985c-.316 0-.572-.256-.572-.572L2 2.587c0-.316.256-.572.572-.572L22.578 2.015c.316 0 .572.256.572.572zM10.049 19.005L10.049 12.42 4.109 12.42 4.109 19.005 10.049 19.005zM19.005 19.005L19.005 12.42 13.065 12.42 13.065 19.005 19.005 19.005zM10.049 9.404L10.049 4.995 4.109 4.995 4.109 9.404 10.049 9.404zM19.005 9.404L19.005 4.995 13.065 4.995 13.065 9.404 19.005 9.404z"/>
                </svg>
              </span>
              เข้าสู่ระบบด้วย Microsoft
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              ระบบจะใช้บัญชี Microsoft ขององค์กรในการเข้าสู่ระบบ<br />
              หากไม่สามารถเข้าสู่ระบบได้ กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
