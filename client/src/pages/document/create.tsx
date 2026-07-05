import DocumentCreateHeader from '../../components/organisms/document-create-header';
import useWindowSize from '../../hooks/use-window-size';
import Spinner from '../../components/atoms/spinner';
import useDocuments from '../../hooks/use-documents';
import useAuth from '../../hooks/use-auth';
import DocumentsList from '../../components/molecules/documents-list';
import CreateDocumentButton from '../../components/atoms/create-document-button';

const Create = () => {
  const { heightStr } = useWindowSize();
  const { userId } = useAuth();
  const { documents, loading, setDocuments } = useDocuments();

  const recentDocuments =
    documents === null
      ? []
      : documents.filter((document) => document.userId === userId);
  const sharedDocuments =
    documents === null
      ? []
      : documents.filter((document) => document.userId !== userId);

  return (
    <div
      style={{ height: heightStr }}
      className="bg-paper text-ink font-sans overflow-y-auto"
    >
      <DocumentCreateHeader />

      <main className="max-w-4xl mx-auto px-6 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
              Your documents
            </h1>
            <p className="mt-1 text-ink-soft">
              Pick up where you left off, or start something new.
            </p>
          </div>
          <CreateDocumentButton />
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            <DocumentsList
              title="Recent"
              emptyLabel="You haven’t created any documents yet."
              documents={recentDocuments}
              setDocuments={setDocuments}
            />
            <DocumentsList
              title="Shared with you"
              emptyLabel="Nothing has been shared with you yet."
              documents={sharedDocuments}
              setDocuments={setDocuments}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Create;
