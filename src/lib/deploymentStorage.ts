import {
  checklistTemplate,
  MAX_DEPLOYMENT_NAME_LENGTH,
  MAX_DEPLOYMENT_OWNER_LENGTH,
  MAX_DEPLOYMENT_VERSION_LENGTH,
} from '../domain/deployments'
import { categories, environments } from '../domain/types'
import type { ChecklistItem, Deployment } from '../domain/types'

export const DEPLOYMENTS_STORAGE_KEY = 'deployguard.deployments.v1'
const MAX_STORED_DEPLOYMENTS = 1_000

function isChecklistItem(value: unknown): value is ChecklistItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>

  return (
    typeof item.id === 'string' &&
    typeof item.label === 'string' &&
    typeof item.completed === 'boolean' &&
    typeof item.category === 'string' &&
    categories.some((category) => category === item.category)
  )
}

function isRequiredText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value
}

function hasCanonicalChecklist(items: unknown[]): items is ChecklistItem[] {
  return (
    items.length === checklistTemplate.length &&
    items.every((item, index) => {
      const templateItem = checklistTemplate[index]
      return (
        templateItem !== undefined &&
        isChecklistItem(item) &&
        item.id === templateItem.id &&
        item.category === templateItem.category &&
        item.label === templateItem.label
      )
    })
  )
}

function isDeployment(value: unknown): value is Deployment {
  if (!value || typeof value !== 'object') return false
  const deployment = value as Record<string, unknown>

  return (
    isRequiredText(deployment.id, 128) &&
    isRequiredText(deployment.name, MAX_DEPLOYMENT_NAME_LENGTH) &&
    isRequiredText(deployment.version, MAX_DEPLOYMENT_VERSION_LENGTH) &&
    isRequiredText(deployment.owner, MAX_DEPLOYMENT_OWNER_LENGTH) &&
    isIsoDate(deployment.createdAt) &&
    typeof deployment.environment === 'string' &&
    environments.some(
      (environment) => environment === deployment.environment,
    ) &&
    Array.isArray(deployment.items) &&
    hasCanonicalChecklist(deployment.items)
  )
}

export function loadDeployments(): Deployment[] | null {
  try {
    const stored = localStorage.getItem(DEPLOYMENTS_STORAGE_KEY)
    if (stored === null) return null

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed) || parsed.length > MAX_STORED_DEPLOYMENTS || !parsed.every(isDeployment)) {
      return null
    }

    const ids = new Set(parsed.map((deployment) => deployment.id))
    return ids.size === parsed.length ? parsed : null
  } catch {
    return null
  }
}

export function saveDeployments(deployments: readonly Deployment[]): boolean {
  try {
    localStorage.setItem(DEPLOYMENTS_STORAGE_KEY, JSON.stringify(deployments))
    return true
  } catch {
    return false
  }
}
