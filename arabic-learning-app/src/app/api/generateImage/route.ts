import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();

    const enhancedPrompt = `A high-quality, appetizing image of ${title}, Middle Eastern cuisine, food photography, realistic, detailed, vibrant colors`;

    const response = await axios.post(
      "http://127.0.0.1:7860/sdapi/v1/txt2img",
      {
        prompt: enhancedPrompt,
        steps: 20,
        width: 512,
        height: 512,
        sampler_name: "Euler a",
        cfg_scale: 7.5,
        seed: -1,
        n_iter: 1,
      }
    );

    const base64Image = response.data.images[0];
    const imageBuffer = Buffer.from(base64Image, "base64");

    // Define the image path
    const imageName = `${title.toLowerCase().replace(/\s/g, "-")}.png`;
    const imagePath = path.join(process.cwd(), "public", "images", imageName);

    // Ensure the public/images directory exists
    const imagesDir = path.join(process.cwd(), "public", "images");

    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    // Save the image to the public/images folder
    fs.writeFileSync(imagePath, imageBuffer);

    return NextResponse.json(
      { imageUrl: `/images/${imageName}` }
      // ,
      // // {
      //   headers: {
      //     "Access-Control-Allow-Origin": "*",
      //     "Access-Control-Allow-Methods": "POST",
      //   },
      // }
    );
    // Send base64 image to client
  } catch (error) {
    console.error("Error in /api/generateImage:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message, stack: error.stack },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}
