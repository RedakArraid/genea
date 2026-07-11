import api from "@/lib/api"

function downloadBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function filenameFromDisposition(header: string | undefined, fallback: string) {
  if (!header) return fallback
  const match = /filename="?([^";\n]+)"?/i.exec(header)
  return match?.[1] || fallback
}

async function downloadExport(treeId: string, path: "gedcom" | "pdf", fallbackName: string) {
  const response = await api.get(`/family-trees/${treeId}/export/${path}`, {
    responseType: "blob",
  })
  const disposition = response.headers["content-disposition"] as string | undefined
  const filename = filenameFromDisposition(disposition, fallbackName)
  downloadBlob(response.data as Blob, filename)
}

export async function exportTreeGedcom(treeId: string, treeName: string) {
  const slug = treeName.replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 80) || "arbre"
  await downloadExport(treeId, "gedcom", `${slug}.ged`)
}

export async function exportTreePdf(treeId: string, treeName: string) {
  const slug = treeName.replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 80) || "arbre"
  await downloadExport(treeId, "pdf", `${slug}.pdf`)
}
