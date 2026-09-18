import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createDeployment } from '../domain/deployments'
import {
  DEPLOYMENTS_STORAGE_KEY,
  loadDeployments,
  saveDeployments,
} from './deploymentStorage'

describe('deployment storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns null when no saved state exists', () => {
    expect(loadDeployments()).toBeNull()
  })

  it('round-trips valid deployment data', () => {
    const deployments = [createDeployment({
      name: 'Web',
      version: '3.2.1',
      owner: 'Web Platform',
      environment: 'production',
    }, { id: 'web' })]

    expect(saveDeployments(deployments)).toBe(true)
    expect(loadDeployments()).toEqual(deployments)
  })

  it('ignores malformed JSON and structurally invalid saved data', () => {
    localStorage.setItem(DEPLOYMENTS_STORAGE_KEY, '{broken')
    expect(loadDeployments()).toBeNull()

    localStorage.setItem(DEPLOYMENTS_STORAGE_KEY, JSON.stringify([{ name: 42 }]))
    expect(loadDeployments()).toBeNull()

    const valid = createDeployment({
      name: 'Legacy',
      version: '1.0.0',
      owner: 'Core Team',
      environment: 'production',
    })
    const oldSchema: Partial<typeof valid> = { ...valid }
    delete oldSchema.version
    localStorage.setItem(DEPLOYMENTS_STORAGE_KEY, JSON.stringify([oldSchema]))
    expect(loadDeployments()).toBeNull()
  })

  it('rejects invalid dates and incomplete or duplicate checklists', () => {
    const valid = createDeployment({
      name: 'Payments',
      version: '2.0.0',
      owner: 'Platform Team',
      environment: 'production',
    })

    localStorage.setItem(
      DEPLOYMENTS_STORAGE_KEY,
      JSON.stringify([{ ...valid, createdAt: 'not-a-date' }]),
    )
    expect(loadDeployments()).toBeNull()

    localStorage.setItem(
      DEPLOYMENTS_STORAGE_KEY,
      JSON.stringify([{ ...valid, items: valid.items.slice(0, 1) }]),
    )
    expect(loadDeployments()).toBeNull()

    localStorage.setItem(
      DEPLOYMENTS_STORAGE_KEY,
      JSON.stringify([{ ...valid, items: valid.items.map(() => valid.items[0]) }]),
    )
    expect(loadDeployments()).toBeNull()
  })

  it('rejects duplicate deployment identifiers', () => {
    const deployment = createDeployment({
      name: 'API',
      version: '1.0.0',
      owner: 'Platform',
      environment: 'production',
    }, { id: 'duplicate' })

    localStorage.setItem(
      DEPLOYMENTS_STORAGE_KEY,
      JSON.stringify([deployment, deployment]),
    )

    expect(loadDeployments()).toBeNull()
  })

  it('does not crash when the browser rejects a write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })

    expect(saveDeployments([])).toBe(false)
  })
})
