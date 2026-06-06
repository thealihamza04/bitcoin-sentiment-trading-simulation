// TanStack Query hooks — encapsulate loading/error/caching for each endpoint.
import { useMutation, useQuery } from "@tanstack/react-query";
import { getHealth, predictSentiment, runSimulation } from "./api";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 15000, // poll so the "model loaded" badge updates on its own
  });
}

// Simulation runs on demand (when the user clicks "Run"), so it's a mutation.
export function useSimulation() {
  return useMutation({ mutationFn: runSimulation });
}

export function usePredict() {
  return useMutation({ mutationFn: predictSentiment });
}
