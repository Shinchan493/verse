import Modal from '../../atoms/modal';
import { UserAddIcon, LinkIcon } from '@heroicons/react/outline';
import {
  useContext,
  useRef,
  useState,
  ChangeEvent,
  KeyboardEvent,
} from 'react';
import DocumentInterface from '../../../types/interfaces/document';
import Spinner from '../../atoms/spinner';
import validator from 'validator';
import PermissionEnum from '../../../types/enums/permission-enum';
import SharedUsers from '../shared-users';
import { DocumentContext } from '../../../contexts/document-context';
import useAuth from '../../../hooks/use-auth';
import { ToastContext } from '../../../contexts/toast-context';
import DocumentUserService from '../../../services/document-user-service';
import DocumentUser from '../../../types/interfaces/document-user';

const ShareDocumentModal = () => {
  const { document, saving, saveDocument, setDocument } =
    useContext(DocumentContext);
  const copyLinkInputRef = useRef<null | HTMLInputElement>(null);
  const [email, setEmail] = useState<null | string>(null);
  const { accessToken } = useAuth();
  const { success, error } = useContext(ToastContext);
  const [loading, setLoading] = useState(false);

  const shareDocument = async () => {
    if (
      email === null ||
      !validator.isEmail(email) ||
      accessToken === null ||
      document === null
    )
      return;

    const payload = {
      documentId: document.id,
      email: email,
      permission: PermissionEnum.EDIT,
    };

    setLoading(true);

    try {
      const response = await DocumentUserService.create(accessToken, payload);
      const documentUser = response.data as DocumentUser;
      documentUser.user = { email };

      success(`Successfully shared document with ${email}!`);
      setDocument({
        ...document,
        users: [...document.users, documentUser],
      } as DocumentInterface);
      setEmail('');
    } catch (err) {
      console.log(err);
      error(`Unable to share this document with ${email}. Please try again`);
    } finally {
      setLoading(false);
    }
  };

  const handleShareEmailInputChange = (event: ChangeEvent) => {
    setEmail((event.target as HTMLInputElement).value);
  };

  const handleCopyLinkBtnClick = () => {
    if (copyLinkInputRef === null || copyLinkInputRef.current === null) return;

    const url = window.location.href;
    copyLinkInputRef.current.value = url;
    copyLinkInputRef.current.focus();
    copyLinkInputRef.current.select();
    window.document.execCommand('copy');
    success('Link copied to clipboard.');
  };

  const handleOnKeyPress = async (event: KeyboardEvent) => {
    if (event.key === 'Enter') await shareDocument();
  };

  const handleShareBtnClick = async () => {
    await shareDocument();
  };

  const updateIsPublic = (isPublic: boolean) => {
    const updatedDocument = {
      ...document,
      isPublic: isPublic,
    } as DocumentInterface;

    saveDocument(updatedDocument);
  };

  const alreadyShared =
    document === null ||
    (document !== null &&
      document.users.filter((documentUser) => documentUser.user.email === email)
        .length > 0);

  const canShare =
    email !== null && validator.isEmail(email) && !alreadyShared;

  const accessRow = (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-medium text-ink">
          {document?.isPublic ? 'Anyone with the link' : 'Restricted'}
        </p>
        <p className="text-ink-faint text-xs mt-0.5">
          {document?.isPublic
            ? 'Anyone with this link can open the document'
            : 'Only people you add can open this document'}
        </p>
      </div>
      <button
        disabled={saving}
        onClick={() => updateIsPublic(!document?.isPublic)}
        className="flex-shrink-0 text-sm font-semibold text-accent hover:bg-accent-tint px-3 py-1.5 rounded-lg transition-colors"
      >
        {saving ? (
          <Spinner size="sm" />
        ) : document?.isPublic ? (
          'Make restricted'
        ) : (
          'Make public'
        )}
      </button>
    </div>
  );

  return (
    <Modal
      button={
        <button className="btn-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          <span>Share</span>
        </button>
      }
      content={
        document === null ? (
          <></>
        ) : (
          <div
            onKeyPress={(event) => handleOnKeyPress(event)}
            className="bg-white rounded-2xl shadow-2xl border border-paper-2 overflow-hidden font-sans text-ink"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-accent-tint text-accent flex-shrink-0">
                  <UserAddIcon className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="font-serif text-xl font-semibold leading-tight">
                    Share this document
                  </h1>
                  <p className="text-ink-faint text-xs">
                    Invite people to edit with you in real time.
                  </p>
                </div>
              </div>

              {/* Invite by email */}
              <div className="mt-5 flex items-center gap-2">
                <input
                  type="text"
                  value={email !== null ? email : ''}
                  onChange={handleShareEmailInputChange}
                  placeholder="Add people by email"
                  className="flex-1 h-11 px-4 rounded-lg bg-paper border border-paper-2 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-soft focus:border-accent-soft"
                />
                <button
                  onClick={handleShareBtnClick}
                  disabled={loading || !canShare}
                  className={`${
                    canShare ? 'btn-primary' : 'btn-disabled'
                  } h-11 px-5`}
                >
                  {loading ? (
                    <Spinner size="sm" />
                  ) : (
                    <span>Invite</span>
                  )}
                </button>
              </div>
            </div>

            {/* People with access */}
            <div className="px-6 pb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint mb-1">
                People with access
              </p>
              <SharedUsers
                documentUsers={document.users}
                setDocument={setDocument}
              />
            </div>

            {/* Link access */}
            <div className="mt-2 px-6 py-5 border-t border-paper-2 bg-paper">
              <div className="flex items-center gap-3 mb-3">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-white border border-paper-2 text-ink-soft flex-shrink-0">
                  <LinkIcon className="w-4 h-4" />
                </span>
                <p className="font-medium">General access</p>
              </div>
              {accessRow}
              <input
                ref={copyLinkInputRef}
                type="text"
                className="opacity-0 absolute pointer-events-none"
                readOnly
              />
              <button
                onClick={handleCopyLinkBtnClick}
                className="mt-4 w-full h-10 rounded-lg border border-paper-2 bg-white text-sm font-semibold text-ink hover:border-accent-soft hover:text-accent transition-colors"
              >
                Copy link
              </button>
            </div>
          </div>
        )
      }
    />
  );
};

export default ShareDocumentModal;
