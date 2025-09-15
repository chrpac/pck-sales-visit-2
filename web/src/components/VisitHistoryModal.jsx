import { useEffect, useState } from 'react';
import axios from 'axios';

export default function VisitHistoryModal({ 
  isOpen, 
  onClose, 
  customer 
}) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadVisitHistory = async (customerId, overrides = {}) => {
    setLoading(true);
    setError('');
    try {
      const p = overrides.page !== undefined ? overrides.page : page;
      const l = overrides.limit !== undefined ? overrides.limit : limit;
      const s = overrides.startDate !== undefined ? overrides.startDate : startDate;
      const e = overrides.endDate !== undefined ? overrides.endDate : endDate;
      const st = overrides.status !== undefined ? overrides.status : status;

      const params = { page: p, limit: l, customerId };
      if (s) params.startDate = s;
      if (e) params.endDate = e;
      if (st) params.status = st;

      const res = await axios.get('/api/v1/visits', { params });
      setVisits(res.data.data || []);
      setPages(res.data.pagination?.pages || 1);
    } catch (e) {
      setError('โหลดข้อมูลการเข้าพบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    loadVisitHistory(customer._id, { page: 1 });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatus('');
    setPage(1);
    loadVisitHistory(customer._id, { page: 1, startDate: '', endDate: '', status: '' });
    setFiltersOpen(false);
  };

  const downloadExcel = async () => {
    try {
      const params = new URLSearchParams();
      params.append('customerId', customer._id);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (status) params.append('status', status);
      
      const url = `/api/v1/visits/export/xlsx?${params.toString()}`;
      const res = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `visits_${customer.name}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setError('ไม่สามารถดาวน์โหลดไฟล์ได้');
    }
  };

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

  // Load data when modal opens or customer changes
  useEffect(() => {
    if (isOpen && customer) {
      setPage(1);
      setStartDate('');
      setEndDate('');
      setStatus('');
      loadVisitHistory(customer._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customer]);

  // Reload when page or limit changes
  useEffect(() => {
    if (isOpen && customer) {
      loadVisitHistory(customer._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="absolute inset-4 md:inset-8 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">ประวัติการเข้าพบ - {customer.name}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => setFiltersOpen(true)} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12 10 19 14 21 14 12 22 3"/>
              </svg>
              ตัวกรอง
            </button>
            <div className="flex items-center gap-2">
              <button onClick={downloadExcel} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm">
                ดาวน์โหลด Excel
              </button>
            </div>
          </div>
        </div>

        {filtersOpen && (
          <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">ตัวกรองข้อมูล</h3>
                <button onClick={() => setFiltersOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">วันที่เริ่ม</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">วันที่สิ้นสุด</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">สถานะงาน</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded-md px-3 py-2">
                    <option value="">ทั้งหมด</option>
                    <option value="planned">วางแผนไว้</option>
                    <option value="in-progress">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="cancelled">ยกเลิก</option>
                    <option value="pending">ยังไม่เข้าพบ/ข้อมูลไม่ครบ</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={applyFilters} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex-1">ใช้ตัวกรอง</button>
                <button onClick={clearFilters} className="px-4 py-2 border rounded-md flex-1">ล้าง</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>หน้า {page} / {pages}</div>
              <div className="flex items-center gap-2">
                <button 
                  disabled={page <= 1} 
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    setPage(newPage);
                  }} 
                  className={`px-3 py-1 border rounded-md ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ก่อนหน้า
                </button>
                <button 
                  disabled={page >= pages} 
                  onClick={() => {
                    const newPage = Math.min(pages, page + 1);
                    setPage(newPage);
                  }} 
                  className={`px-3 py-1 border rounded-md ${page >= pages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ถัดไป
                </button>
                <select 
                  value={limit} 
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value);
                    setLimit(newLimit);
                    setPage(1);
                  }} 
                  className="ml-2 border rounded-md px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-6 text-center">กำลังโหลด...</div>
            ) : error ? (
              <div className="p-6">
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
              </div>
            ) : visits.length === 0 ? (
              <div className="p-6 text-center text-gray-500">ไม่พบประวัติการเข้าพบ</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลักษณะงาน</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วัตถุประสงค์</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visits.map(v => (
                      <tr key={v._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(v.visitAt).toLocaleString('th-TH')}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{v.jobType || '-'}</td>
                        <td className="px-6 py-4">{getStatusBadge(v.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{v.purpose || '-'}</td>
                        <td className="px-6 py-4 text-right text-sm">
                          <a className="text-blue-600" href={`/visits/${v._id}`} target="_blank" rel="noopener noreferrer">ดู</a>
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
    </div>
  );
}
