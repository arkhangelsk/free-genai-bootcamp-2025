import streamlit as st
import numpy as np
import cv2
import pytesseract
import tempfile
import os
from PIL import Image
from streamlit_drawable_canvas import st_canvas

# Set page configuration
st.set_page_config(page_title="Canvas Test", page_icon="🖌️", layout="wide")

def process_image(image):
    try:
        # Handle different input types
        if isinstance(image, str) and os.path.isfile(image):
            # If image is a file path, read it directly with OpenCV
            img = cv2.imread(image)
            if img is None:
                st.error(f"Failed to read image from {image}")
                return ""
        elif isinstance(image, Image.Image):
            # Convert PIL Image to OpenCV format
            img_array = np.array(image.convert("RGB"))
            img = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        elif isinstance(image, np.ndarray):
            # If it's already a numpy array
            if len(image.shape) == 3 and image.shape[2] == 3:
                # It's an RGB image
                img = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            elif len(image.shape) == 3 and image.shape[2] == 4:
                # It's an RGBA image, convert to RGB then to BGR
                img = cv2.cvtColor(image[:, :, :3], cv2.COLOR_RGB2BGR)
            elif len(image.shape) == 2:
                # It's already grayscale
                img = image
            else:
                st.error(f"Unsupported image format with shape {image.shape}")
                return ""
        else:
            st.error(f"Unsupported image type: {type(image)}")
            return ""

        # Convert to grayscale if not already
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img

        # Apply thresholding to create a binary image
        _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)

        # Noise removal and enhancement for Arabic text
        kernel = np.ones((2, 2), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        binary = cv2.dilate(binary, kernel, iterations=1)

        # Save the processed image to a temporary file
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp:
            temp_filename = temp.name
            cv2.imwrite(temp_filename, binary)

        # Use pytesseract to extract text (with Arabic language)
        text = pytesseract.image_to_string(temp_filename, lang="ara")

        # Clean up the temporary file
        os.unlink(temp_filename)

        # Clean the extracted text
        text = text.strip()

        return text
    except Exception as e:
        st.error(f"Error processing image: {str(e)}")
        return ""

def main():
    st.title("Canvas Drawing Test")
    st.write("Draw something and click 'Process Drawing' to test OCR")
    
    # Create a canvas component
    canvas_result = st_canvas(
        fill_color="rgba(255, 255, 255, 0.0)",  # Transparent fill
        stroke_width=3,
        stroke_color="#000000",
        background_color="#FFFFFF",
        height=400,
        width=700,
        drawing_mode="freedraw",
        key="canvas",
        display_toolbar=True,
    )
    
    # Process drawing button
    if st.button("Process Drawing"):
        if canvas_result.image_data is not None:
            # Display the drawing
            st.image(canvas_result.image_data, caption="Your drawing", width=400)
            
            # Process the drawing with OCR
            with st.spinner("Processing your drawing..."):
                try:
                    # Get the image data from the canvas
                    img_array = np.array(canvas_result.image_data)
                    
                    # Check if the image has an alpha channel (RGBA)
                    if img_array.shape[-1] == 4:
                        # Convert RGBA to RGB by removing the alpha channel
                        rgb_img = img_array[:, :, :3]
                    else:
                        rgb_img = img_array
                    
                    # Create a PIL image for saving
                    temp_img = Image.fromarray(rgb_img)
                    
                    # Save to a temporary file
                    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
                    temp_filename = temp_file.name
                    temp_img.save(temp_filename)
                    
                    # Display the processed image
                    st.image(temp_img, caption="Processed image", width=400)
                    
                    # Process with OCR
                    extracted_text = process_image(temp_filename)
                    
                    # Clean up
                    os.unlink(temp_filename)
                    
                    # Display the results
                    if extracted_text:
                        st.success("OCR Processing Complete!")
                        st.markdown("### Detected Text:")
                        st.markdown(f'<div dir="rtl" style="font-size:24px;margin:15px 0;">{extracted_text}</div>', unsafe_allow_html=True)
                    else:
                        st.warning("Could not extract text from your drawing. Please try again with clearer writing.")
                except Exception as e:
                    st.error(f"Error processing image: {str(e)}")
                    st.info("Try drawing more clearly or with darker strokes.")
        else:
            st.warning("Please draw something on the canvas first.")

if __name__ == "__main__":
    main()
