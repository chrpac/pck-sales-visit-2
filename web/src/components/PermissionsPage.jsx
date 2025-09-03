import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const ROLES = ['admin', 'manager', 'sales'];

function useDebounced(val, delay = 300) {
  const [v, setV] = useState(val);
  useEffect(() => { const t = setTimeout(() => setV(val), delay); return () => clearTimeout(t); }, [val, delay]);
  return v;
}

export default function PermissionsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const dSearch = useDebounced(search);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [cEmail, setCEmail] = useState('');
  const [cFirstName, setCFirstName] = useState('');
  const [cLastName, setCLastName] = useState('');
  const [cDisplayName, setCDisplayName] = useState('');
  const [cRole, setCRole] = useState('sales');
  const canCreate = useMemo(() => cEmail && cFirstName && cLastName && cRole, [cEmail, cFirstName, cLastName, cRole]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/users', { params: { search: dSearch, limit: 100 } });
      setUsers(res.data.data.users || []);
    } catch (e) {
      setError('โหลดข้อมูลผู้ใช้ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [dSearch]);

  const updateRole = async (userId, role) => {
    try {
      const res = await axios.patch(`/api/v1/users/${userId}`, { role });
      setUsers(prev => prev.map(u => u._id === userId ? res.data.data.user || res.data.data : u));
    } catch (e) {
      setError('ปรับสิทธิ์ผู้ใช้ไม่สำเร็จ');
    }
  };

  const toggleActive = async (user) => {
    try {
      if (user.isActive) {
        const res = await axios.patch(`/api/v1/users/${user._id}/deactivate`);
        setUsers(prev => prev.map(u => u._id === user._id ? (res.data.data.user || res.data.data) : u));
      } else {
        const res = await axios.patch(`/api/v1/users/${user._id}/activate`);
        setUsers(prev => prev.map(u => u._id === user._id ? (res.data.data.user || res.data.data) : u));
      }
    } catch (e) {
      setError('เปลี่ยนสถานะผู้ใช้ไม่สำเร็จ');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('ยืนยันการลบผู้ใช้รายนี้?')) return;
    try {
      await axios.delete(`/api/v1/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (e) {
      setError('ลบผู้ใช้ไม่สำเร็จ');
    }
  };

  const filtered = useMemo(() => users, [users]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">จัดการสิทธิ์</h1>
        <button className="px-3 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreate(v => !v)}>+ เพิ่มผู้ใช้/กำหนดสิทธิ์</button>
      </div>

      <div className="bg-white p-4 rounded-md shadow">
        <input className="w-full md:w-1/2 border rounded-md px-3 py-2" placeholder="ค้นหาชื่อ/อีเมล..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden">
        {loading ? (
          <div className="p-6">กำลังโหลด...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">อีเมล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สิทธิ์</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{u.displayName || `${u.firstName || ''} ${u.lastName || ''}`}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <select className="border rounded-md px-2 py-1" value={u.role} onChange={(e) => updateRole(u._id, e.target.value)}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button className={`mr-3 ${u.isActive ? 'text-yellow-700' : 'text-green-700'}`} onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                      <button className="text-red-600" onClick={() => deleteUser(u._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {showCreate && (
        <div className="bg-white rounded-md shadow p-6">
          <h2 className="text-lg font-semibold mb-4">เพิ่มผู้ใช้ใหม่</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!canCreate) return;
            try {
              const payload = {
                email: cEmail,
                firstName: cFirstName,
                lastName: cLastName,
                displayName: cDisplayName || undefined,
                role: cRole,
                isActive: true,
              };
              const res = await axios.post('/api/v1/users', payload);
              const created = res.data.data.user || res.data.data;
              setUsers(prev => [created, ...prev]);
              setShowCreate(false);
              setCEmail(''); setCFirstName(''); setCLastName(''); setCDisplayName(''); setCRole('sales');
            } catch (e) {
              setError(e?.response?.data?.message || 'เพิ่มผู้ใช้ไม่สำเร็จ');
            }
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล (required)</label>
                <input type="email" className="w-full border rounded-md px-3 py-2" value={cEmail} onChange={e => setCEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ (required)</label>
                <input className="w-full border rounded-md px-3 py-2" value={cFirstName} onChange={e => setCFirstName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล (required)</label>
                <input className="w-full border rounded-md px-3 py-2" value={cLastName} onChange={e => setCLastName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อที่แสดง (optional)</label>
                <input className="w-full border rounded-md px-3 py-2" value={cDisplayName} onChange={e => setCDisplayName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สิทธิ์ (required)</label>
                <select className="w-full border rounded-md px-3 py-2" value={cRole} onChange={e => setCRole(e.target.value)} required>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded-md border" onClick={() => setShowCreate(false)}>ยกเลิก</button>
              <button type="submit" disabled={!canCreate} className={`px-4 py-2 rounded-md text-white ${canCreate ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'}`}>เพิ่มผู้ใช้</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
