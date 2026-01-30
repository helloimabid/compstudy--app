import { COLLECTIONS, databases, DB_ID, Query } from "@/lib/appwrite";
import { useCallback, useEffect, useRef, useState } from "react";

export interface SearchedUser {
  $id: string;
  userId: string;
  username: string;
  profilePicture?: string;
}

interface UseUserSearchResult {
  query: string;
  setQuery: (query: string) => void;
  results: SearchedUser[];
  loading: boolean;
  error: string | null;
  clearSearch: () => void;
}

const DEBOUNCE_DELAY = 400; // ms
const MIN_SEARCH_LENGTH = 2;
const MAX_RESULTS = 5;

export function useUserSearch(): UseUserSearchResult {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchUsers = useCallback(async (searchQuery: string) => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    if (searchQuery.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PROFILES,
        [Query.search("username", searchQuery), Query.limit(MAX_RESULTS)]
      );

      // Only update if this request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        const users: SearchedUser[] = response.documents.map((doc) => ({
          $id: doc.$id,
          userId: doc.userId as string,
          username: doc.username as string,
          profilePicture: doc.profilePicture as string | undefined,
        }));
        setResults(users);
        setError(null);
      }
    } catch (err: any) {
      // Don't set error if request was aborted
      if (err?.name !== "AbortError" && !abortControllerRef.current?.signal.aborted) {
        console.error("User search error:", err);
        setError("Failed to search users. Please try again.");
        setResults([]);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Handle empty query
    if (query.length === 0) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    // Don't search if query is too short
    if (query.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    // Set loading immediately for better UX
    setLoading(true);

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      searchUsers(query);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchUsers]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
    setLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch,
  };
}
