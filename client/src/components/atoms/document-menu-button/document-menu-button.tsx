import { useContext, useRef, useState, FocusEvent } from 'react';
import useAuth from '../../../hooks/use-auth';
import { CSSTransition } from 'react-transition-group';
import { ToastContext } from '../../../contexts/toast-context';
import DocumentService from '../../../services/document-service';
import DocumentInterface from '../../../types/interfaces/document';

interface DocumentMenuButtonProps {
  documentId: number;
  setDocuments: Function;
}

const DocumentMenuButton = ({
  documentId,
  setDocuments,
}: DocumentMenuButtonProps) => {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { error } = useContext(ToastContext);

  const toggleDropdown = () => {
    setConfirming(false);
    setShowDropdown((prev) => !prev);
  };

  const handleMenuBtnBlur = (event: FocusEvent<HTMLButtonElement>) => {
    const classList = (event.target as HTMLButtonElement).classList;

    if (!classList.contains('document-menu')) {
      setShowDropdown(false);
      setConfirming(false);
    }
  };

  const handleDeleteBtnClick = async () => {
    if (accessToken === null) return;

    setLoading(true);

    try {
      await DocumentService.delete(accessToken, documentId);
      setDocuments((allDocuments: Array<DocumentInterface>) =>
        allDocuments.filter((document) => document.id !== documentId)
      );
    } catch (err) {
      error('Unable to delete document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative flex justify-center document-menu-btn-${documentId}`}
    >
      <button
        onClick={toggleDropdown}
        onBlur={handleMenuBtnBlur}
        className={`text-ink-faint hover:text-ink hover:bg-paper-2 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors document-menu-btn-${documentId}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className={`w-5 h-5 document-menu-btn-${documentId}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className={`document-menu-btn-${documentId}`}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          ></path>
        </svg>
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
            onMouseDown={(e) => e.preventDefault()}
            className="absolute top-full right-0 mt-1 z-10 w-52 bg-white py-1.5 rounded-lg shadow-lg border border-paper-2 document-menu"
          >
            {!confirming ? (
              <div
                onClick={() => setConfirming(true)}
                className="w-full text-red-600 hover:bg-paper text-sm px-4 py-2 text-left cursor-pointer document-menu"
              >
                Delete
              </div>
            ) : (
              <div className="px-4 py-2 document-menu">
                <p className="text-sm text-ink document-menu">
                  Delete this document?
                </p>
                <p className="text-xs text-ink-faint mt-0.5 document-menu">
                  This can’t be undone.
                </p>
                <div className="flex items-center gap-2 mt-2.5 document-menu">
                  <button
                    onClick={() => (!loading ? handleDeleteBtnClick() : null)}
                    disabled={loading}
                    className="text-xs font-semibold text-paper bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md document-menu"
                  >
                    {loading ? 'Deleting…' : 'Delete'}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="text-xs font-semibold text-ink-soft hover:text-ink px-2 py-1.5 document-menu"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />
    </div>
  );
};

export default DocumentMenuButton;
