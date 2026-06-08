"use client";

import { useState } from "react";
import { Terminal, Copy, Check, Link as LinkIcon, Code } from "lucide-react";

export function LegacyGuides({ config, handleCopy, copied }: { config: { apiKey: string, baseUrl: string }, handleCopy: (t: string, i: string) => void, copied: string | null }) {
  const endpoint = `${config.baseUrl}/upload`;

  return (
    <div className="space-y-6">
      {/* Code Examples */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <Terminal className="h-5 w-5 text-indigo-500" />
          Integration Examples
        </h2>

        <div className="space-y-8">
          {/* HTML/JS Example */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex justify-between items-center">
              HTML &amp; JavaScript
              <button 
                onClick={() => handleCopy(`const formData = new FormData();\nformData.append("file", fileInput.files[0]);\n\nfetch("${endpoint}", {\n  method: "POST",\n  headers: {\n    "x-api-key": "${config.apiKey}"\n  },\n  body: formData\n})\n.then(res => res.json())\n.then(data => console.log("File URL:", data.url));`, "js")}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                {copied === "js" ? "Copied!" : "Copy code"}
              </button>
            </h3>
            <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-50 overflow-x-auto border border-slate-800">
              <code>{`const formData = new FormData();
formData.append("file", fileInput.files[0]);

fetch("${endpoint}", {
  method: "POST",
  headers: {
    "x-api-key": "${config.apiKey}"
  },
  body: formData
})
.then(res => res.json())
.then(data => {
  // Returns: { success: true, url: "/file-serve/root/filename.jpg" }
  console.log("File URL:", "${config.baseUrl}" + data.url);
});`}</code>
            </pre>
          </div>

          {/* cURL Example */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex justify-between items-center">
              cURL (Terminal)
              <button 
                onClick={() => handleCopy(`curl -X POST ${endpoint} \\\n  -H "x-api-key: ${config.apiKey}" \\\n  -F "file=@/path/to/your/image.jpg"`, "curl")}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                {copied === "curl" ? "Copied!" : "Copy code"}
              </button>
            </h3>
            <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-50 overflow-x-auto border border-slate-800">
              <code>{`curl -X POST ${endpoint} \\
  -H "x-api-key: ${config.apiKey}" \\
  -F "file=@/path/to/your/image.jpg"`}</code>
            </pre>
          </div>

          {/* Python Example */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex justify-between items-center">
              Python (requests)
              <button 
                onClick={() => handleCopy(`import requests\n\nurl = "${endpoint}"\nheaders = { "x-api-key": "${config.apiKey}" }\nfiles = { "file": open("image.jpg", "rb") }\n\nresponse = requests.post(url, headers=headers, files=files)\nprint(response.json())`, "python")}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                {copied === "python" ? "Copied!" : "Copy code"}
              </button>
            </h3>
            <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-50 overflow-x-auto border border-slate-800">
              <code>{`import requests

url = "${endpoint}"
headers = { "x-api-key": "${config.apiKey}" }
files = { "file": open("image.jpg", "rb") }

response = requests.post(url, headers=headers, files=files)
print(response.json())`}</code>
            </pre>
          </div>

          {/* Node.js Example */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex justify-between items-center">
              Node.js (Axios)
              <button 
                onClick={() => handleCopy(`const axios = require('axios');\nconst FormData = require('form-data');\nconst fs = require('fs');\n\nconst form = new FormData();\nform.append('file', fs.createReadStream('image.jpg'));\n\naxios.post('${endpoint}', form, {\n  headers: {\n    'x-api-key': '${config.apiKey}',\n    ...form.getHeaders()\n  }\n}).then(res => console.log(res.data));`, "node")}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                {copied === "node" ? "Copied!" : "Copy code"}
              </button>
            </h3>
            <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-50 overflow-x-auto border border-slate-800">
              <code>{`const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('image.jpg'));

axios.post('${endpoint}', form, {
  headers: {
    'x-api-key': '${config.apiKey}',
    ...form.getHeaders()
  }
}).then(res => console.log(res.data));`}</code>
            </pre>
          </div>

          {/* PHP Example */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex justify-between items-center">
              PHP (cURL)
              <button 
                onClick={() => handleCopy(`<?php\n\n$url = "${endpoint}";\n$file_path = realpath("image.jpg");\n\n$cfile = new CURLFile($file_path);\n$data = array('file' => $cfile);\n\n$ch = curl_init();\ncurl_setopt($ch, CURLOPT_URL, $url);\ncurl_setopt($ch, CURLOPT_POST, 1);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, $data);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, array("x-api-key: ${config.apiKey}"));\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n\n$response = curl_exec($ch);\ncurl_close($ch);\n\necho $response;\n?>`, "php")}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                {copied === "php" ? "Copied!" : "Copy code"}
              </button>
            </h3>
            <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-50 overflow-x-auto border border-slate-800">
              <code>{`<?php

$url = "${endpoint}";
$file_path = realpath("image.jpg");

$cfile = new CURLFile($file_path);
$data = array('file' => $cfile);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, array("x-api-key: ${config.apiKey}"));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`}</code>
            </pre>
          </div>

          {/* React Example */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex justify-between items-center">
              React (Frontend)
              <button 
                onClick={() => handleCopy(`const handleUpload = async (event) => {\n  const file = event.target.files[0];\n  if (!file) return;\n\n  const formData = new FormData();\n  formData.append("file", file);\n  formData.append("folder", "user_uploads"); // Optional: Specify folder\n\n  const res = await fetch("${endpoint}", {\n    method: "POST",\n    headers: { "x-api-key": "${config.apiKey}" },\n    body: formData\n  });\n\n  const data = await res.json();\n  console.log("Uploaded to:", "${config.baseUrl}" + data.url);\n};`, "react")}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                {copied === "react" ? "Copied!" : "Copy code"}
              </button>
            </h3>
            <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-50 overflow-x-auto border border-slate-800">
              <code>{`const handleUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "user_uploads"); // Optional: Specify folder

  const res = await fetch("${endpoint}", {
    method: "POST",
    headers: { "x-api-key": "${config.apiKey}" },
    body: formData
  });

  const data = await res.json();
  console.log("Uploaded to:", "${config.baseUrl}" + data.url);
};`}</code>
            </pre>
          </div>

        </div>
      </div>

      {/* Advanced Features */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <LinkIcon className="h-5 w-5 text-indigo-500" />
          Advanced Features
        </h2>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Specifying a Folder</h3>
            <p>
              By default, files uploaded via the API are placed in the <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">root</code> folder.
              You can specify a target folder by adding a <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">folder</code> field to your FormData payload.
              <br /><br />
              <strong>Example:</strong> <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-pink-600 dark:text-pink-400">formData.append("folder", "api_uploads");</code>
            </p>
          </div>
          
          <hr className="border-slate-200 dark:border-slate-700" />

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Automatic Optimization</h3>
            <p>
              - <strong>Images:</strong> Automatically compressed and WebP thumbnails are generated.<br />
              - <strong>Videos:</strong> Automatically compressed in the background using FFmpeg (if enabled on the server).
            </p>
          </div>
        </div>
      </div>

      {/* Downloading Files */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Code className="h-5 w-5 text-indigo-500" />
          Downloading Files
        </h2>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
          <p>
            Files uploaded to the storage server are public by default. You do NOT need an API key to download them.
            Simply use the public link returned in the upload response.
          </p>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Direct Link</h3>
            <pre className="rounded-lg bg-slate-100 p-4 text-sm text-slate-800 dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-700 overflow-x-auto">
              <code>{config.baseUrl}/file-serve/root/image.jpg</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 mt-4">Download via cURL</h3>
            <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-50 overflow-x-auto border border-slate-800">
              <code>curl -O {config.baseUrl}/file-serve/root/image.jpg</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 mt-4">Download via JavaScript</h3>
            <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-50 overflow-x-auto border border-slate-800">
              <code>{`fetch("${config.baseUrl}/file-serve/root/image.jpg")
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "image.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });`}</code>
            </pre>
          </div>
        </div>
      </div>
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
