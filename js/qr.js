(function () {
  "use strict";

  const container = document.getElementById("qrcode");
  if (!container) return;

  const configured =
    typeof window.MENU_PUBLIC_URL === "string" && window.MENU_PUBLIC_URL.trim();
  const menuUrl = window.MENU_PUBLIC_URL;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
  )
    .then(() => {
      new QRCode(container, {
        text: menuUrl,
        width: 256,
        height: 256,
        colorDark: "#0f1410",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    })
    .catch(() => {
      const img = document.createElement("img");
      img.alt = "Codigo QR de la carta";
      img.width = 256;
      img.height = 256;
      img.src =
        "https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=" +
        encodeURIComponent(menuUrl);
      container.appendChild(img);
    });
})();

