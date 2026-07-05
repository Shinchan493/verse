import { ChangeEvent, FocusEvent, useContext } from 'react';
import Logo from '../../atoms/logo';
import UserDropdown from '../../atoms/user-dropdown';
import ShareDocumentModal from '../share-document-modal';
import useRandomBackground from '../../../hooks/use-random-background';
import useAuth from '../../../hooks/use-auth';
import { DocumentContext } from '../../../contexts/document-context';
import DocumentService from '../../../services/document-service';
import DocumentInterface from '../../../types/interfaces/document';

const CurrentUsers = () => {
  const { backgroundColor } = useRandomBackground();
  const { email } = useAuth();
  const { currentUsers } = useContext(DocumentContext);

  return (
    <>
      {Array.from(currentUsers)
        .filter((currentUser) => currentUser !== email)
        .map((currentUser) => {
          return (
            <div
              key={currentUser}
              className={`${backgroundColor} w-8 h-8 text-white font-semibold flex justify-center items-center rounded-full flex-shrink-0 uppercase ring-2`}
            >
              {currentUser[0]}
            </div>
          );
        })}
    </>
  );
};

const DocumentMenuBar = () => {
  const { accessToken, userId } = useAuth();
  const {
    document,
    saving,
    setDocumentTitle,
    setDocument,
    setSaving,
    setErrors,
  } = useContext(DocumentContext);

  const handleTitleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const title = event.target.value;
    setDocumentTitle(title);
  };

  const handleTitleInputBlur = async (event: FocusEvent<HTMLInputElement>) => {
    if (accessToken === null || document === null) return;

    setSaving(true);

    const title = (event.target as HTMLInputElement).value;
    const updatedDocument = {
      ...document,
      title,
    } as DocumentInterface;

    try {
      await DocumentService.update(accessToken, updatedDocument);
    } catch (error) {
      setErrors(['There was an error saving the document. Please try again.']);
    } finally {
      setDocument(updatedDocument);
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex justify-between items-center px-4 pb-1 border-b border-paper-2 bg-paper">
      {/* Left */}
      <div className="w-full flex justify-start items-center overflow-x-hidden md:overflow-visible">
        <Logo />
        <div className="flex flex-col">
          <input
            maxLength={25}
            type="text"
            onBlur={(event) => handleTitleInputBlur(event)}
            onChange={(event) => handleTitleInputChange(event)}
            value={document?.title ? document?.title : ''}
            className="font-serif font-medium text-lg px-2 pt-1 bg-transparent rounded focus:outline-none focus:ring-1 focus:ring-accent-soft"
            name=""
            id=""
            placeholder="Untitled document"
          />
          <div className="flex items-center h-5 px-2">
            <p className="text-xs text-ink-faint">
              {saving ? 'Saving…' : 'All changes saved'}
            </p>
          </div>
        </div>
      </div>
      {/* Right */}
      <div className="flex items-center flex-shrink-0 pl-3 gap-x-4">
        {document !== null && document.userId === userId && (
          <ShareDocumentModal />
        )}
        <div className="flex items-center gap-x-2">
          <CurrentUsers />
          <UserDropdown />
        </div>
      </div>
    </div>
  );
};

export default DocumentMenuBar;
