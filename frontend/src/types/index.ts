export type PlanId = "SOLO" | "FAMILY" | "PATRIMONY"
export type TreeType = "GENEALOGY" | "ORGANIZATION"
export type TreeBackgroundMode = "NONE" | "COVER" | "REPEAT"
export type TreeVisibility = "PRIVATE" | "SHARED" | "PUBLIC"
export type CollaboratorRole = "VIEWER" | "EDITOR"

export type OrgLexiconPreset = "enterprise" | "school" | "promo" | "crew" | "custom"
export type LevelOrder = "TOP_HIGH" | "TOP_LOW"

export interface OrgLexiconConfig {
  preset: OrgLexiconPreset
  levelTerm: string
  levelAbbrev: string
  levelOrder: LevelOrder
  superiorLabel: string
  subordinateLabel: string
  addSuperior: string
  addSubordinate: string
  newSubordinate: string
  linkExistingSubordinate: string
  asSuperior: string
  asSubordinate: string
  superiorOf: string
  subordinateOf: string
  roleLabel: string
  addTitle: string
}

export interface User {
  id: string
  phone: string
  email?: string | null
  name?: string | null
  plan?: PlanId
  planActive?: boolean
  planExpiresAt?: string | null
  role?: "USER" | "ADMIN"
  locale?: string
  createdAt: string
  updatedAt?: string
}

export interface TreeAccess {
  canRead: boolean
  canWrite: boolean
  canEditPerson?: boolean
  canExport?: boolean
  canVersioning?: boolean
  role: "owner" | "editor" | "viewer" | "demo" | "none" | string
  isDemo: boolean
}

export interface TreeCollaborator {
  id: string
  treeId: string
  userId: string
  role: CollaboratorRole
  User: { id: string; phone: string; email?: string | null; name?: string | null }
}

export interface TreeInvite {
  id: string
  email: string
  role: CollaboratorRole
  status: string
  token: string
}

export interface Person {
  id: string
  firstName: string
  lastName: string
  birthDate?: string | null
  birthPlace?: string | null
  deathDate?: string | null
  occupation?: string | null
  biography?: string | null
  gender?: "male" | "female" | "other" | null
  photoUrl?: string | null
  treeId: string
  createdAt?: string
  updatedAt?: string
}

export interface Relationship {
  id: string
  type: string
  sourceId: string
  targetId: string
}

export interface NodePosition {
  id: string
  nodeId: string
  treeId: string
  x: number
  y: number
}

export interface Edge {
  id: string
  source: string
  target: string
  type?: string | null
  sourceHandle?: string | null
  targetHandle?: string | null
  data?: Record<string, unknown> | null
  treeId: string
}

export interface FamilyTree {
  id: string
  name: string
  description?: string | null
  isPublic: boolean
  visibility?: TreeVisibility
  isDemo?: boolean
  treeType?: TreeType
  backgroundImageUrl?: string | null
  backgroundMode?: TreeBackgroundMode
  backgroundOpacity?: number
  backgroundOverlay?: boolean
  backgroundTileSize?: number
  orgLexicon?: OrgLexiconConfig | null
  ownerId: string
  createdAt?: string
  updatedAt?: string
  Person?: Person[]
  Relationship?: Relationship[]
  NodePosition?: NodePosition[]
  Edge?: Edge[]
  _count?: { Person: number }
  TreeCollaborator?: { role: CollaboratorRole }[]
}

export type PersonTone = "ocean" | "plum" | "rose" | "sage" | "amber" | "stone"

export interface NormalizedPerson {
  id: string
  given: string
  sur: string
  born: number | null
  died: number | null
  birthDate: string | null
  deathDate: string | null
  place: string
  bio: { fr: string; en: string }
  generation: number
  tone: PersonTone
  parentIds: string[]
  spouseIds: string[]
  photoUrl: string | null
  isAlive: boolean
  occupation?: string
}

export interface TreeTweaks {
  theme: "light" | "dark"
  layout: "vertical" | "horizontal" | "radial"
  density: "spacious" | "compact"
  cardStyle: "square" | "round" | "horizontal" | "minimal"
  connStyle: "elbow" | "curve" | "straight"
  generation: string
  hideDates: boolean
  hidePlaces: boolean
  hidePhotos: boolean
}

export interface Position {
  x: number
  y: number
}

export type DocumentCategory = "birth" | "marriage" | "death" | "census" | "photo" | "other"

export interface PersonDocument {
  id: string
  personId: string
  treeId: string
  title: string
  fileName: string
  fileUrl: string
  fileKey: string
  mimeType: string
  sizeBytes: number
  category: DocumentCategory
  uploadedById?: string | null
  createdAt: string
  updatedAt?: string
}

export interface StorageConfig {
  enabled: boolean
  ready?: boolean
  useProxy?: boolean
  publicBaseUrl?: string | null
  prefixes?: { photos: string; documents: string }
  limits?: { photoMaxMb: number; documentMaxMb: number }
  allowedPhotoMime?: string[]
  allowedDocumentMime?: string[]
  documentCategories?: { id: DocumentCategory; label: string }[]
}

export interface ApiResult {
  success: boolean
  message?: string
}

declare global {
  interface Window {
    __focusOn?: (id: string) => void
    __triggerGrow?: () => void
  }
}
