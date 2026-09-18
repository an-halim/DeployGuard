export const environments = ['development', 'staging', 'production'] as const

export type Environment = (typeof environments)[number]

export const categories = [
  'code-quality',
  'testing',
  'security',
  'database',
  'observability',
  'rollback',
] as const

export type ChecklistCategory = (typeof categories)[number]

export type ReadinessStatus = 'ready' | 'not-ready'

export interface ChecklistItem {
  id: string
  label: string
  category: ChecklistCategory
  completed: boolean
}

export interface Deployment {
  id: string
  name: string
  version: string
  owner: string
  environment: Environment
  createdAt: string
  items: ChecklistItem[]
}

export interface CreateDeploymentInput {
  name: string
  version: string
  owner: string
  environment: Environment
}

export interface DeploymentFilters {
  query: string
  environment: Environment | 'all'
  status: ReadinessStatus | 'all'
}
