import { PlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

function Dashboard({ user }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/v1/visits', { params: { limit: 10 } });
        setVisits(res.data.data || []);
      } catch (e) {
        setError('โหลดข้อมูลการเข้าพบไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', text: 'เสร็จสิ้น' },
      'in-progress': { color: 'bg-yellow-100 text-yellow-800', text: 'กำลังดำเนินการ' },
      planned: { color: 'bg-blue-100 text-blue-800', text: 'วางแผนไว้' },
      cancelled: { color: 'bg-gray-100 text-gray-700', text: 'ยกเลิก' },
      pending: { color: 'bg-red-100 text-red-800', text: 'ยังไม่เข้าพบ/ข้อมูลไม่ครบ' },
    };
    const c = statusConfig[status] || statusConfig.planned;
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.color}`}>{c.text}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">สวัสดี, {user?.firstName} {user?.lastName}</h1>
            <p className="text-gray-600">ยินดีต้อนรับสู่ระบบจัดการการเข้าพบลูกค้า</p>
          </div>
          <a href="/visits/new" className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <PlusIcon className="h-5 w-5 mr-2" /> เพิ่มการเข้าพบใหม่
          </a>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">การเข้าพบล่าสุด</h2>
          {loading ? (
            <div>กำลังโหลด...</div>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลูกค้า</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จังหวัด</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลักษณะงาน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map(v => (
                    <tr key={v._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{new Date(v.visitAt).toLocaleString('th-TH')}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{v.customer?.name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{v.customer?.province || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{v.jobType || '-'}</td>
                      <td className="px-6 py-4">{getStatusBadge(v.status)}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <a className="text-blue-600" href={`/visits/${v._id}`}>ดู</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
