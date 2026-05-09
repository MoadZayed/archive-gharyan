import { useEffect } from 'react';

/**
 * Hook to dynamically update the document title.
 * @param title - The title to display (without the platform suffix).
 */
export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${title} | GITA`;

    return () => {
      document.title = originalTitle;
    };
  }, [title]);
};
