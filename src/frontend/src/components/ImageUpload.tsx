import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Image as ImageIcon, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createObjectURL, revokeObjectURL } from "../utils/objectUrls";

interface ImageUploadProps {
  onImagesReady: (images: File[]) => void;
  onCancel: () => void;
  initialImages?: File[];
}

export default function ImageUpload({
  onImagesReady,
  onCancel,
  initialImages = [],
}: ImageUploadProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>(initialImages);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only
  useEffect(() => {
    if (initialImages.length > 0) {
      const urls = initialImages.map((file) => createObjectURL(file));
      setImageUrls(urls);
    }
    return () => {
      for (const url of imageUrls) revokeObjectURL(url);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const newUrls = imageFiles.map((file) => createObjectURL(file));
    setSelectedImages((prev) => [...prev, ...imageFiles]);
    setImageUrls((prev) => [...prev, ...newUrls]);
  };

  const handleRemoveImage = (index: number) => {
    revokeObjectURL(imageUrls[index]);
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
    setImageUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCancel = () => {
    for (const url of imageUrls) revokeObjectURL(url);
    onCancel();
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Upload Images</CardTitle>
              <CardDescription className="text-muted-foreground">
                Select multiple images of your metal object
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedImages.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-white/20 rounded-lg hover:border-gold hover:bg-white/5 transition-colors flex flex-col items-center justify-center gap-4"
            >
              <Upload className="w-16 h-16 text-gold" />
              <div className="text-center">
                <p className="text-foreground font-medium">
                  Click to upload images
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or drag and drop
                </p>
              </div>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedImages.length} image(s) selected
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-white/10"
                >
                  <ImageIcon className="w-4 h-4 mr-2" /> Add More
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imageUrls.map((url, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: list without stable IDs
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: no stable IDs
                    key={idx}
                    className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group"
                  >
                    <img
                      src={url}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => onImagesReady(selectedImages)}
                className="w-full bg-gold hover:bg-gold/90 text-black"
              >
                <Check className="w-4 h-4 mr-2" /> Use These Images (
                {selectedImages.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
