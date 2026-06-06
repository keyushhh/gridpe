// @ts-nocheck
export const config = { auth: false };

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const order_id = url.searchParams.get("order_id");

  if (!order_id) {
    return new Response("Missing order_id", { status: 400 });
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecting...</title>
  <script>
    const orderId = "${order_id}";
    const params = "?order_id=" + orderId;
    
    // Try primary scheme first (Android + iOS after Info.plist fix)
    window.location.href = "com.gridpe.customer://cashfree-return" + params;
    
    // After 1.5s try iOS legacy scheme as fallback
    setTimeout(() => {
      window.location.href = "gridpe://cashfree-return" + params;
    }, 1500);
    
    // Final fallback to web after 3s
    setTimeout(() => {
      window.location.href = "https://gridpe.in/payment-complete" + params;
    }, 3000);
  </script>
</head>
<body style="background:#0a0a12;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px;">
  <p style="font-size:18px;font-weight:600;">Payment Complete</p>
  <p style="font-size:14px;opacity:0.6;">Redirecting you back to Grid.Pe...</p>
</body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
});
