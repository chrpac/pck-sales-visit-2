import { 
  ChartBarIcon, 
  UserGroupIcon, 
  MapPinIcon,
  CalendarDaysIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

function Dashboard({ user }) {
  const stats = [
    {
      name: 'การเยี่ยมชมทั้งหมด',
      stat: '12',
      icon: MapPinIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'การเยี่ยมชมเดือนนี้',
      stat: '4',
      icon: CalendarDaysIcon,
      color: 'bg-green-500',
    },
    {
      name: 'ลูกค้าที่เยี่ยมชม',
      stat: '8',
      icon: UserGroupIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'รายงานรอดำเนินการ',
      stat: '2',
      icon: ChartBarIcon,
      color: 'bg-red-500',
    },
  ];

  const recentVisits = [
    {
      id: 1,
      customer: 'บริษัท ABC จำกัด',
      date: '2024-01-15',
      status: 'completed',
      location: 'กรุงเทพมหานคร',
    },
    {
      id: 2,
      customer: 'บริษัท XYZ จำกัด',
      date: '2024-01-12',
      status: 'completed',
      location: 'นนทบุรี',
    },
    {
      id: 3,
      customer: 'บริษัท DEF จำกัด',
      date: '2024-01-10',
      status: 'in-progress',
      location: 'ปทุมธานี',
    },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': {
        color: 'bg-green-100 text-green-800',
        text: 'เสร็จสิ้น'
      },
      'in-progress': {
        color: 'bg-yellow-100 text-yellow-800',
        text: 'กำลังดำเนินการ'
      },
      'planned': {
        color: 'bg-blue-100 text-blue-800',
        text: 'วางแผนไว้'
      }
    };

    const config = statusConfig[status] || statusConfig['planned'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                สวัสดี, {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-600">
                ยินดีต้อนรับสู่ระบบจัดการการเยี่ยมชมลูกค้า
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${item.color}`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {item.stat}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">การดำเนินการด่วน</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <PlusIcon className="h-5 w-5 mr-2" />
              เพิ่มการเยี่ยมชมใหม่
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <EyeIcon className="h-5 w-5 mr-2" />
              ดูรายงานทั้งหมด
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <CalendarDaysIcon className="h-5 w-5 mr-2" />
              ตารางการเยี่ยมชม
            </button>
          </div>
        </div>
      </div>

      {/* Recent visits */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">การเยี่ยมชมล่าสุด</h2>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานที่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {visit.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(visit.date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {visit.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(visit.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
