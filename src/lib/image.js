// Free, zero-dependency image handling: shrink an uploaded image in the browser
// and return a compact data URL we can store directly in Firestore. This avoids
// Firebase Storage (which now requires a paid plan) and any third-party host.
//
// At ~128px / JPEG quality 0.8 an avatar is only a few KB — comfortably under
// Firestore's 1 MB document limit.
export function resizeImageToDataUrl(file, maxSize = 128, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That image could not be loaded.'));
      img.onload = () => {
        // Scale down to fit within maxSize x maxSize, preserving aspect ratio.
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        // PNGs with transparency stay PNG; everything else becomes JPEG.
        const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(type, quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
