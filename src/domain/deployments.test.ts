import { describe, expect, it } from 'vitest'

import {
  calculateProgress,
  createDeployment,
  filterDeployments,
  getDeploymentStatus,
  toggleChecklistItem,
} from './deployments'
import type { Deployment } from './types'

const input = {
  name: 'Payments API',
  version: '1.8.0',
  owner: 'Platform Team',
  environment: 'production' as const,
}

describe('deployment readiness domain', () => {
  it('creates a deployment with every readiness category unchecked', () => {
    const deployment = createDeployment(input, {
      id: 'deployment-1',
      createdAt: '2026-09-18T03:00:00.000Z',
    })

    expect(deployment).toMatchObject({
      id: 'deployment-1',
      name: 'Payments API',
      version: '1.8.0',
      owner: 'Platform Team',
      environment: 'production',
      createdAt: '2026-09-18T03:00:00.000Z',
    })
    expect(new Set(deployment.items.map((item) => item.category))).toEqual(
      new Set([
        'code-quality',
        'testing',
        'security',
        'database',
        'observability',
        'rollback',
      ]),
    )
    expect(deployment.items.every((item) => !item.completed)).toBe(true)
  })

  it('trims text fields but preserves unicode and punctuation', () => {
    const deployment = createDeployment({
      name: '  Rilis 🚀 O\'Hara  ',
      version: '  2026.09-rc.1  ',
      owner: '  Tim Éclair  ',
      environment: 'staging',
    })

    expect(deployment.name).toBe("Rilis 🚀 O'Hara")
    expect(deployment.version).toBe('2026.09-rc.1')
    expect(deployment.owner).toBe('Tim Éclair')
  })

  it('rejects empty required text fields', () => {
    expect(() => createDeployment({ ...input, name: '   ' })).toThrow(
      'Deployment name is required',
    )
    expect(() => createDeployment({ ...input, version: '' })).toThrow(
      'Version is required',
    )
    expect(() => createDeployment({ ...input, owner: '' })).toThrow(
      'Owner is required',
    )
  })

  it('rejects an invalid environment at runtime', () => {
    expect(() => createDeployment({ ...input, environment: 'preview' as never })).toThrow(
      'Environment is invalid',
    )
  })

  it('enforces sensible maximum lengths for all text fields', () => {
    expect(createDeployment({ ...input, name: 'a'.repeat(80) }).name).toHaveLength(80)
    expect(() => createDeployment({ ...input, name: 'a'.repeat(81) })).toThrow(
      'Deployment name must be 80 characters or fewer',
    )
    expect(() => createDeployment({ ...input, version: 'v'.repeat(31) })).toThrow(
      'Version must be 30 characters or fewer',
    )
    expect(() => createDeployment({ ...input, owner: 'o'.repeat(61) })).toThrow(
      'Owner must be 60 characters or fewer',
    )
  })

  it('calculates progress safely for empty and partially completed checklists', () => {
    expect(calculateProgress([])).toBe(0)
    expect(
      calculateProgress([
        { id: 'one', label: 'One', category: 'testing', completed: true },
        { id: 'two', label: 'Two', category: 'testing', completed: false },
        { id: 'three', label: 'Three', category: 'testing', completed: false },
      ]),
    ).toBe(33)
  })

  it('only marks a non-empty, fully completed checklist ready', () => {
    expect(getDeploymentStatus([])).toBe('not-ready')
    expect(
      getDeploymentStatus([
        { id: 'one', label: 'One', category: 'rollback', completed: true },
      ]),
    ).toBe('ready')
  })

  it('filters by case-insensitive search, environment, and readiness status', () => {
    const base = createDeployment({ ...input, name: 'Customer Portal' }, {
      id: 'one',
    })
    const ready: Deployment = {
      ...createDeployment(
        { ...input, name: 'Worker Service', version: '9.1.0', owner: 'Data Guild', environment: 'staging' },
        { id: 'two' },
      ),
      items: createDeployment({ ...input, name: 'Worker Service', version: '9.1.0', owner: 'Data Guild', environment: 'staging' }).items.map((item) => ({
        ...item,
        completed: true,
      })),
    }
    const deployments = [base, ready]

    expect(
      filterDeployments(deployments, {
        query: 'customer',
        environment: 'all',
        status: 'all',
      }),
    ).toEqual([base])
    expect(
      filterDeployments(deployments, {
        query: '9.1',
        environment: 'all',
        status: 'all',
      }),
    ).toEqual([ready])
    expect(
      filterDeployments(deployments, {
        query: 'data guild',
        environment: 'all',
        status: 'all',
      }),
    ).toEqual([ready])
    expect(
      filterDeployments(deployments, {
        query: '',
        environment: 'staging',
        status: 'ready',
      }),
    ).toEqual([ready])
    expect(
      filterDeployments(deployments, {
        query: 'missing',
        environment: 'all',
        status: 'all',
      }),
    ).toEqual([])
  })

  it('updates only the selected checklist item without mutating input', () => {
    const original = createDeployment({ ...input, name: 'API', environment: 'development' })
    const selectedItem = original.items.at(0)
    expect(selectedItem).toBeDefined()
    const updated = toggleChecklistItem(original, selectedItem!.id)

    expect(updated).not.toBe(original)
    expect(updated.items.at(0)?.completed).toBe(true)
    expect(original.items.at(0)?.completed).toBe(false)
    expect(updated.items.slice(1)).toEqual(original.items.slice(1))
  })

  it('filters a 10,000 deployment collection', () => {
    const deployments = Array.from({ length: 10_000 }, (_, index) =>
      createDeployment({ ...input, name: `Service ${index}` }, { id: String(index) }),
    )

    expect(
      filterDeployments(deployments, {
        query: 'Service 9999',
        environment: 'production',
        status: 'not-ready',
      }).map((deployment) => deployment.id),
    ).toEqual(['9999'])
  })
})
