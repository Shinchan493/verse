import { SearchIcon } from '@heroicons/react/outline';
import { useState } from 'react';

const DocumentSearchbar = () => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={`w-full max-w-md rounded-full h-11 flex items-center transition-all border ${
        isFocused
          ? 'bg-white border-accent-soft ring-2 ring-accent-tint'
          : 'bg-white border-paper-2'
      }`}
    >
      <div className="flex justify-center items-center pl-4 text-ink-faint">
        <SearchIcon className="w-5 h-5" />
      </div>
      <input
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        type="text"
        className="w-full h-full px-3 bg-transparent text-ink placeholder-ink-faint text-sm rounded-full focus:outline-none"
        placeholder="Search documents"
      />
    </div>
  );
};

export default DocumentSearchbar;
