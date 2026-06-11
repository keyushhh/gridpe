// @ts-nocheck
export const config = { auth: false };

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("order_id");

  const iosDeepLink = `gridpe://pro-subscription-return?order_id=${orderId}`;
  const androidDeepLink = `com.gridpe.customer://pro-subscription-return?order_id=${orderId}`;
  const fallbackUrl = "https://gridpe.in";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Returning to Grid.Pe...</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background-color: #f8f9fa;
          color: #333;
        }
        .container {
          text-align: center;
          padding: 20px;
        }
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #10b981;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        h1 { font-size: 20px; margin-bottom: 10px; }
        p { font-size: 14px; color: #666; margin-bottom: 20px; }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #10b981;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="loader"></div>
        <h1>Returning to Grid.Pe...</h1>
        <p>Your subscription is being processed. Please wait while we take you back to the app.</p>
        <p id="fallback-message" style="display: none;">
          If nothing happens, please click the button below.
        </p>
        <a id="retry-button" href="#" class="button" style="display: none;">Return to App</a>
      </div>

      <script>
        const orderId = "${orderId}";
        const iosLink = "${iosDeepLink}";
        const androidLink = "${androidDeepLink}";
        const fallback = "${fallbackUrl}";

        function detectOS() {
          const userAgent = navigator.userAgent || navigator.vendor || window.opera;
          if (/android/i.test(userAgent)) return 'Android';
          if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'iOS';
          return 'unknown';
        }

        function redirect() {
          const os = detectOS();
          let appLink = iosLink; // default

          if (os === 'Android') {
            appLink = androidLink;
          }

          // Attempt redirect
          window.location.href = appLink;

          // Show manual button after a delay if redirect didn't happen
          setTimeout(() => {
            document.getElementById('fallback-message').style.display = 'block';
            const btn = document.getElementById('retry-button');
            btn.style.display = 'inline-block';
            btn.href = appLink;
          }, 3000);
        }

        // Start redirect on load
        window.onload = redirect;
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
});
