import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MetalAnalysisResult,
  MetalPrices,
  MetalType,
  ScanRecord,
  UserProfile,
} from "../backend";
import type { ExternalBlob } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// Metal Prices Queries
export function useGetCurrentMetalPrices() {
  const { actor, isFetching } = useActor();

  return useQuery<MetalPrices>({
    queryKey: ["metalPrices"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCurrentMetalPrices();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Scan History Queries
export function useGetScanHistory() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ScanRecord[]>({
    queryKey: ["scanHistory", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity)
        throw new Error("Actor or identity not available");
      return actor.getScanHistory(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetUserScanCount() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<bigint>({
    queryKey: ["scanCount", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity)
        throw new Error("Actor or identity not available");
      return actor.getUserScanCount(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSaveScan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      selectedMetal,
      images,
      weightGrams,
      dimensions,
      analysisResult,
    }: {
      selectedMetal: MetalType;
      images: ExternalBlob[];
      weightGrams: number | null;
      dimensions: [number, number, number] | null;
      analysisResult: MetalAnalysisResult;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveScan(
        selectedMetal,
        images,
        weightGrams,
        dimensions,
        analysisResult,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["scanHistory", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["scanCount", identity?.getPrincipal().toString()],
      });
    },
  });
}
