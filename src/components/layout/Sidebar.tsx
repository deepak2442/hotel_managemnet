import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '🏠' },
  { name: 'Rooms', href: '/rooms', icon: '🚪' },
  { name: 'Check-In', href: '/check-in', icon: '✅' },
  { name: 'Check-Out', href: '/check-out', icon: '🚪' },
  { name: 'Reports', href: '/reports', icon: '📊' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Hotel Admin</h1>
      </div>
      <nav className="mt-8">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors',
                isActive && 'bg-gray-800 text-white border-r-4 border-blue-500'
              )}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

