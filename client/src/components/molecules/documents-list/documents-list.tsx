import DocumentInterface from '../../../types/interfaces/document';
import DocumentCard from '../../atoms/document-card';

interface DocumentsListProps {
  title: string;
  emptyLabel?: string;
  documents: Array<DocumentInterface>;
  setDocuments: Function;
}

const DocumentsList = ({
  title,
  emptyLabel = 'Nothing here yet.',
  documents,
  setDocuments,
}: DocumentsListProps) => {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
        <span className="text-xs text-ink-faint">
          {documents.length} {documents.length === 1 ? 'document' : 'documents'}
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="mt-3 border border-dashed border-paper-2 rounded-xl px-6 py-10 text-center text-sm text-ink-faint">
          {emptyLabel}
        </div>
      ) : (
        <ul className="mt-3 border border-paper-2 rounded-xl bg-white overflow-hidden divide-y divide-paper-2">
          {documents
            .slice()
            .sort((a, b) => {
              return (
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
              );
            })
            .map((document) => {
              return (
                <DocumentCard
                  key={document.id}
                  document={document}
                  setDocuments={setDocuments}
                />
              );
            })}
        </ul>
      )}
    </section>
  );
};

export default DocumentsList;
