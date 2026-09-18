import { useEffect, useMemo, useState } from 'react'

import { CreateDeploymentDialog } from './components/CreateDeploymentDialog'
import { DeleteDeploymentDialog } from './components/DeleteDeploymentDialog'
import { DeploymentCard } from './components/DeploymentCard'
import {
  createDeployment,
  filterDeployments,
  getDeploymentStatus,
  toggleChecklistItem,
} from './domain/deployments'
import type {
  CreateDeploymentInput,
  Deployment,
  DeploymentFilters,
} from './domain/types'
import { loadDeployments, saveDeployments } from './lib/deploymentStorage'

const sampleDeployment = createDeployment(
  {
    name: 'Customer Portal',
    version: '2.4.0',
    owner: 'Maya Putri',
    environment: 'production',
  },
  {
    id: 'sample-customer-portal',
    createdAt: '2026-09-18T03:00:00.000Z',
  },
)

const initialFilters: DeploymentFilters = {
  query: '',
  environment: 'all',
  status: 'all',
}

export default function App() {
  const [deployments, setDeployments] = useState<Deployment[]>(() =>
    loadDeployments() ?? [sampleDeployment],
  )
  const [filters, setFilters] = useState(initialFilters)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Deployment | null>(null)
  const [storageWarning, setStorageWarning] = useState(false)

  useEffect(() => {
    const saved = saveDeployments(deployments)
    const warningTimer = window.setTimeout(() => setStorageWarning(!saved), 0)
    return () => window.clearTimeout(warningTimer)
  }, [deployments])

  const visibleDeployments = useMemo(
    () => filterDeployments(deployments, filters),
    [deployments, filters],
  )
  const readyCount = deployments.filter(
    (deployment) => getDeploymentStatus(deployment.items) === 'ready',
  ).length

  function addDeployment(input: CreateDeploymentInput) {
    setDeployments((current) => [
      createDeployment(input),
      ...current,
    ])
    setCreateDialogOpen(false)
  }

  function toggleItem(deploymentId: string, itemId: string) {
    setDeployments((current) =>
      current.map((deployment) =>
        deployment.id === deploymentId
          ? toggleChecklistItem(deployment, itemId)
          : deployment,
      ),
    )
  }

  function deleteDeployment() {
    if (!pendingDelete) return
    setDeployments((current) =>
      current.filter((deployment) => deployment.id !== pendingDelete.id),
    )
    setPendingDelete(null)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main-content" aria-label="DeployGuard home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 28 32"><path d="M14 1 26 6v9c0 7.5-4.6 13.4-12 16C6.6 28.4 2 22.5 2 15V6l12-5Z" /><path d="m8 16 4 4 8-9" /></svg>
          </span>
          <span>Deploy<span>Guard</span></span>
        </a>
        <div className="topbar-meta">
          <span className="live-indicator"><span aria-hidden="true" />Local workspace</span>
          <a className="github-link" href="https://github.com/an-hal/DeployGuard" target="_blank" rel="noreferrer" aria-label="Open DeployGuard on GitHub">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48v-1.69c-2.78.61-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.7c.85 0 1.7.11 2.5.34 1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>
          </a>
        </div>
      </header>

      <main id="main-content">
        <section className="hero">
          <div>
            <p className="eyebrow">Release command center</p>
            <h1>Ship with confidence.</h1>
            <p>One practical checklist for every production release.</p>
          </div>
          <button className="button button--primary button--new" type="button" onClick={() => setCreateDialogOpen(true)}>
            <span aria-hidden="true">+</span> New deployment
          </button>
        </section>

        <section className="metrics" aria-label="Deployment summary">
          <div className="metric">
            <span className="metric-label">Total deployments</span>
            <strong>{deployments.length}</strong>
          </div>
          <div className="metric">
            <span className="metric-label">Ready to ship</span>
            <strong>{readyCount}</strong>
          </div>
          <div className="metric metric--accent">
            <span className="metric-label">Needs attention</span>
            <strong>{deployments.length - readyCount}</strong>
          </div>
        </section>

        {storageWarning && (
          <p className="storage-warning" role="status">
            Changes cannot be saved in this browser. Check storage permissions or available space.
          </p>
        )}

        <section className="workspace" aria-labelledby="deployments-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Workspace</p>
              <h2 id="deployments-heading">Deployments</h2>
            </div>
            <span className="result-count">{visibleDeployments.length} shown</span>
          </div>

          <div className="filters">
            <label className="search-field">
              <span className="sr-only">Search deployments</span>
              <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
              <input
                type="search"
                aria-label="Search deployments"
                placeholder="Search deployments..."
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              />
            </label>
            <label className="filter-field">
              <span>Environment</span>
              <select
                aria-label="Filter by environment"
                value={filters.environment}
                onChange={(event) => setFilters((current) => ({ ...current, environment: event.target.value as DeploymentFilters['environment'] }))}
              >
                <option value="all">All environments</option>
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </label>
            <label className="filter-field">
              <span>Status</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as DeploymentFilters['status'] }))}
              >
                <option value="all">All statuses</option>
                <option value="ready">Ready</option>
                <option value="not-ready">Not ready</option>
              </select>
            </label>
          </div>

          <div className="deployment-list" aria-live="polite">
            {visibleDeployments.map((deployment) => (
              <DeploymentCard
                key={deployment.id}
                deployment={deployment}
                onToggle={toggleItem}
                onDelete={setPendingDelete}
              />
            ))}
            {visibleDeployments.length === 0 && (
              <div className="empty-state">
                <div aria-hidden="true">◇</div>
                <h3>{deployments.length === 0 ? 'No deployments yet.' : 'No deployments match your filters.'}</h3>
                <p>{deployments.length === 0 ? 'Create your first deployment readiness checklist.' : 'Try changing your search or filter selection.'}</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer>
        <span>DeployGuard</span>
        <span>Release readiness, without the guesswork.</span>
      </footer>

      {createDialogOpen && (
        <CreateDeploymentDialog open onClose={() => setCreateDialogOpen(false)} onCreate={addDeployment} />
      )}
      <DeleteDeploymentDialog deployment={pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={deleteDeployment} />
    </div>
  )
}
