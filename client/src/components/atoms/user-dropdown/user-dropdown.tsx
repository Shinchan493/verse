import { useContext, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from '../../../contexts/toast-context';
import useAuth from '../../../hooks/use-auth';

const UserDropdown = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { success } = useContext(ToastContext);
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  const logoutUser = async () => {
    await logout();
    success('Successfully logged out!');
    navigate('/login');
  };

  return (
    <div className="relative" onBlur={() => setShowDropdown(false)}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-9 h-9 bg-ink text-paper font-serif font-semibold flex justify-center items-center rounded-full flex-shrink-0 uppercase ring-2 ring-white shadow-sm hover:ring-accent-soft transition-all"
      >
        {email !== null && email[0]}
      </button>
      <CSSTransition
        nodeRef={dropdownRef}
        in={showDropdown}
        timeout={200}
        classNames="fade-in"
        unmountOnExit
        children={
          <div
            ref={dropdownRef}
            className="absolute top-full mt-2 right-0 z-10 w-60 bg-white py-1.5 rounded-xl shadow-lg border border-paper-2 font-sans"
          >
            <div className="px-4 py-2 border-b border-paper-2">
              <p className="text-xs text-ink-faint">Signed in as</p>
              <p className="text-sm font-medium text-ink truncate">
                {email !== null && email}
              </p>
            </div>
            <button
              onClick={logoutUser}
              className="w-full text-ink hover:bg-paper text-sm px-4 py-2.5 text-left transition-colors"
            >
              Log out
            </button>
          </div>
        }
      />
    </div>
  );
};

export default UserDropdown;
