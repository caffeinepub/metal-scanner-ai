const urlRegistry = new Set<string>();

export function createObjectURL(file: File | Blob): string {
  const url = URL.createObjectURL(file);
  urlRegistry.add(url);
  return url;
}

export function revokeObjectURL(url: string): void {
  if (urlRegistry.has(url)) {
    URL.revokeObjectURL(url);
    urlRegistry.delete(url);
  }
}

export function revokeAllObjectURLs(): void {
  for (const url of urlRegistry) {
    URL.revokeObjectURL(url);
  }
  urlRegistry.clear();
}

export function getActiveURLCount(): number {
  return urlRegistry.size;
}
