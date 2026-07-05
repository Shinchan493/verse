import useAuth from '../../../hooks/use-auth';
import DocumentInterface from '../../../types/interfaces/document';
import { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentMenuButton from '../document-menu-button';

interface DocumentCardProps {
  document: DocumentInterface;
  setDocuments: Function;
}

const DocumentCard = ({ document, setDocuments }: DocumentCardProps) => {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const handleDocumentBtnClick = (
    event: MouseEvent<HTMLLIElement>,
    documentId: number
  ) => {
    const classList = (event.target as HTMLElement).classList;
    if (
      !classList.contains(`document-menu-btn-${documentId}`) &&
      !classList.contains('document-menu')
    )
      navigate(`/document/${documentId}`);
  };

  return (
    <li
      onClick={(event) => handleDocumentBtnClick(event, document.id)}
      className="group flex items-center gap-4 px-4 sm:px-5 py-3.5 hover:bg-paper cursor-pointer transition-colors"
    >
      {/* Doc glyph */}
      <span className="grid place-items-center w-9 h-9 rounded-lg bg-accent-tint text-accent flex-shrink-0">
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM13 3v5h5M9 13h6M9 17h4"
          />
        </svg>
      </span>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink truncate">
          {document.title ? document.title : 'Untitled document'}
        </p>
        <p className="text-xs text-ink-faint mt-0.5">
          Edited{' '}
          {new Date(document.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Menu (owner only) */}
      {document.userId === userId && (
        <DocumentMenuButton
          documentId={document.id}
          setDocuments={setDocuments}
        />
      )}
    </li>
  );
};

export default DocumentCard;
