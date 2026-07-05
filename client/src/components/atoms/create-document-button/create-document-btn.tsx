import { PlusIcon } from '@heroicons/react/outline';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from '../../../contexts/toast-context';
import useAuth from '../../../hooks/use-auth';
import DocumentService from '../../../services/document-service';
import DocumentInterface from '../../../types/interfaces/document';
import Spinner from '../spinner';

const CreateDocumentButton = () => {
  const { error } = useContext(ToastContext);
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDocumentCreateBtnClick = async () => {
    if (accessToken === null) return;

    setLoading(true);

    try {
      const response = await DocumentService.create(accessToken);
      const { id } = response.data as DocumentInterface;

      navigate(`/document/${id}`);
    } catch (err) {
      error('Unable to create a new document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      disabled={loading}
      onClick={handleDocumentCreateBtnClick}
      className="inline-flex flex-shrink-0 items-center gap-2 bg-accent text-paper text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-70"
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <>
          <PlusIcon className="w-4 h-4" />
          <span>New document</span>
        </>
      )}
    </button>
  );
};

export default CreateDocumentButton;
