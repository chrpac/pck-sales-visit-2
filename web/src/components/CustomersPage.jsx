import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const h = setTimeout(() => setV(value), delay); return () => clearTimeout(h); }, [value, delay]);
  return v;
}

function ContactsEditor({ contacts, setContacts }) {
  const addRow = () => setContacts(prev => [...prev, { name: '', position: '', isDecisionMaker: false }]);
  const removeRow = (idx) => setContacts(prev => prev.filter((_, i) => i !== idx));
  const update = (idx, key, val) => setContacts(prev => prev.map((c, i) => i === idx ? { ...c, [key]: val } : c));
  return (
    <div className="space-y-2">
      {contacts.map((row, idx) => (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
          <input className="border rounded-md px-3 py-2" placeholder="ชื่อผู้ติดต่อ" value={row.name} onChange={e => update(idx, 'name', e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="ตำแหน่ง" value={row.position} onChange={e => update(idx, 'position', e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="เบอร์โทรศัพท์" value={row.phone || ''} onChange={e => update(idx, 'phone', e.target.value)} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={row.isDecisionMaker} onChange={e => update(idx, 'isDecisionMaker', e.target.checked)} />ผู้มีอำนาจตัดสินใจ</label>
          <div className="flex justify-end"><button type="button" className="text-red-600 text-sm" onClick={() => removeRow(idx)}>ลบ</button></div>
        </div>
      ))}
      <button type="button" className="text-blue-600 text-sm" onClick={addRow}>+ เพิ่มผู้ติดต่อ</button>
    </div>
  );
}

export default function CustomersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [error, setError] = useState('');

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null); // customer or null
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [contacts, setContacts] = useState([{ name: '', position: '', isDecisionMaker: false }]);
  const [currentProviderBrand, setCurrentProviderBrand] = useState('');
  const [businessCardPreview, setBusinessCardPreview] = useState('');
  const [businessCard, setBusinessCard] = useState(null); // { url, key, provider }
  const [businessDragOver, setBusinessDragOver] = useState(false);
  const [uploadingBusiness, setUploadingBusiness] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const fileSrc = (f) => (f?.key ? `${API_BASE}/api/v1/uploads/proxy?key=${encodeURIComponent(f.key)}` : f?.url);

  const resetEditor = () => {
    setEditing(null);
    setName('');
    setProvince('');
    setContacts([{ name: '', position: '', isDecisionMaker: false }]);
    setCurrentProviderBrand('');
    setBusinessCard(null);
    setBusinessCardPreview('');
  };

  const openCreate = () => { resetEditor(); setShowEditor(true); };
  const openEdit = (c) => {
    setEditing(c);
    setName(c.name || '');
    setProvince(c.province || '');
    setContacts(c.contacts?.length ? c.contacts : [{ name: '', position: '', isDecisionMaker: false }]);
    setCurrentProviderBrand(c.currentProviderBrand || '');
    if (c.businessCard?.url || c.businessCard?.key) {
      setBusinessCard(c.businessCard);
      setBusinessCardPreview(fileSrc(c.businessCard));
    } else {
      setBusinessCard(null);
      setBusinessCardPreview('');
    }
    setShowEditor(true);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/customers', { params: { search: debounced, limit: 50 } });
      setItems(res.data.data || []);
    } catch (e) {
      setError('โหลดข้อมูลลูกค้าไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [debounced]);

  const handleDelete = async (id) => {
    if (!window.confirm('ยืนยันลบลูกค้า?')) return;
    try {
      await axios.delete(`/api/v1/customers/${id}`);
      setItems(prev => prev.filter(x => x._id !== id));
    } catch (e) {
      setError('ลบข้อมูลไม่สำเร็จ');
    }
  };

  const handleUploadBusinessCard = async (file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setBusinessCardPreview(preview);
    try {
      setUploadingBusiness(true);
      const ct = file.type || 'application/octet-stream';
      const presign = await axios.post('/api/v1/uploads/presign', null, { params: { type: 'customer-business-card', filename: file.name, contentType: ct } });
      const { url, key, provider } = presign.data.data;
      await fetch(url, { method: 'PUT', headers: { 'Content-Type': ct }, body: file });
      setBusinessCard({ url: url.split('?')[0], key, provider });
    } catch (e) {
      setError('อัปโหลดรูปนามบัตรไม่สำเร็จ');
    } finally {
      setUploadingBusiness(false);
    }
  };

  const canSave = useMemo(() => !!name?.trim(), [name]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    try {
      const payload = {
        name: name.trim(),
        province,
        contacts: contacts.filter(c => c.name?.trim()),
        currentProviderBrand: currentProviderBrand || undefined,
        businessCard: businessCard || undefined,
      };
      if (editing) {
        const res = await axios.patch(`/api/v1/customers/${editing._id}`, payload);
        setItems(prev => prev.map(x => x._id === editing._id ? res.data.data : x));
      } else {
        const res = await axios.post('/api/v1/customers', payload);
        setItems(prev => [res.data.data, ...prev]);
      }
      setShowEditor(false);
      resetEditor();
    } catch (e) {
      setError(e?.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ฐานข้อมูลลูกค้า</h1>
        <button className="px-3 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700" onClick={openCreate}>+ เพิ่มลูกค้าใหม่</button>
      </div>

      <div className="bg-white p-4 rounded-md shadow">
        <input className="w-full md:w-1/2 border rounded-md px-3 py-2" placeholder="ค้นหาชื่อลูกค้า..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden">
        {loading ? (
          <div className="p-6">กำลังโหลด...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อบริษัท</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จังหวัด</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ผู้ติดต่อ</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.province || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.contacts?.length || 0}</td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button className="text-blue-600 mr-3" onClick={() => openEdit(c)}>แก้ไข</button>
                      <button className="text-red-600" onClick={() => handleDelete(c._id)}>ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {showEditor && (
        <div className="bg-white rounded-md shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท</label>
                <input className="w-full border rounded-md px-3 py-2" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                <input className="w-full border rounded-md px-3 py-2" value={province} onChange={e => setProvince(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">แบรนด์คู่เทียบ (ผู้ให้บริการปัจจุบัน/เจ้าประจำ)</label>
                <input className="w-full border rounded-md px-3 py-2" value={currentProviderBrand} onChange={e => setCurrentProviderBrand(e.target.value)} placeholder="เช่น XYZ Water Co." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รูปนามบัตร</label>
                {businessCardPreview && (<img src={businessCardPreview} alt="bc" className="h-24 object-cover rounded border mb-2" />)}
                <div
                  className={`mt-2 border-2 border-dashed rounded-md p-6 text-center transition-colors ${businessDragOver ? 'border-blue-400 bg-blue-50 animate-pulse' : 'text-gray-600 hover:border-gray-400'}`}
                  onDragEnter={(e) => { e.preventDefault(); setBusinessDragOver(true); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setBusinessDragOver(true); }}
                  onDragLeave={() => setBusinessDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setBusinessDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleUploadBusinessCard(f); }}
                  onClick={() => document.getElementById('customer-business-card-input')?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <div className="text-sm">ลากรูปมาวาง หรือ คลิกเพื่อเลือกไฟล์</div>
                    <div className="text-xs text-gray-500">รองรับการถ่ายจากกล้องมือถือ</div>
                    {uploadingBusiness && (
                      <div className="flex items-center gap-2 text-blue-600 text-sm mt-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                        กำลังอัปโหลด...
                      </div>
                    )}
                  </div>
                  <input id="customer-business-card-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleUploadBusinessCard(e.target.files?.[0])} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ข้อมูลผู้ติดต่อ</label>
              <ContactsEditor contacts={contacts} setContacts={setContacts} />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded-md border" onClick={() => { setShowEditor(false); resetEditor(); }}>ยกเลิก</button>
              <button type="submit" disabled={!canSave} className={`px-4 py-2 rounded-md text-white ${canSave ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'}`}>{editing ? 'บันทึกการแก้ไข' : 'เพิ่มลูกค้า'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

