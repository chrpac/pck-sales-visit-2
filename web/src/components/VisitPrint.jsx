import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function VisitPrint() {
  const { id } = useParams();
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

  const formatDateTime = (d) => d ? new Date(d).toLocaleString('th-TH') : '-';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH') : '-';
  const money = (n) => (typeof n === 'number' ? n.toLocaleString('th-TH') : '-');
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const fileSrc = (f) => (f?.key ? `${API_BASE}/api/v1/uploads/proxy?key=${encodeURIComponent(f.key)}` : f?.url);

  return (
    <div>
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print" style={{ padding: '12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 794, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600 }}>ตัวอย่างสำหรับพิมพ์</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => window.print()} className="px-3 py-2 rounded-md text-white" style={{ background: '#2563eb' }}>พิมพ์</button>
            <button onClick={() => window.close()} className="px-3 py-2 rounded-md border">ปิดแท็บ</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 794, margin: '0 auto', background: 'white' }}>
        {/* Header */}
        <div style={{ padding: 24, borderBottom: '2px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {(() => {
                const logoSrc = visit?.brand === 'PCKem' ? '/pckem.png' : (visit?.brand === 'Watreat' ? '/watreat.png' : null);
                return logoSrc ? (
                  <img src={logoSrc} alt="Company logo" style={{ height: 40, width: 'auto' }} />
                ) : null;
              })()}
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>บันทึกการเข้าพบลูกค้า</div>
                <div style={{ color: '#6b7280' }}>เอกสารสำหรับพิมพ์ (A4)</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', color: '#6b7280' }}>
              <div>เลขที่: {id}</div>
              <div>พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {loading ? (
            <div>กำลังโหลด...</div>
          ) : error ? (
            <div style={{ color: '#b91c1c' }}>{error}</div>
          ) : !visit ? null : (
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Section 1 */}
              <section style={{ border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <div style={{ background: '#f9fafb', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>ส่วนที่ 1 ข้อมูลพนักงานขาย</div>
                <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <Field label="วันที่เข้าพบ" value={formatDateTime(visit.visitAt)} />
                  <Field label="เข้าพบในนาม" value={visit.brand || '-'} />
                  <Field label="พนักงานขาย" value={visit.salesUser?.displayName || visit.salesNameManual || '-'} />
                </div>
              </section>

              {/* Section 2 */}
              <section style={{ border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <div style={{ background: '#f9fafb', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>ส่วนที่ 2 ข้อมูลลูกค้า</div>
                <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="ชื่อบริษัท" value={visit.customer?.name || visit.customerNameManual || '-'} />
                  <Field label="จังหวัด" value={visit.customer?.province || '-'} />
                </div>

                <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 6 }}>ผู้ติดต่อ</div>
                    {visit.customer?.contacts?.length ? (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {visit.customer.contacts.map((c, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                            <Small label="ชื่อ" value={c.name} />
                            <Small label="ตำแหน่ง" value={c.position || '-'} />
                            <Small label="เบอร์โทร" value={c.phone || '-'} />
                            <Small label="ผู้ตัดสินใจ" value={c.isDecisionMaker ? 'ใช่' : 'ไม่ใช่'} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#6b7280' }}>-</div>
                    )}
                  </div>

                  <div>
                    <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 6 }}>รูปนามบัตร</div>
                    {visit.customer?.businessCard ? (
                      <img src={fileSrc(visit.customer.businessCard)} alt="business-card" style={{ height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                    ) : (
                      <div style={{ color: '#6b7280' }}>-</div>
                    )}
                    <div style={{ color: '#6b7280', fontSize: 12, marginTop: 12 }}>แบรนด์คู่เทียบ</div>
                    <div style={{ fontWeight: 500 }}>{visit.customer?.currentProviderBrand || '-'}</div>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section style={{ border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <div style={{ background: '#f9fafb', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>ส่วนที่ 3 ข้อมูลสินค้า/บริการ</div>
                <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <Field label="ลักษณะงานที่เสนอขาย" value={visit.jobType || '-'} />
                  <Field label="งบประมาณ (บาท)" value={money(visit.budgetTHB)} />
                  <Field label="วัตถุประสงค์ในการเข้าพบ" value={visit.purpose || '-'} />
                </div>
              </section>

              {/* Section 4 */}
              <section style={{ border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <div style={{ background: '#f9fafb', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>ส่วนที่ 4 ผลการเข้าพบ</div>
                <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Block label="ผลิตภัณฑ์ที่นำเสนอ" value={visit.productPresented || '-'} />
                  <Block label="รายละเอียดการเข้าพบ" value={visit.details || '-'} />
                  <Block label="ต้องการความช่วยเหลือด้านใด" value={visit.needHelp || '-'} />
                  <Block label="เหตุผลที่ทำให้ขายได้" value={visit.winReason || '-'} />
                  <Field label="ประเมินผลการเข้าพบ" value={(visit.evaluationScore ?? '-')} />
                  <Field label="เข้าพบครั้งต่อไป" value={formatDate(visit.nextVisitAt)} />
                </div>

                {visit.photos?.length ? (
                  <div style={{ padding: 12 }}>
                    <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 6 }}>รูปถ่าย</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {visit.photos.map((p, idx) => (
                        <img key={idx} src={fileSrc(p)} alt={`photo-${idx}`} style={{ height: 120, width: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ color: '#6b7280', fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function Small({ label, value }) {
  return (
    <div>
      <div style={{ color: '#9ca3af', fontSize: 10 }}>{label}</div>
      <div style={{ fontSize: 12 }}>{value}</div>
    </div>
  );
}

function Block({ label, value }) {
  return (
    <div style={{ gridColumn: 'span 1 / span 1' }}>
      <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ whiteSpace: 'pre-wrap' }}>{value}</div>
    </div>
  );
}


