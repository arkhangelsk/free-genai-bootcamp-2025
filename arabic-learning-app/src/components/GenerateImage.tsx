"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface GenerateImageProps {
  title: string;
  onImageGenerated: () => void;
}

export default function GenerateImage({
  title,
  onImageGenerated,
}: GenerateImageProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Memoize generateImage using useCallback
  const generateImage = useCallback(
    async (title: string) => {
      setLoading(true);
      try {
        const response = await fetch("/api/generateImage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });

        const data = await response.json();
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
          onImageGenerated();
        } else {
          console.error("No image URL found in response");
        }
      } catch (error) {
        console.error("Error generating image:", error);
      } finally {
        setLoading(false);
      }
    },
    [onImageGenerated]
  ); 

  // Memoize checkImageExists using useCallback
  const checkImageExists = useCallback(
    async (title: string) => {
      const imageName = `${title.toLowerCase().replace(/\s/g, "-")}.png`;
      const imagePath = `/images/${imageName}`;

      try {
        const img = new window.Image();
        img.src = imagePath;

        img.onload = () => {
          setImageUrl(imagePath);
          onImageGenerated();
        };

        img.onerror = () => {
          generateImage(title); // Use the memoized generateImage
        };
      } catch (error) {
        console.error("Error checking image existence:", error);
      }
    },
    [generateImage, onImageGenerated]
  );

  useEffect(() => {
    if (title) {
      setImageUrl(""); // Clear previous image URL
      checkImageExists(title);
    }
  }, [title, checkImageExists]); 

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {loading && (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin w-6 h-6" />
          <p>Generating image...</p>
        </div>
      )}
      {imageUrl && (
        <div className="w-full max-w-[512px] h-auto">
          <Image
            src={imageUrl}
            alt="Generated"
            width={500}
            height={500}
            className="rounded shadow object-cover"
          />
        </div>
      )}
    </div>
  );
}
