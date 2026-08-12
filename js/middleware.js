export async function middleware(request) {
  const response = await fetch(request);
  const contentType = response.headers.get('content-type') || '';

  // Only target HTML pages
  if (contentType.includes('text/html')) {
    let html = await response.text();

    const gtmScript = `
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-NWLPRQVZ');</script>
    <!-- End Google Tag Manager -->
    `;

    // Automatically inject script right before closing </head>
    html = html.replace('</head>', `${gtmScript}</head>`);

    return new Response(html, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
}

export const config = {
  matcher: '/:path*',
};
