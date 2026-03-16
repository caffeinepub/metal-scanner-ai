import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface MetalPrices {
    gold: MetalPrice;
    lead: MetalPrice;
    zinc: MetalPrice;
    aluminium: MetalPrice;
    titanium: MetalPrice;
    steel: MetalPrice;
    nickel: MetalPrice;
    silver: MetalPrice;
    copper: MetalPrice;
}
export interface MetalAnalysisResult {
    copperProbability: bigint;
    nickelProbability: bigint;
    zincProbability: bigint;
    purityEstimate?: bigint;
    titaniumProbability: bigint;
    goldProbability: bigint;
    metalType: MetalType;
    aluminiumProbability: bigint;
    confidenceScore: bigint;
    estimatedValueUSD?: bigint;
    leadProbability: bigint;
    disclaimer: string;
    analysisTimestamp: bigint;
    silverProbability: bigint;
    steelProbability: bigint;
}
export interface MetalPrice {
    lastUpdated: bigint;
    pricePerGramUSD: number;
}
export interface UserProfile {
    name: string;
}
export interface ScanRecord {
    id: bigint;
    analysisResult: MetalAnalysisResult;
    user: Principal;
    timestamp: bigint;
    weightGrams?: number;
    dimensions?: [number, number, number];
    selectedMetal: MetalType;
    images: Array<ExternalBlob>;
}
export enum MetalType {
    gold = "gold",
    lead = "lead",
    zinc = "zinc",
    aluminium = "aluminium",
    titanium = "titanium",
    steel = "steel",
    nickel = "nickel",
    silver = "silver",
    copper = "copper",
    autoDetect = "autoDetect",
    unknown_ = "unknown"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentMetalPrices(): Promise<MetalPrices>;
    getScanById(user: Principal, scanId: bigint): Promise<ScanRecord>;
    getScanHistory(user: Principal): Promise<Array<ScanRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserScanCount(user: Principal): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveScan(selectedMetal: MetalType, images: Array<ExternalBlob>, weightGrams: number | null, dimensions: [number, number, number] | null, analysisResult: MetalAnalysisResult): Promise<bigint>;
    updateMetalPrices(newPrices: MetalPrices): Promise<void>;
}
