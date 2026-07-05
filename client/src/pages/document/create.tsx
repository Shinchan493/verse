import { useState } from 'react';
import DocumentCreateHeader from '../../components/organisms/document-create-header';
import useWindowSize from '../../hooks/use-window-size';
import Spinner from '../../components/atoms/spinner';
import useDocuments from '../../hooks/use-documents';
import useAuth from '../../hooks/use-auth';
import DocumentsList from '../../components/molecules/documents-list';
import CreateDocumentButton from '../../components/atoms/create-document-button';
import StartSessionButton from '../../components/atoms/start-session-button';
import DocumentInterface from '../../types/interfaces/document';

const matchesQuery = (document: DocumentInterface, query: string) => {
  const title = (document.title || 'Untitled document').toLowerCase();
  return title.includes(query.trim().toLowerCase());
};

const Create = () => {
  const { heightStr } = useWindowSize();
  const { userId } = useAuth();
  const { documents, loading, setDocuments } = useDocuments();
  const [query, setQuery] = useState('');

  const all = documents === null ? [] : documents;
  const filtered = query.trim()
    ? all.filter((document) => matchesQuery(document, query))
    : all;

  const recentDocuments = filtered.filter(
    (document) => document.userId === userId
  );
  const sharedDocuments = filtered.filter(
    (document) => document.userId !== userId
  );

  const isSearching = query.trim().length > 0;
  const noResults =
    isSearching &&
    recentDocuments.length === 0 &&
    sharedDocuments.length === 0;

  return (
    <div
      style={{ height: heightStr }}
      className="bg-paper text-ink font-sans overflow-y-auto"
    >
      <DocumentCreateHeader query={query} setQuery={setQuery} />

      <main className="max-w-4xl mx-auto px-6 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
              {isSearching ? 'Search results' : 'Your documents'}
            </h1>
            <p className="mt-1 text-ink-soft">
              {isSearching
                ? `Showing documents matching “${query.trim()}”`
                : 'Pick up where you left off, or start something new.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StartSessionButton />
            <CreateDocumentButton />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : noResults ? (
          <div className="mt-14 text-center">
            <p className="font-serif text-xl text-ink">No documents found</p>
            <p className="mt-1 text-ink-soft">
              Try a different search, or start a new document.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            <DocumentsList
              title="Recent"
              emptyLabel={
                isSearching
                  ? 'No matching documents.'
                  : 'You haven’t created any documents yet.'
              }
              documents={recentDocuments}
              setDocuments={setDocuments}
            />
            <DocumentsList
              title="Shared with you"
              emptyLabel={
                isSearching
                  ? 'No matching shared documents.'
                  : 'Nothing has been shared with you yet.'
              }
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
