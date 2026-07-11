import api from "@/lib/api"

export async function importTreeGedcom(treeId: string, file: File) {
  const form = new FormData()
  form.append("gedcom", file)
  const { data } = await api.post(`/family-trees/${treeId}/import/gedcom`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data as { importedPersons: number; importedRelationships: number; warnings?: string[] }
}
