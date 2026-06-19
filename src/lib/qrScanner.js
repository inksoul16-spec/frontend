// Camera-based QR scanner built on the jsQR library.
// startScanner(videoEl, onDecode) opens the back camera, scans each frame,
// and calls onDecode(text) once per newly-seen code (de-duplicated).
// stopScanner() releases the camera and cancels the scan loop.

let stream = null;
let rafId = null;
let lastDecoded = null;
let lastDecodedAt = 0;
let jsQRPromise = null;

async function loadJsQR() {
  if (window.jsQR) return window.jsQR;
  if (!jsQRPromise) {
    // Prefer the locally installed package (faster, works offline).
    jsQRPromise = (async () => {
      try {
        const mod = await import('jsqr');
        // support default export or named
        const fn = (mod && (mod.default || mod.jsQR || mod)) || null;
        if (fn) return fn;
      } catch (e) {
        // dynamic import failed — fall back to CDN
      }

      return await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.js";
        script.onload = () => resolve(window.jsQR || (window.jsQR === undefined ? null : window.jsQR));
        script.onerror = () => reject(new Error("Failed to load QR scanning library (cdn fallback failed)."));
        document.head.appendChild(script);
      });
    })();
  }
  return jsQRPromise;
}

export async function startScanner(videoEl, onDecode) {
  if (!videoEl) throw new Error("Video element not ready.");

  const jsQR = await loadJsQR();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Camera access is not supported in this browser.");
  }

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
  });

  videoEl.srcObject = stream;
  await videoEl.play();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const tick = () => {
    if (!stream) return; // stopped

    if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        const now = Date.now();
        // de-dupe identical scans within 2.5s so one badge doesn't fire repeatedly
        if (code.data !== lastDecoded || now - lastDecodedAt > 2500) {
          lastDecoded = code.data;
          lastDecodedAt = now;
          onDecode(code.data);
        }
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
}

export function stopScanner() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  lastDecoded = null;
  lastDecodedAt = 0;
}