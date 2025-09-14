import { PlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

function Dashboard({ user }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState('');
  const [salesName, setSalesName] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadData = async (overrides = {}) => {
    setLoading(true);
    setError('');
    try {
      const p = overrides.page !== undefined ? overrides.page : page;
      const l = overrides.limit !== undefined ? overrides.limit : limit;
      const s = overrides.startDate !== undefined ? overrides.startDate : startDate;
      const e = overrides.endDate !== undefined ? overrides.endDate : endDate;
      const cn = overrides.customerName !== undefined ? overrides.customerName : customerName;
      const st = overrides.status !== undefined ? overrides.status : status;
      const sn = overrides.salesName !== undefined ? overrides.salesName : salesName;

      const params = { page: p, limit: l };
      if (s) params.startDate = s;
      if (e) params.endDate = e;
      if (cn) params.customerName = cn;
      if (st) params.status = st;
      if (sn) params.salesName = sn;
      const res = await axios.get('/api/v1/visits', { params });
      setVisits(res.data.data || []);
      setPages(res.data.pagination?.pages || 1);
    } catch (e) {
      setError('โหลดข้อมูลการเข้าพบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const applyFilters = () => {
    setPage(1);
    loadData({ page: 1 });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCustomerName('');
    setStatus('');
    setSalesName('');
    setPage(1);
    // Ensure cleared filters are used immediately
    loadData({ page: 1, startDate: '', endDate: '', customerName: '', status: '', salesName: '' });
    setFiltersOpen(false);
  };

  const downloadExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (customerName) params.append('customerName', customerName);
      if (status) params.append('status', status);
      if (salesName) params.append('salesName', salesName);
      const url = `/api/v1/visits/export/xlsx?${params.toString()}`;
      const res = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'visits.xlsx';
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-gray-900">การเข้าพบล่าสุด</h2>
            <button onClick={() => setFiltersOpen(true)} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12 10 19 14 21 14 12 22 3"/></svg>
              ตัวกรอง
            </button>
          </div>

          {filtersOpen && (
            <div className="fixed inset-0 z-20">
              <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)}></div>
              <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center">
                <div className="bg-white md:rounded-lg md:shadow-lg w-full md:max-w-xl md:mx-auto p-4 md:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold">ตัวกรองข้อมูล</h3>
                    <button onClick={() => setFiltersOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">วันที่เริ่ม</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">วันที่สิ้นสุด</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-1">ชื่อลูกค้า</label>
                      <input type="text" placeholder="ค้นหาชื่อลูกค้า" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-1">ชื่อพนักงานขาย</label>
                      <input type="text" placeholder="ค้นหาชื่อพนักงานขาย" value={salesName} onChange={(e) => setSalesName(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                    </div>
                    <div className="md:col-span-2">
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
                  <div className="mt-4 flex gap-2">
                    <button onClick={applyFilters} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md w-full">ใช้ตัวกรอง</button>
                    <button onClick={clearFilters} className="px-4 py-2 border rounded-md w-full">ล้าง</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">หน้า {page} / {pages}</div>
            <div className="flex items-center gap-2">
              <button onClick={downloadExcel} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md">ดาวน์โหลด Excel</button>
              <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))} className={`px-3 py-1 border rounded-md ${page<=1 ? 'opacity-50 cursor-not-allowed' : ''}`}>ก่อนหน้า</button>
              <button disabled={page>=pages} onClick={() => setPage(p => Math.min(pages, p+1))} className={`px-3 py-1 border rounded-md ${page>=pages ? 'opacity-50 cursor-not-allowed' : ''}`}>ถัดไป</button>
              <select value={limit} onChange={(e)=>{ setLimit(parseInt(e.target.value)); setPage(1); }} className="ml-2 border rounded-md px-2 py-1 text-sm">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
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
