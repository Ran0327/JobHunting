import { forwardRef, useImperativeHandle, useRef } from "react";
import { SuperDocEditor, type SuperDocRef } from "@superdoc/react";
import type { ToolbarConfig } from "superdoc";
import "superdoc/style.css";

const toolbar = {
  items: {
    left: ["undo", "redo", "font-family", "font-size"],
    center: ["bold", "italic", "underline", "text-color", "text-align", "bullet-list", "numbered-list", "linked-style"],
    right: ["table", "table-actions"],
  },
  responsiveTo: "container",
} satisfies ToolbarConfig;

type DocApi = {
  getText?: (input: object) => string | Promise<string>;
  insert?: (input: { value: string }) => unknown;
};

export type ResumeWordHandle = {
  exportDocx: () => Promise<Blob>;
  plainText: () => Promise<string>;
  insertText: (value: string) => void;
};

function documentApi(ref: SuperDocRef | null) {
  const editor = ref?.getInstance()?.activeEditor as { doc?: DocApi } | null | undefined;
  return editor?.doc;
}

async function readPlainText(ref: SuperDocRef | null) {
  const value = documentApi(ref)?.getText?.({});
  if (typeof value === "string") return value;
  if (value && typeof value.then === "function") return await value;
  return "";
}

const ResumeWordEditor = forwardRef<ResumeWordHandle, {
  document: Blob;
  onDirty: () => void;
  onText: (value: string) => void;
  onError: (message: string) => void;
}>(function ResumeWordEditor({ document, onDirty, onText, onError }, ref) {
  const editorRef = useRef<SuperDocRef>(null);
  const live = useRef(false);

  useImperativeHandle(ref, () => ({
    async exportDocx() {
      const instance = editorRef.current?.getInstance();
      if (!instance) throw new Error("编辑器还没准备好");
      const blob = await instance.export({ triggerDownload: false, exportType: ["docx"] });
      if (!(blob instanceof Blob) || blob.size < 4) throw new Error("导出的文件是空的");
      return blob;
    },
    plainText() {
      return readPlainText(editorRef.current);
    },
    insertText(value: string) {
      const text = value.trim();
      if (!text) return;
      documentApi(editorRef.current)?.insert?.({ value: `\n${text}` });
      onDirty();
    },
  }));

  return (
    <SuperDocEditor
      ref={editorRef}
      document={document}
      documentMode="editing"
      ui={{ toolbar, comments: false, ruler: false }}
      onReady={() => {
        live.current = false;
        requestAnimationFrame(() => {
          live.current = true;
          void readPlainText(editorRef.current).then(onText);
        });
      }}
      onEditorUpdate={() => {
        if (!live.current) return;
        onDirty();
        void readPlainText(editorRef.current).then(onText);
      }}
      onContentError={() => onError("这份 Word 没能打开")}
    />
  );
});

export { ResumeWordEditor };
export default ResumeWordEditor;
