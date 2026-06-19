"use client";

import { useEffect, useRef } from "react";

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let SwaggerUIBundle: unknown;

    const loadSwagger = async () => {
      // Load Swagger UI from CDN
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css";
      document.head.appendChild(link);

      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Swagger UI"));
        document.head.appendChild(script);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      SwaggerUIBundle = (window as any).SwaggerUIBundle;

      if (containerRef.current && SwaggerUIBundle) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (SwaggerUIBundle as any)({
          url: "/api/docs",
          domNode: containerRef.current,
          presets: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (SwaggerUIBundle as any).presets.apis,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (SwaggerUIBundle as any).SwaggerUIStandalonePreset,
          ],
          layout: "BaseLayout",
          deepLinking: true,
          persistAuthorization: true,
          displayRequestDuration: true,
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 2,
          syntaxHighlight: { activated: true, theme: "agate" },
        });
      }
    };

    loadSwagger().catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">API</span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Persicore CRM — API Docs</h1>
          <p className="text-xs text-gray-500">OpenAPI 3.0 — Interactive documentation</p>
        </div>
      </div>
      <div ref={containerRef} />
    </div>
  );
}
