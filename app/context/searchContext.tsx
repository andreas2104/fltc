import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilters: Record<string, any>;
  setActiveFilters: (filters: Record<string, any>) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  return (
    <React.Suspense fallback={null}>
      <SearchContent>{children}</SearchContent>
    </React.Suspense>
  );
};

const SearchContent = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQueryState] = useState(searchParams.get('q') || '');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Sync state with URL when it changes elsewhere
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== searchQuery) {
      setSearchQueryState(q);
    }
  }, [searchParams]);

  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    // Use replace to avoid polluting history on every keystroke if desired, 
    // but push is standard for search usually.
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveFilters({});
  };

  return (
    <SearchContext.Provider value={{
      searchQuery,
      setSearchQuery,
      activeFilters,
      setActiveFilters,
      clearSearch
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};