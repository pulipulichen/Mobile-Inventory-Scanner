type SaveFileHandle = {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type SaveFilePicker = (options: {
  suggestedName: string;
  types: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}) => Promise<SaveFileHandle>;

export type SaveTarget =
  | { kind: "cancelled" }
  | { kind: "handle"; handle: SaveFileHandle }
  | { kind: "anchor" };

function getSaveFilePicker(): SaveFilePicker | undefined {
  const picker = (
    window as Window & {
      showSaveFilePicker?: SaveFilePicker;
    }
  ).showSaveFilePicker;
  return typeof picker === "function" ? picker : undefined;
}

export async function chooseSaveTarget(
  filename: string,
  description: string,
): Promise<SaveTarget> {
  const picker = getSaveFilePicker();
  if (!picker) return { kind: "anchor" };

  try {
    const handle = await picker({
      suggestedName: filename,
      types: [
        {
          description,
          accept: { "application/pdf": [".pdf"] },
        },
      ],
    });
    return { kind: "handle", handle };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { kind: "cancelled" };
    }
    return { kind: "anchor" };
  }
}

export async function saveBlob(
  blob: Blob,
  filename: string,
  target: Exclude<SaveTarget, { kind: "cancelled" }>,
): Promise<void> {
  if (target.kind === "handle") {
    const writable = await target.handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
