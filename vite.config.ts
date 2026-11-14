import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const root = path.dirname(fileURLToPath(import.meta.url));
const exportWorkerDir = path.join(root, "node_modules/@superdoc/docx-engine/dist/assets");

function findExportWorker() {
  try {
    const name = fs.readdirSync(exportWorkerDir).find((item) => item.startsWith("docx-zip-worker") && item.endsWith(".js"));
    return name ? path.join(exportWorkerDir, name) : "";
  } catch {
    return "";
  }
}

function superdocExportWorker(): Plugin {
  return {
    name: "superdoc-export-worker",
    configureServer(server) {
      const exportWorker = findExportWorker();
      const workerName = exportWorker ? path.basename(exportWorker) : "";
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (!workerName || path.basename(url) !== workerName) {
          next();
          return;
        }
        res.setHeader("Content-Type", "text/javascript; charset=utf-8");
        fs.createReadStream(exportWorker).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [superdocExportWorker(), react()],
  server: { port: 5173, watch: { ignored: ["**/.tmp/**"] } },
});
