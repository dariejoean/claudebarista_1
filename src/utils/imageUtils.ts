
/**
 * Creates a low-resolution thumbnail from a base64 image string.
 * @param base64 The original high-res base64 string
 * @param maxWidth Max width for the thumbnail (default 200px)
 * @param quality Jpeg quality (0 to 1, default 0.6)
 * @returns Promise resolving to the thumbnail base64 string
 */
export const createThumbnail = (base64: string, maxWidth: number = 200, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64;
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    console.warn("Could not get 2D context for thumbnail generation.");
                    resolve(base64); // Fallback to original if canvas fails
                    return;
                }

                // Calculate aspect ratio
                const ratio = img.height / img.width;
                const width = Math.min(img.width, maxWidth);
                const height = width * ratio;

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);
                
                // Resolve with compressed base64
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            } catch (e) {
                console.error("Error creating thumbnail:", e);
                resolve(base64); // Fallback on error
            }
        };
        
        img.onerror = (err) => {
            console.error("Thumbnail image load failed", err);
            resolve(base64); // Fallback to original
        };
    });
};
