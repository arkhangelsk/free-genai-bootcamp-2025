"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface GenerateImageProps {
  title: string;
  onImageGenerated: () => void;
}

export default function GenerateImage({ title, onImageGenerated }: GenerateImageProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (title) {
        setImageUrl(""); // Clear previous image URL
        checkImageExists(title);
      }
    }, [title]);

  // Check if the image already exists
  const checkImageExists = async (title: string) => {
    const imageName = `${title.toLowerCase().replace(/\s/g, "-")}.png`;
    const imagePath = `/images/${imageName}`;

    try {
      // Attempt to load the image
      const img = new window.Image();
      img.src = imagePath;

      img.onload = () => {
        // Image exists, set the URL
        setImageUrl(imagePath);
        // Call the callback function after the image is loaded
        onImageGenerated();
      };

      img.onerror = () => {
        // Image does not exist, generate a new one
        generateImage(title);
      };
    } catch (error) {
      console.error("Error checking image existence:", error);
    }
  };

  const generateImage = async (title: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/generateImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      const data = await response.json();
      // setImageUrl(`data:image/png;base64,${data.image}`);
      if (data.imageUrl) {
        setImageUrl(data.imageUrl); // Use the saved image path
        onImageGenerated(); 
      } else {
        console.error("No image URL found in response");
      }
      // Call the callback function after the image is generated
      // onImageGenerated();
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setLoading(false);
    }
  };

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
