import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b z-30">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Button - Mobile Only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Eesha Residency</h2>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Management System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
            <span className="font-medium">{user?.email}</span>
          </div>
          <Button 
            variant="outline" 
            onClick={signOut}
            className="text-xs sm:text-sm px-3 sm:px-4 py-2"
          >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

