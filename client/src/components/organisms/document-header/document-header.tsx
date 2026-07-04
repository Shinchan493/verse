import { MutableRefObject } from 'react';
import DocumentMenuBar from '../../molecules/document-menu-bar';

interface DocumentHeaderProps {
  documentHeaderRef: MutableRefObject<null | HTMLDivElement>;
}

const DocumentHeader = ({ documentHeaderRef }: DocumentHeaderProps) => {
  return (
    <div
      ref={documentHeaderRef}
      className="border-b w-full bg-white flex flex-col"
    >
      <DocumentMenuBar />
    </div>
  );
};

export default DocumentHeader;
