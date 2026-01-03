import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Hotel Management System</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{user?.email}</span>
          </div>
          <Button variant="outline" onClick={signOut}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

