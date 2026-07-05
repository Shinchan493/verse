import { Dispatch, SetStateAction, useContext, useState } from 'react';
import { DocumentContext } from '../../../contexts/document-context';
import { ToastContext } from '../../../contexts/toast-context';
import useAuth from '../../../hooks/use-auth';
import useRandomBackground from '../../../hooks/use-random-background';
import DocumentUserService from '../../../services/document-user-service';
import DocumentInterface from '../../../types/interfaces/document';
import DocumentUser from '../../../types/interfaces/document-user';

interface SharedUsersProps {
  documentUsers: Array<DocumentUser>;
  setDocument: Dispatch<SetStateAction<DocumentInterface | null>>;
}

const SharedUsers = ({ documentUsers, setDocument }: SharedUsersProps) => {
  const { backgroundColor } = useRandomBackground();
  const { backgroundColor: sharedUserBackgroundColor } = useRandomBackground();
  const { accessToken, email } = useAuth();
  const [loading, setLoading] = useState(false);
  const { addToast } = useContext(ToastContext);
  const { document } = useContext(DocumentContext);

  const removeDocumentUser = async (payload: {
    documentId: number;
    userId: number;
  }) => {
    if (!accessToken) return;

    setLoading(true);

    try {
      await DocumentUserService.delete(accessToken, payload);

      setDocument({
        ...document,
        users: document?.users.filter(
          (documentUser) => documentUser.userId !== payload.userId
        ) as Array<DocumentUser>,
      } as DocumentInterface);
    } catch {
      addToast({
        color: 'danger',
        title: 'Unable to remove user',
        body: 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-56 overflow-y-auto">
      <div className="px-2 py-2.5 w-full flex items-center justify-between hover:bg-paper rounded-lg">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`${backgroundColor} w-9 h-9 flex-shrink-0 flex justify-center items-center text-white uppercase rounded-full text-base font-semibold`}
          >
            {email !== null && email[0]}
          </div>
          <p className="font-medium text-ink truncate">
            {email !== null && email}{' '}
            <span className="text-ink-faint font-normal">(you)</span>
          </p>
        </div>
        <p className="text-ink-faint text-sm flex-shrink-0 pl-2">Owner</p>
      </div>
      {documentUsers.map((documentUser) => {
        return (
          <div
            key={documentUser.user.email}
            className="group px-2 py-2.5 w-full flex items-center justify-between hover:bg-paper rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`${sharedUserBackgroundColor} w-9 h-9 flex-shrink-0 flex justify-center items-center text-white uppercase rounded-full text-base font-semibold`}
              >
                {documentUser.user.email[0]}
              </div>
              <p className="font-medium text-ink truncate">
                {documentUser.user.email}
              </p>
            </div>
            <button
              onClick={() =>
                removeDocumentUser({
                  documentId: documentUser.documentId,
                  userId: documentUser.userId,
                })
              }
              disabled={loading}
              className="flex-shrink-0 text-sm font-semibold text-ink-soft hover:text-red-600 px-2 py-1 rounded-md transition-colors"
            >
              Remove
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default SharedUsers;
