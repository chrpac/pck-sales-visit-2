import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

export default function VisitDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/v1/visits/${id}`);
        setVisit(res.data.data || res.data);
      } catch (e) {
        setError('โหลดข้อมูลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const isOwner = useMemo(() => {
    if (!visit || !user) return false;
    return String(visit.createdBy) === String(user._id);
  }, [visit, user]);

  const onDelete = async () => {
    if (!window.confirm('ยืนยันลบรายการนี้?')) return;
    try {
      await axios.delete(`/api/v1/visits/${id}`);
      navigate('/dashboard');
    } catch (e) {
      setError('ลบรายการไม่สำเร็จ');
    }
  };

  if (loading) return <div className="p-6">กำลังโหลด...</div>;
  if (error) return <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  if (!visit) return null;

  const formatDateTime = (d) => d ? new Date(d).toLocaleString('th-TH') : '-';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH') : '-';
  const money = (n) => (typeof n === 'number' ? n.toLocaleString('th-TH') : '-');
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const fileSrc = (f) => (f?.key ? `${API_BASE}/api/v1/uploads/proxy?key=${encodeURIComponent(f.key)}` : f?.url);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">รายละเอียดการเข้าพบ</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-md border" onClick={() => window.open(`/visits/${id}/print`, '_blank')}>พิมพ์</button>
          {isOwner && (
            <>
              <button className="px-3 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/visits/${id}/edit`)}>แก้ไข</button>
              <button className="px-3 py-2 rounded-md text-white bg-red-600 hover:bg-red-700" onClick={onDelete}>ลบ</button>
            </>
          )}
        </div>
      </div>

      {/* ส่วนที่ 1 ข้อมูลพนักงานขาย */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">ส่วนที่ 1 ข้อมูลพนักงานขาย</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-gray-500 text-sm">วันที่เข้าพบ</div>
            <div className="font-medium">{formatDateTime(visit.visitAt)}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">เข้าพบในนาม</div>
            <div className="font-medium">{visit.brand || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">พนักงานขาย</div>
            <div className="font-medium">{visit.salesUser?.displayName || visit.salesNameManual || '-'}</div>
          </div>
        </div>
      </div>

      {/* ส่วนที่ 2 ข้อมูลลูกค้า */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">ส่วนที่ 2 ข้อมูลลูกค้า</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-gray-500 text-sm">ชื่อบริษัท</div>
            <div className="font-medium">{visit.customer?.name || visit.customerNameManual || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">จังหวัด</div>
            <div className="font-medium">{visit.customer?.province || '-'}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-gray-500 text-sm mb-2">ผู้ติดต่อ</div>
            {visit.customer?.contacts?.length ? (
              <div className="space-y-2">
                {visit.customer.contacts.map((c, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div><span className="text-gray-500 text-xs">ชื่อ</span><div className="font-medium">{c.name}</div></div>
                    <div><span className="text-gray-500 text-xs">ตำแหน่ง</span><div className="font-medium">{c.position || '-'}</div></div>
                    <div><span className="text-gray-500 text-xs">เบอร์โทร</span><div className="font-medium">{c.phone || '-'}</div></div>
                    <div><span className="text-gray-500 text-xs">ผู้ตัดสินใจ</span><div className="font-medium">{c.isDecisionMaker ? 'ใช่' : 'ไม่ใช่'}</div></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">-</div>
            )}
          </div>

          <div>
            <div className="text-gray-500 text-sm mb-2">รูปนามบัตร</div>
            {visit.customer?.businessCard ? (
              <img src={fileSrc(visit.customer.businessCard)} alt="business-card" className="h-28 object-cover rounded border" />
            ) : (
              <div className="text-gray-500">-</div>
            )}
            <div className="text-gray-500 text-sm mt-4">แบรนด์คู่เทียบ</div>
            <div className="font-medium">{visit.customer?.currentProviderBrand || '-'}</div>
          </div>
        </div>
      </div>

      {/* ส่วนที่ 3 ข้อมูลสินค้า/บริการ */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">ส่วนที่ 3 ข้อมูลสินค้า/บริการ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-gray-500 text-sm">ลักษณะงานที่เสนอขาย</div>
            <div className="font-medium">{visit.jobType || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">งบประมาณ (บาท)</div>
            <div className="font-medium">{money(visit.budgetTHB)}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">วัตถุประสงค์ในการเข้าพบ</div>
            <div className="font-medium">{visit.purpose || '-'}</div>
          </div>
        </div>
      </div>

      {/* ส่วนที่ 4 ผลการเข้าพบ */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">ส่วนที่ 4 ผลการเข้าพบ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <div className="text-gray-500 text-sm mb-1">ผลิตภัณฑ์ที่นำเสนอ</div>
            <div className="whitespace-pre-wrap">{visit.productPresented || '-'}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-gray-500 text-sm mb-1">รายละเอียดการเข้าพบ</div>
            <div className="whitespace-pre-wrap">{visit.details || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">ต้องการความช่วยเหลือด้านใด</div>
            <div className="whitespace-pre-wrap">{visit.needHelp || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">เหตุผลที่ทำให้ขายได้</div>
            <div className="whitespace-pre-wrap">{visit.winReason || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">ประเมินผลการเข้าพบ</div>
            <div className="whitespace-pre-wrap">{(visit.evaluationScore ?? '-')}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">แผนการดำเนินงานต่อไป</div>
            <div className="whitespace-pre-wrap">{visit.nextActionPlan || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">เข้าพบครั้งต่อไป</div>
            <div className="whitespace-pre-wrap">{formatDate(visit.nextVisitAt)}</div>
          </div>
        </div>

        {visit.photos?.length ? (
          <div className="mt-6">
            <div className="text-gray-500 text-sm mb-2">รูปถ่าย</div>
            <div className="flex gap-2 flex-wrap">
              {visit.photos.map((p, idx) => (
                <img key={idx} src={fileSrc(p)} alt={`photo-${idx}`} className="h-28 w-28 object-cover rounded border" />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

