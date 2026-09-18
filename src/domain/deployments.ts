import type {
  ChecklistCategory,
  ChecklistItem,
  CreateDeploymentInput,
  Deployment,
  DeploymentFilters,
  ReadinessStatus,
} from './types'
import { environments } from './types'

interface DeploymentOverrides {
  id?: string
  createdAt?: string
}

export const MAX_DEPLOYMENT_NAME_LENGTH = 80
export const MAX_DEPLOYMENT_VERSION_LENGTH = 30
export const MAX_DEPLOYMENT_OWNER_LENGTH = 60

export const checklistTemplate: ReadonlyArray<{
  id: string
  category: ChecklistCategory
  label: string
}> = [
  { id: 'cq-review', category: 'code-quality', label: 'Pull request has been reviewed' },
  { id: 'cq-static', category: 'code-quality', label: 'Lint and static analysis pass' },
  { id: 'test-automated', category: 'testing', label: 'Automated test suite passes' },
  { id: 'test-critical', category: 'testing', label: 'Critical user flows verified' },
  { id: 'sec-secrets', category: 'security', label: 'No secrets committed to source' },
  { id: 'sec-deps', category: 'security', label: 'Dependencies have been audited' },
  { id: 'db-migration', category: 'database', label: 'Migrations are backward compatible' },
  { id: 'db-backup', category: 'database', label: 'Backup and restore plan verified' },
  { id: 'obs-health', category: 'observability', label: 'Health checks are configured' },
  { id: 'obs-alerts', category: 'observability', label: 'Logs and alerts are configured' },
  { id: 'roll-plan', category: 'rollback', label: 'Rollback steps are documented' },
  { id: 'roll-owner', category: 'rollback', label: 'Release owner is available' },
]

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `deployment-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createDeployment(
  input: CreateDeploymentInput,
  overrides: DeploymentOverrides = {},
): Deployment {
  const normalizedName = input.name.trim()
  const normalizedVersion = input.version.trim()
  const normalizedOwner = input.owner.trim()
  if (!normalizedName) {
    throw new Error('Deployment name is required')
  }
  if (normalizedName.length > MAX_DEPLOYMENT_NAME_LENGTH) {
    throw new Error(
      `Deployment name must be ${MAX_DEPLOYMENT_NAME_LENGTH} characters or fewer`,
    )
  }
  if (!normalizedVersion) {
    throw new Error('Version is required')
  }
  if (normalizedVersion.length > MAX_DEPLOYMENT_VERSION_LENGTH) {
    throw new Error(
      `Version must be ${MAX_DEPLOYMENT_VERSION_LENGTH} characters or fewer`,
    )
  }
  if (!normalizedOwner) {
    throw new Error('Owner is required')
  }
  if (normalizedOwner.length > MAX_DEPLOYMENT_OWNER_LENGTH) {
    throw new Error(
      `Owner must be ${MAX_DEPLOYMENT_OWNER_LENGTH} characters or fewer`,
    )
  }
  if (!environments.some((environment) => environment === input.environment)) {
    throw new Error('Environment is invalid')
  }

  return {
    id: overrides.id ?? newId(),
    name: normalizedName,
    version: normalizedVersion,
    owner: normalizedOwner,
    environment: input.environment,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    items: checklistTemplate.map((item): ChecklistItem => ({
      ...item,
      completed: false,
    })),
  }
}

export function calculateProgress(items: readonly ChecklistItem[]): number {
  if (items.length === 0) return 0

  const completed = items.filter((item) => item.completed).length
  return Math.round((completed / items.length) * 100)
}

export function getDeploymentStatus(
  items: readonly ChecklistItem[],
): ReadinessStatus {
  return items.length > 0 && items.every((item) => item.completed)
    ? 'ready'
    : 'not-ready'
}

export function filterDeployments(
  deployments: readonly Deployment[],
  filters: DeploymentFilters,
): Deployment[] {
  const query = filters.query.trim().toLocaleLowerCase()

  return deployments.filter((deployment) => {
    const searchableText = [
      deployment.name,
      deployment.version,
      deployment.owner,
    ]
      .join(' ')
      .toLocaleLowerCase()
    const matchesQuery = searchableText.includes(query)
    const matchesEnvironment =
      filters.environment === 'all' ||
      deployment.environment === filters.environment
    const matchesStatus =
      filters.status === 'all' ||
      getDeploymentStatus(deployment.items) === filters.status

    return matchesQuery && matchesEnvironment && matchesStatus
  })
}

export function toggleChecklistItem(
  deployment: Deployment,
  itemId: string,
): Deployment {
  return {
    ...deployment,
    items: deployment.items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    ),
  }
}

export const categoryLabels: Record<ChecklistCategory, string> = {
  'code-quality': 'Code quality',
  testing: 'Testing',
  security: 'Security',
  database: 'Database',
  observability: 'Observability',
  rollback: 'Rollback',
}
