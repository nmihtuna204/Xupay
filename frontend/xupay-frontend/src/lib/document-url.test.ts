import { afterEach, describe, expect, it, vi } from "vitest";
import { documentBlobUrl } from "./document-url";

// A 1x1 transparent PNG
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("documentBlobUrl", () => {
  afterEach(() => vi.restoreAllMocks());

  it("turns an image data URL into a blob URL of the same type", () => {
    const created: Blob[] = [];
    vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      created.push(blob as Blob);
      return "blob:http://localhost/doc";
    });

    expect(documentBlobUrl(`data:image/png;base64,${PNG_BASE64}`)).toBe("blob:http://localhost/doc");
    expect(created[0].type).toBe("image/png");
    expect(created[0].size).toBe(atob(PNG_BASE64).length);
  });

  it("accepts PDFs", () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:http://localhost/pdf");
    expect(documentBlobUrl(`data:application/pdf;base64,${btoa("%PDF-1.4")}`)).toBe("blob:http://localhost/pdf");
  });

  it.each([
    ["HTML, which would run as the app", `data:text/html;base64,${btoa("<script>alert(1)</script>")}`],
    ["SVG, which can carry script", `data:image/svg+xml;base64,${btoa("<svg/>")}`],
    ["a non-base64 data URL", "data:image/png,rawbytes"],
    ["not a data URL", "https://example.com/id.jpg"],
    ["malformed base64", "data:image/png;base64,***"],
  ])("refuses %s", (_label, url) => {
    const create = vi.spyOn(URL, "createObjectURL");
    expect(documentBlobUrl(url)).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });
});
