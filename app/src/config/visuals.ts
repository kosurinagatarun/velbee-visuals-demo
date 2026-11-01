/** VelBEE Visuals — showcase product (velbee.com) */
export const VISUALS_BRAND = {
  product: 'VelBEE Visuals',
  company: 'VelBEE',
  companyUrl: 'https://velbee.com',
  marketingPath: '/visuals',
} as const

/** Hostnames that are not tenant workspaces (first label of *.velbee.com). */
export const RESERVED_VELBEE_SUBDOMAINS = new Set([
  'www',
  'api',
  'mail',
  'app',
  'cdn',
  'admin',
  'status',
])

const TENANT_ROOT_DOMAIN = 'velbee.com'

function trimSlashes(path: string): string {
  return path.replace(/\/+$/, '').replace(/^\/+/, '')
}

/** Vite `base` (e.g. `/` or `/showcase/`). */
export function appBasePath(): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return base.endsWith('/') ? base : `${base}/`
}

/**
 * Workspace tenant from `{slug}.velbee.com` (same model as VelBEE workspaces).
 * Localhost → `VITE_WORKSPACE_SLUG` or `demo`.
 */
export function workspaceSlugFromHost(): string {
  const fromEnv = import.meta.env.VITE_WORKSPACE_SLUG?.trim()
  if (typeof window === 'undefined') {
    return fromEnv || 'demo'
  }

  const host = window.location.hostname.toLowerCase()

  if (host === 'localhost' || host === '127.0.0.1') {
    return fromEnv || 'demo'
  }

  if (host === TENANT_ROOT_DOMAIN || host === `www.${TENANT_ROOT_DOMAIN}`) {
    return fromEnv || 'demo'
  }

  if (host.endsWith(`.${TENANT_ROOT_DOMAIN}`)) {
    const label = host.slice(0, -(TENANT_ROOT_DOMAIN.length + 1)).split('.')[0]
    if (label && !RESERVED_VELBEE_SUBDOMAINS.has(label)) {
      return label
    }
  }

  return fromEnv || 'demo'
}

/**
 * Showcase project on this workspace.
 * Target URL: `https://{workspace}.velbee.com/showcase/{project}/`
 */
export function projectSlug(): string {
  const fromEnv = import.meta.env.VITE_PROJECT_SLUG?.trim()
  if (fromEnv) return fromEnv

  if (typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/').filter(Boolean)
    const showcaseIdx = parts.indexOf('showcase')
    if (showcaseIdx >= 0 && parts[showcaseIdx + 1]) {
      return parts[showcaseIdx + 1]
    }
  }

  return 'demo'
}

function expandTemplate(template: string): string {
  return template
    .replaceAll('{workspace}', encodeURIComponent(workspaceSlugFromHost()))
    .replaceAll('{project}', encodeURIComponent(projectSlug()))
}

/**
 * Root URL for project JSON + images (no trailing slash).
 * Local dev: `/content`. Production: R2 public URL via `VITE_CONTENT_BASE` or `VITE_R2_PUBLIC_BASE`.
 */
export function contentBaseUrl(): string {
  const template =
    import.meta.env.VITE_CONTENT_BASE?.trim() ||
    import.meta.env.VITE_R2_PUBLIC_BASE?.trim()
  if (template) {
    const url = expandTemplate(template)
    return url.endsWith('/') ? url.slice(0, -1) : url
  }
  const base = appBasePath()
  return `${base}content`.replace(/\/{2,}/g, '/')
}

/** Future: manifest from VelBEE API using workspace + project. */
export function visualsManifestUrl(): string | null {
  const template = import.meta.env.VITE_MANIFEST_URL?.trim()
  if (!template) return null
  return expandTemplate(template)
}

export function joinContentPath(...parts: string[]): string {
  const base = contentBaseUrl()
  return [base, ...parts.map((p) => trimSlashes(p))].filter(Boolean).join('/')
}

/** Client deliverable: building orbit only (no floors, tours, or extra routes). */
export function isBuildingOnlyMode(): boolean {
  return import.meta.env.VITE_BUILDING_ONLY === 'true'
}

export function showcaseTitle(): string {
  return import.meta.env.VITE_PROJECT_TITLE?.trim() || 'Building showcase'
}
