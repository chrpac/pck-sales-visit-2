import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const BRANDS = ['PCKem', 'Watreat'];
const JOB_TYPES = ['Chemical Service', 'Project', 'Maintenance', 'Trading'];
const PURPOSES = [
  'แนะนำบริษัท/สินค้า/เก็บข้อมูล',
  'เสนอสินค้า/บริการ',
  'สำรวจ/เก็บข้อมูลเพิ่มเติม',
  'สรุปปิดการขาย/ต่อรองราคา',
  'ติดตามใบเสนอราคา/ข้อเสนอ',
  'เข้าพบเพื่อสร้างความสัมพันธ์',
  'พูดคุยปัญหา สินค้า/บริการ',
];

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

function VisitForm() {
  const navigate = useNavigate();
  const { id: visitId } = useParams();

  // Section 1: Sales info
  const [salesSearch, setSalesSearch] = useState('');
  const [salesOptions, setSalesOptions] = useState([]);
  const [selectedSales, setSelectedSales] = useState(null);
  const [salesOpen, setSalesOpen] = useState(false);
  const [manualSales, setManualSales] = useState(false);
  const [salesNameManual, setSalesNameManual] = useState('');
  const [brand, setBrand] = useState('PCKem');
  const [visitAt, setVisitAt] = useState(() => new Date().toISOString().slice(0,16)); // yyyy-MM-ddTHH:mm

  // Section 2: Customer info
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [customerNameManual, setCustomerNameManual] = useState('');
  const [province, setProvince] = useState('');
  const [currentProviderBrand, setCurrentProviderBrand] = useState('');
  const [contacts, setContacts] = useState([{ name: '', position: '', isDecisionMaker: false }]);
  const [businessCard, setBusinessCard] = useState(null); // { url, key, provider }
  const [businessCardPreview, setBusinessCardPreview] = useState('');
  const [businessDragOver, setBusinessDragOver] = useState(false);
  const [uploadingBusiness, setUploadingBusiness] = useState(false);

  // Utilities
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const fileSrc = (f) => (f?.key ? `${API_BASE}/api/v1/uploads/proxy?key=${encodeURIComponent(f.key)}` : f?.url);

  // Section 3: Offering
  const [jobType, setJobType] = useState('');
  const [budgetTHB, setBudgetTHB] = useState('');
  const [purpose, setPurpose] = useState('');

  // Section 4: Result
  const [productPresented, setProductPresented] = useState('');
  const [details, setDetails] = useState('');
  const [needHelp, setNeedHelp] = useState('');
  const [winReason, setWinReason] = useState('');
  const [evaluationScore, setEvaluationScore] = useState(0);
  const [nextActionPlan, setNextActionPlan] = useState('');
  const [nextVisitAt, setNextVisitAt] = useState('');
  const [photos, setPhotos] = useState([]); // [{ url, key, provider }]
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [photosDragOver, setPhotosDragOver] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const debouncedSalesSearch = useDebouncedValue(salesSearch);
  const debouncedCustomerSearch = useDebouncedValue(customerSearch);

  // Search sales options
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await axios.get('/api/v1/users/sales', {
          params: { search: debouncedSalesSearch, limit: 10 },
        });
        if (active) setSalesOptions(res.data.data.users || []);
      } catch (e) {
        // ignore silently for dropdown
      }
    };
    load();
    return () => { active = false; };
  }, [debouncedSalesSearch]);

  // Search customers options
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await axios.get('/api/v1/customers', { params: { search: debouncedCustomerSearch || undefined, limit: 10 } });
        if (active) setCustomerOptions(res.data.data || []);
      } catch (e) {
        // ignore silently for dropdown
      }
    };
    load();
    return () => { active = false; };
  }, [debouncedCustomerSearch]);

  // Load visit for edit
  useEffect(() => {
    if (!visitId) return;
    (async () => {
      try {
        const res = await axios.get(`/api/v1/visits/${visitId}`);
        const v = res.data.data || res.data;
        // Sales
        if (v.salesUser) { setSelectedSales(v.salesUser); setManualSales(false); }
        if (v.salesNameManual) { setManualSales(true); setSalesNameManual(v.salesNameManual); }
        setBrand(v.brand);
        setVisitAt(new Date(v.visitAt).toISOString().slice(0,16));
        // Customer
        if (v.customer) { setSelectedCustomer(v.customer); setCustomerSearch(v.customer.name); setNewCustomerMode(false); }
        setProvince(v.customer?.province || '');
        setCurrentProviderBrand(v.customer?.currentProviderBrand || '');
        setContacts(v.customer?.contacts?.length ? v.customer.contacts : [{ name: '', position: '', isDecisionMaker: false }]);
        if (v.customer?.businessCard?.url || v.customer?.businessCard?.key) {
          setBusinessCard(v.customer.businessCard);
          setBusinessCardPreview(fileSrc(v.customer.businessCard));
        }
        // Offering
        setJobType(v.jobType || '');
        setBudgetTHB(v.budgetTHB || '');
        setPurpose(v.purpose || '');
        // Result
        setProductPresented(v.productPresented || '');
        setDetails(v.details || '');
        setNeedHelp(v.needHelp || '');
        setWinReason(v.winReason || '');
        setEvaluationScore(v.evaluationScore || 0);
        setNextActionPlan(v.nextActionPlan || '');
        setNextVisitAt(v.nextVisitAt ? new Date(v.nextVisitAt).toISOString().slice(0,10) : '');
        setPhotos(v.photos || []);
        setPhotoPreviews((v.photos || []).map(p => fileSrc(p)));
      } catch (e) {
        setError('โหลดข้อมูลการเข้าพบไม่สำเร็จ');
      }
    })();
  }, [visitId]);

  useEffect(() => {
    if (selectedCustomer) {
      setProvince(selectedCustomer.province || '');
      setCurrentProviderBrand(selectedCustomer.currentProviderBrand || '');
      setContacts(selectedCustomer.contacts?.length ? selectedCustomer.contacts : [{ name: '', position: '', isDecisionMaker: false }]);
      if (selectedCustomer.businessCard?.url || selectedCustomer.businessCard?.key) {
        setBusinessCard({ ...selectedCustomer.businessCard });
        setBusinessCardPreview(fileSrc(selectedCustomer.businessCard));
      } else {
        setBusinessCard(null);
        setBusinessCardPreview('');
      }
    }
  }, [selectedCustomer]);

  const addContactRow = () => setContacts(prev => [...prev, { name: '', position: '', isDecisionMaker: false }]);
  const removeContactRow = (idx) => setContacts(prev => prev.filter((_, i) => i !== idx));
  const updateContact = (idx, key, value) => setContacts(prev => prev.map((c, i) => i === idx ? { ...c, [key]: value } : c));

  const handleBusinessCardSelect = async (file) => {
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

  const handlePhotosSelect = async (files) => {
    const arr = Array.from(files).slice(0, 3 - photos.length);
    const newPreviews = arr.map(f => URL.createObjectURL(f));
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
    setUploadingPhotos(true);
    for (const file of arr) {
      try {
        const ct = file.type || 'application/octet-stream';
        const presign = await axios.post('/api/v1/uploads/presign', null, { params: { type: 'visit-photos', filename: file.name, contentType: ct } });
        const { url, key, provider } = presign.data.data;
        await fetch(url, { method: 'PUT', headers: { 'Content-Type': ct }, body: file });
        setPhotos(prev => [...prev, { url: url.split('?')[0], key, provider }]);
      } catch (e) {
        setError('อัปโหลดรูปถ่ายไม่สำเร็จบางรายการ');
      }
    }
    setUploadingPhotos(false);
  };

  const canSubmit = useMemo(() => {
    const salesOk = manualSales ? !!salesNameManual : !!selectedSales;
    const customerOk = !!selectedCustomer || (newCustomerMode && !!customerNameManual);
    return salesOk && brand && visitAt && customerOk;
  }, [manualSales, salesNameManual, selectedSales, brand, visitAt, selectedCustomer, newCustomerMode, customerNameManual]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        brand,
        visitAt: new Date(visitAt).toISOString(),
        salesUser: manualSales ? undefined : selectedSales?._id,
        salesNameManual: manualSales ? salesNameManual : undefined,
        customer: (!newCustomerMode && selectedCustomer)?._id,
        jobType: jobType || undefined,
        budgetTHB: budgetTHB ? Number(budgetTHB) : undefined,
        purpose: purpose || undefined,
        productPresented: productPresented || undefined,
        details: details || undefined,
        needHelp: needHelp || undefined,
        winReason: winReason || undefined,
        evaluationScore,
        nextActionPlan: nextActionPlan || undefined,
        nextVisitAt: nextVisitAt ? new Date(nextVisitAt).toISOString() : undefined,
        photos,
      };
      if (newCustomerMode) {
        payload.newCustomer = {
          name: customerNameManual,
          province,
          currentProviderBrand: currentProviderBrand || undefined,
          contacts: contacts.filter(c => c.name?.trim()),
          businessCard: businessCard || undefined,
        };
      } else if (selectedCustomer) {
        payload.customerUpdate = {
          province,
          currentProviderBrand: currentProviderBrand || undefined,
          contacts: contacts.filter(c => c.name?.trim()),
          businessCard: businessCard || undefined,
        };
      }
      if (visitId) {
        const res = await axios.patch(`/api/v1/visits/${visitId}`, payload);
        if (res.status === 200) navigate(`/visits/${visitId}`);
      } else {
        const res = await axios.post('/api/v1/visits', payload);
        if (res.status === 201) navigate('/dashboard');
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">ส่วนที่ 1 ข้อมูลพนักงานขาย</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อพนักงานขาย</label>
            {!manualSales && (
              <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setSalesOpen(false); }}>
                <button
                  id="sales-dropdown-button"
                  type="button"
                  className="w-full text-left bg-white border hover:border-gray-400 focus:ring-2 focus:ring-blue-300 rounded-md text-sm px-3 py-2 inline-flex items-center justify-between"
                  onClick={() => {
                    const nextOpen = !salesOpen;
                    setSalesOpen(nextOpen);
                    if (nextOpen && selectedSales) setSalesSearch('');
                  }}
                >
                  <span className="truncate">
                    {selectedSales ? (selectedSales.displayName || `${selectedSales.firstName || ''} ${selectedSales.lastName || ''}`) : 'เลือกพนักงานขาย'}
                  </span>
                  <svg className="w-3 h-3 ms-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                  </svg>
                </button>

                {salesOpen && (
                  <div id="sales-dropdown" className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-sm border">
                    <div className="p-3">
                      <label htmlFor="sales-input-search" className="sr-only">ค้นหา</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                          </svg>
                        </div>
                        <input
                          id="sales-input-search"
                          type="text"
                          className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="ค้นหาพนักงานขาย"
                          value={salesSearch}
                          onChange={(e) => setSalesSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <ul className="max-h-56 px-3 pb-3 overflow-y-auto text-sm text-gray-700" aria-labelledby="sales-dropdown-button">
                      {salesOptions.length === 0 && (
                        <li className="px-2 py-2 text-gray-500">ไม่พบรายการ</li>
                      )}
                      {salesOptions.map((u) => {
                        const name = u.displayName || `${u.firstName || ''} ${u.lastName || ''}`;
                        const checked = selectedSales?._id === u._id;
                        const inputId = `sales-option-${u._id}`;
                        return (
                          <li key={u._id}>
                            <button
                              type="button"
                              className={`w-full flex items-center ps-2 py-2 rounded-sm hover:bg-gray-100 ${checked ? 'bg-blue-50' : ''}`}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { setSelectedSales(u); setSalesSearch(''); setSalesOpen(false); }}
                            >
                              <input
                                id={inputId}
                                type="radio"
                                name="sales-user"
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500"
                                readOnly
                                checked={checked}
                              />
                              <label htmlFor={inputId} className="w-full ms-2 text-sm font-medium text-gray-900 text-left truncate">{name}</label>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {selectedSales && (
                  <p className="text-sm text-gray-600 mt-1">เลือกแล้ว: {selectedSales.displayName || `${selectedSales.firstName || ''} ${selectedSales.lastName || ''}`}</p>
                )}
              </div>
            )}
            <div className="flex items-center mt-2">
              <input id="manualSales" type="checkbox" className="mr-2" checked={manualSales} onChange={e => { setManualSales(e.target.checked); setSelectedSales(null); setSalesSearch(''); }} />
              <label htmlFor="manualSales" className="text-sm text-gray-700">กรอกชื่อพนักงานขายด้วยตัวเอง</label>
            </div>
            {manualSales && (
              <input type="text" className="mt-2 w-full border rounded-md px-3 py-2" value={salesNameManual} onChange={e => setSalesNameManual(e.target.value)} placeholder="เช่น คุณสมชาย ใจดี" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เข้าพบในนาม</label>
            <select className="w-full border rounded-md px-3 py-2" value={brand} onChange={e => setBrand(e.target.value)}>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เข้าพบ</label>
            <input type="datetime-local" className="w-full border rounded-md px-3 py-2" value={visitAt} onChange={e => setVisitAt(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">ส่วนที่ 2 ข้อมูลลูกค้า</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท</label>
            {!newCustomerMode && (
              <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setCustomerOpen(false); }}>
                <button
                  id="customer-dropdown-button"
                  type="button"
                  className="w-full text-left bg-white border hover:border-gray-400 focus:ring-2 focus:ring-blue-300 rounded-md text-sm px-3 py-2 inline-flex items-center justify-between"
                  onClick={() => {
                    const nextOpen = !customerOpen;
                    setCustomerOpen(nextOpen);
                    if (nextOpen && selectedCustomer) setCustomerSearch('');
                  }}
                >
                  <span className="truncate">
                    {selectedCustomer ? selectedCustomer.name : 'เลือกบริษัท'}
                  </span>
                  <svg className="w-3 h-3 ms-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                  </svg>
                </button>

                {customerOpen && (
                  <div id="customer-dropdown" className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-sm border">
                    <div className="p-3">
                      <label htmlFor="customer-input-search" className="sr-only">ค้นหา</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                          </svg>
                        </div>
                        <input
                          id="customer-input-search"
                          type="text"
                          className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="ค้นหาบริษัท"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <ul className="max-h-56 px-3 pb-3 overflow-y-auto text-sm text-gray-700" aria-labelledby="customer-dropdown-button">
                      {customerOptions.length === 0 && (
                        <li className="px-2 py-2 text-gray-500">ไม่พบรายการ</li>
                      )}
                      {customerOptions.map((c) => {
                        const checked = selectedCustomer?._id === c._id;
                        const inputId = `customer-option-${c._id}`;
                        return (
                          <li key={c._id}>
                            <button
                              type="button"
                              className={`w-full flex items-center ps-2 py-2 rounded-sm hover:bg-gray-100 ${checked ? 'bg-blue-50' : ''}`}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerOpen(false); }}
                            >
                              <input
                                id={inputId}
                                type="radio"
                                name="customer"
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500"
                                readOnly
                                checked={checked}
                              />
                              <label htmlFor={inputId} className="w-full ms-2 text-sm font-medium text-gray-900 text-left truncate">{c.name}</label>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center mt-2">
              <input id="newCustomer" type="checkbox" className="mr-2" checked={newCustomerMode} onChange={e => { setNewCustomerMode(e.target.checked); setSelectedCustomer(null); }} />
              <label htmlFor="newCustomer" className="text-sm text-gray-700">เพิ่มลูกค้าใหม่/กรอกเอง</label>
            </div>
            {newCustomerMode && (
              <input type="text" className="mt-2 w-full border rounded-md px-3 py-2" placeholder="ชื่อบริษัท" value={customerNameManual} onChange={e => setCustomerNameManual(e.target.value)} />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
            <input type="text" className="w-full border rounded-md px-3 py-2" value={province} onChange={e => setProvince(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">แบรนด์คู่เทียบ (ผู้ให้บริการปัจจุบัน/เจ้าประจำ)</label>
            <input type="text" className="w-full border rounded-md px-3 py-2" value={currentProviderBrand} onChange={e => setCurrentProviderBrand(e.target.value)} placeholder="เช่น XYZ Water Co." />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">ข้อมูลผู้ติดต่อ</label>
            <div className="space-y-2">
              {contacts.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                  <input type="text" placeholder="ชื่อผู้ติดต่อ" className="border rounded-md px-3 py-2" value={row.name} onChange={e => updateContact(idx, 'name', e.target.value)} />
                  <input type="text" placeholder="ตำแหน่ง" className="border rounded-md px-3 py-2" value={row.position} onChange={e => updateContact(idx, 'position', e.target.value)} />
                  <input type="text" placeholder="เบอร์โทรศัพท์" className="border rounded-md px-3 py-2" value={row.phone || ''} onChange={e => updateContact(idx, 'phone', e.target.value)} />
                  <div className="flex items-center">
                    <input id={`dm-${idx}`} type="checkbox" className="mr-2" checked={row.isDecisionMaker} onChange={e => updateContact(idx, 'isDecisionMaker', e.target.checked)} />
                    <label htmlFor={`dm-${idx}`} className="text-sm">ผู้มีอำนาจตัดสินใจ</label>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" className="text-sm text-red-600" onClick={() => removeContactRow(idx)}>ลบ</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 text-sm text-blue-600" onClick={addContactRow}>+ เพิ่มผู้ติดต่อ</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รูปนามบัตร</label>
            {businessCardPreview && (
              <img src={businessCardPreview} alt="business-card" className="h-24 object-cover rounded border mb-2" />
            )}
            <div
              className={`mt-2 border-2 border-dashed rounded-md p-6 text-center transition-colors ${businessDragOver ? 'border-blue-400 bg-blue-50 animate-pulse' : 'text-gray-600 hover:border-gray-400'}`}
              onDragEnter={(e) => { e.preventDefault(); setBusinessDragOver(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setBusinessDragOver(true); }}
              onDragLeave={() => setBusinessDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setBusinessDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleBusinessCardSelect(f); }}
              onClick={() => document.getElementById('business-card-input')?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div className="text-sm">ลากรูปมาวาง หรือ คลิกเพื่อเลือกไฟล์</div>
                <div className="text-xs text-gray-500">รองรับการถ่ายรูปจากกล้องมือถือ</div>
                {uploadingBusiness && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm mt-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                    กำลังอัปโหลด...
                  </div>
                )}
              </div>
              <input id="business-card-input" type="file" accept="image/*" className="hidden" onChange={e => handleBusinessCardSelect(e.target.files?.[0])} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">ส่วนที่ 3 ข้อมูลสินค้า/บริการ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ลักษณะงานที่เสนอขาย</label>
            <select className="w-full border rounded-md px-3 py-2" value={jobType} onChange={e => setJobType(e.target.value)}>
              <option value="">- เลือก -</option>
              {JOB_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">งบประมาณ (บาท)</label>
            <input type="number" min="0" className="w-full border rounded-md px-3 py-2" value={budgetTHB} onChange={e => setBudgetTHB(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วัตถุประสงค์ในการเข้าพบ</label>
            <select className="w-full border rounded-md px-3 py-2" value={purpose} onChange={e => setPurpose(e.target.value)}>
              <option value="">- เลือก -</option>
              {PURPOSES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">ส่วนที่ 4 ผลการเข้าพบ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ผลิตภัณฑ์ที่นำเสนอ</label>
            <textarea className="w-full border rounded-md px-3 py-2" rows="2" value={productPresented} onChange={e => setProductPresented(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดการเข้าพบ</label>
            <textarea className="w-full border rounded-md px-3 py-2" rows="4" value={details} onChange={e => setDetails(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ต้องการความช่วยเหลือด้านใด</label>
            <input className="w-full border rounded-md px-3 py-2" value={needHelp} onChange={e => setNeedHelp(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เหตุผลที่ทำให้ขายได้</label>
            <input className="w-full border rounded-md px-3 py-2" value={winReason} onChange={e => setWinReason(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ประเมินผลการเข้าพบ: {evaluationScore}</label>
            <input type="range" min={-5} max={5} value={evaluationScore} onChange={e => setEvaluationScore(parseInt(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">แผนการดำเนินงานต่อไป</label>
            <input className="w-full border rounded-md px-3 py-2" value={nextActionPlan} onChange={e => setNextActionPlan(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เข้าพบครั้งต่อไป</label>
            <input type="date" className="w-full border rounded-md px-3 py-2" value={nextVisitAt} onChange={e => setNextVisitAt(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">รูปถ่าย (สูงสุด 3 รูป)</label>
            <div className="flex gap-2 mb-2">
              {photoPreviews.map((src, idx) => (
                <img key={idx} src={src} alt={`visit-${idx}`} className="h-24 w-24 object-cover rounded border" />
              ))}
            </div>
            <div
              className={`mt-1 border-2 border-dashed rounded-md p-6 text-center transition-colors ${photosDragOver ? 'border-blue-400 bg-blue-50 animate-pulse' : 'text-gray-600 hover:border-gray-400'}`}
              onDragEnter={(e) => { e.preventDefault(); setPhotosDragOver(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setPhotosDragOver(true); }}
              onDragLeave={() => setPhotosDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setPhotosDragOver(false); const fs = e.dataTransfer.files; if (fs && fs.length) handlePhotosSelect(fs); }}
              onClick={() => document.getElementById('visit-photos-input')?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" ry="2"/>
                  <circle cx="8.5" cy="12" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <div className="text-sm">ลากรูปมาวาง หรือ คลิกเพื่อเลือกไฟล์</div>
                <div className="text-xs text-gray-500">รองรับกล้องมือถือ สูงสุด 3 รูป</div>
                {uploadingPhotos && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm mt-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                    กำลังอัปโหลด...
                  </div>
                )}
              </div>
              <input id="visit-photos-input" type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotosSelect(e.target.files)} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

          <div className="flex justify-end">
            <button type="button" className="px-4 py-2 rounded-md border mr-2" onClick={() => navigate(-1)}>ยกเลิก</button>
        <button type="submit" disabled={!canSubmit || submitting} className={`px-4 py-2 rounded-md text-white ${canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'} `}>
          {submitting ? 'กำลังบันทึก...' : (visitId ? 'บันทึกการแก้ไข' : 'บันทึกการเข้าพบ')}
        </button>
          </div>
    </form>
  );
}

export default VisitForm;
