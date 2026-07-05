import DocumentSearchbar from '../../atoms/document-searchbar';
import Wordmark from '../../atoms/wordmark';
import UserDropdown from '../../atoms/user-dropdown';

interface DocumentCreateHeaderProps {
  query?: string;
  setQuery?: (value: string) => void;
}

const DocumentCreateHeader = ({
  query = '',
  setQuery = () => {},
}: DocumentCreateHeaderProps) => {
  return (
    <div className="w-full px-6 py-3 flex justify-between items-center gap-4 border-b border-paper-2 bg-paper sticky top-0 z-10">
      <Wordmark to="/document/create" size="sm" />
      <DocumentSearchbar value={query} onChange={setQuery} />
      <UserDropdown />
    </div>
  );
};

export default DocumentCreateHeader;
