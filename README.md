# PCK Sales Visit System

ระบบจัดการการเยี่ยมชมลูกค้าสำหรับทีมขาย พัฒนาด้วย React + Express + MongoDB และใช้ Microsoft OAuth2 สำหรับการเข้าสู่ระบบ

## 🏗️ โครงสร้างโปรเจค

```
pck-sales-visit-2/
├── api/                    # Backend API (Express.js)
│   ├── config/            # Database และ Logger configuration
│   ├── controllers/       # API Controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # MongoDB Models (Mongoose)
│   ├── routers/          # API Routes
│   ├── services/         # External services (S3, Google Cloud)
│   └── logs/             # Log files
└── web/                   # Frontend (React.js)
    └── src/
        └── components/    # React Components
```

## ✨ คุณสมบัติหลัก

### 🔐 Authentication & Authorization
- **Microsoft OAuth2**: เข้าสู่ระบบด้วย Corporate Microsoft Account
- **JWT + httpOnly Cookies**: ระบบ session ที่ปลอดภัย
- **Role-based Access**: บทบาทผู้ใช้ (admin, manager, sales)

### 🛡️ Security
- **Helmet**: Security headers
- **Rate Limiting**: ป้องกัน brute force attacks
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Joi schema validation

### 📱 Frontend Features
- **Responsive Design**: ใช้งานได้ทุกอุปกรณ์
- **Tailwind CSS**: Utility-first CSS framework
- **Modern UI**: Interface ที่สวยงามและใช้งานง่าย
- **Side Navigation**: เมนูด้านข้างที่ responsive

### 📊 Backend Features
- **RESTful API**: API ที่เป็นมาตรฐาน
- **MongoDB**: NoSQL database
- **Winston Logging**: ระบบ logging ที่ครบถ้วน
- **Error Handling**: จัดการข้อผิดพลาดอย่างเป็นระบบ

## 🚀 การติดตั้งและใช้งาน

### ข้อกำหนดเบื้องต้น
- Node.js (v18+)
- MongoDB (running on port 27001)
- Microsoft Azure AD Application (สำหรับ OAuth2)

### 1. ติดตั้ง Dependencies

```bash
# Backend
cd api
npm install

# Frontend
cd ../web
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `api` จาก `.env.example`:

```bash
cd api
cp .env.example .env
```

แก้ไขค่าต่างๆ ใน `.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration  
DB_HOST=mongodb://localhost:27001
DB_NAME=site-visit-2

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Microsoft OAuth2 Configuration
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_REDIRECT_URI=http://localhost:3001/api/v1/oauth/microsoft/callback
SESSION_SECRET=your-session-secret-key
```

### 3. ตั้งค่า Microsoft Azure AD

1. ไปที่ [Azure Portal](https://portal.azure.com)
2. สร้าง App Registration ใหม่
3. ตั้งค่า Redirect URI: `http://localhost:3001/api/v1/oauth/microsoft/callback`
4. สร้าง Client Secret
5. นำ Client ID, Client Secret, และ Tenant ID มาใส่ใน `.env`

### 4. เตรียมฐานข้อมูล

เริ่มต้น MongoDB และสร้างผู้ใช้ตัวอย่าง:

```bash
# เชื่อมต่อ MongoDB
mongosh --port 27001

# สร้าง database และ user ตัวอย่าง
use site-visit-2
db.users.insertOne({
  email: "your-email@company.com",
  firstName: "ชื่อ",
  lastName: "นามสกุล", 
  role: "sales",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 5. รันระบบ

```bash
# รัน Backend (Terminal 1)
cd api
npm run dev

# รัน Frontend (Terminal 2) 
cd web
npm run dev
```

เข้าใช้งานที่:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📋 API Endpoints

### Authentication
- `GET /api/v1/oauth/microsoft` - เริ่มต้น Microsoft OAuth login
- `POST /api/v1/oauth/microsoft/callback` - Callback จาก Microsoft
- `GET /api/v1/oauth/check` - ตรวจสอบสถานะการเข้าสู่ระบบ
- `GET /api/v1/oauth/me` - ดูข้อมูลผู้ใช้ปัจจุบัน
- `POST /api/v1/oauth/logout` - ออกจากระบบ

### User Management (Admin only)
- `GET /api/v1/users` - ดูรายชื่อผู้ใช้ทั้งหมด
- `GET /api/v1/users/:id` - ดูข้อมูลผู้ใช้
- `PATCH /api/v1/users/:id` - แก้ไขข้อมูลผู้ใช้
- `DELETE /api/v1/users/:id` - ลบผู้ใช้

### Health Check
- `GET /health` - ตรวจสอบสถานะ API

## 🔧 การพัฒนา

### โครงสร้าง User Model

```javascript
{
  email: String,           // อีเมลผู้ใช้
  firstName: String,       // ชื่อ
  lastName: String,        // นามสกุล
  displayName: String,     // ชื่อที่แสดง (จาก Microsoft)
  role: String,           // บทบาท (admin, manager, sales)
  isActive: Boolean,      // สถานะการใช้งาน
  microsoftId: String,    // Microsoft User ID
  tenantId: String,       // Microsoft Tenant ID
  lastLogin: Date         // เข้าสู่ระบบครั้งล่าสุด
}
```

### การเพิ่มผู้ใช้ใหม่

ผู้ใช้ใหม่ต้องถูกเพิ่มในฐานข้อมูลก่อน จึงจะสามารถเข้าสู่ระบบผ่าน Microsoft OAuth2 ได้

### Logging

ระบบใช้ Winston สำหรับ logging:
- **Development**: แสดง log ระดับ debug
- **Production**: แสดงเฉพาะ warning และ error
- Log files จะถูกเก็บในโฟลเดอร์ `api/logs/`

## 🛠️ เทคโนโลยีที่ใช้

### Backend
- **Express.js** - Web framework
- **MongoDB** + **Mongoose** - Database
- **Passport.js** + **passport-azure-ad** - Authentication
- **Winston** - Logging
- **Helmet** - Security
- **Joi** - Validation

### Frontend
- **React** - UI Library
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Heroicons** - Icons
- **Axios** - HTTP Client

## 📝 License

ISC
