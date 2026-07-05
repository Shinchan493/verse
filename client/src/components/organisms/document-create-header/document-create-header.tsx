import DocumentSearchbar from '../../atoms/document-searchbar';
import Wordmark from '../../atoms/wordmark';
import UserDropdown from '../../atoms/user-dropdown';

const DocumentCreateHeader = () => {
  return (
    <div className="w-full px-6 py-3 flex justify-between items-center gap-4 border-b border-paper-2 bg-paper">
      <Wordmark to="/document/create" size="sm" />
      <DocumentSearchbar />
      <UserDropdown />
    </div>
  );
};

export default DocumentCreateHeader;
