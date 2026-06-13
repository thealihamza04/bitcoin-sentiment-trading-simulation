// TanStack Query hooks — encapsulate loading/error/caching for each endpoint.
import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { getHealth, predictSentiment, runSimulation } from "./api";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 15000, // poll so the "model loaded" badge updates on its own
  });
}

// Simulation auto-runs whenever params change. `keepPreviousData` holds the last
// result on screen during the refetch, so charts/numbers update in place instead
// of flashing a skeleton. Same params → cached, so it never recomputes needlessly.
export function useSimulation(params, enabled) {
  return useQuery({
    queryKey: ["simulate", params],
    queryFn: () => runSimulation(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
}

export function usePredict() {
  return useMutation({ mutationFn: predictSentiment });
}

// Debounce a fast-changing value (e.g. slider params) before it drives a request.
export function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
