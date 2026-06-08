"use client";

import { Terminal } from "lucide-react";

export function EmailGuides({ config, handleCopy, copied }: { config: { apiKey: string, baseUrl: string }, handleCopy: (t: string, i: string) => void, copied: string | null }) {
  return (
    <div className="space-y-6">
      {/* Email API Integration */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Terminal className="h-5 w-5 text-indigo-500" />
          Email Sharing API (Requires Authentication)
        </h2>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 mb-6">
          <p>
            Unlike the upload endpoint which uses <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">x-api-key</code>, the email sharing endpoints are for <strong>admin use only</strong> and require a valid Firebase ID token in the Authorization header.
          </p>
        </div>

        <div className="space-y-8">
          {/* Email a Single File */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex justify-between items-center">
              Share Single File via Email (cURL)
              <button 
                onClick={() => handleCopy(`curl -X POST ${config.baseUrl}/admin/share/email \\\n  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "folder": "root",\n    "name": "document.pdf",\n    "email": "client@example.com",\n    "url": "${config.baseUrl}/file-serve/root/document.pdf",\n    "attachFile": true\n  }'`, "email-curl")}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                {copied === "email-curl" ? "Copied!" : "Copy code"}
              </button>
            </h3>
            <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-50 overflow-x-auto border border-slate-800">
              <code>{`curl -X POST ${config.baseUrl}/admin/share/email \\
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "folder": "root",
    "name": "document.pdf",
    "email": "client@example.com",
    "url": "${config.baseUrl}/file-serve/root/document.pdf",
    "attachFile": true
  }'`}</code>
            </pre>
          </div>

          {/* Bulk Email Sharing (Node.js) */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex justify-between items-center">
              Bulk Email Sharing (Node.js)
              <button 
                onClick={() => handleCopy(`const fetch = require('node-fetch');\n\nconst sendBulkEmail = async (idToken) => {\n  const response = await fetch("${config.baseUrl}/admin/bulk-share-email", {\n    method: "POST",\n    headers: {\n      "Authorization": \`Bearer \${idToken}\`,\n      "Content-Type": "application/json"\n    },\n    body: JSON.stringify({\n      email: "team@example.com",\n      files: [\n        { folder: "root", name: "presentation.pptx" },\n        { folder: "assets", name: "logo.png" }\n      ],\n      durationMs: 86400000, // Expires in 24 hours\n      password: "secretpassword"\n    })\n  });\n\n  const result = await response.json();\n  console.log(result);\n};`, "email-node")}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                {copied === "email-node" ? "Copied!" : "Copy code"}
              </button>
            </h3>
            <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-50 overflow-x-auto border border-slate-800">
              <code>{`const fetch = require('node-fetch');

const sendBulkEmail = async (idToken) => {
  const response = await fetch("${config.baseUrl}/admin/bulk-share-email", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${idToken}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: "team@example.com",
      files: [
        { folder: "root", name: "presentation.pptx" },
        { folder: "assets", name: "logo.png" }
      ],
      durationMs: 86400000, // Expires in 24 hours
      password: "secretpassword"
    })
  });

  const result = await response.json();
  console.log(result);
};`}</code>
            </pre>
          </div>

        </div>
      </div>
    </div>
  );
}
