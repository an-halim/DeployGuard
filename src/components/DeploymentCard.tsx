import {
  calculateProgress,
  categoryLabels,
  getDeploymentStatus,
} from '../domain/deployments'
import { categories } from '../domain/types'
import type { Deployment } from '../domain/types'

interface DeploymentCardProps {
  deployment: Deployment
  onToggle: (deploymentId: string, itemId: string) => void
  onDelete: (deployment: Deployment) => void
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function DeploymentCard({
  deployment,
  onToggle,
  onDelete,
}: DeploymentCardProps) {
  const progress = calculateProgress(deployment.items)
  const status = getDeploymentStatus(deployment.items)

  return (
    <article className="deployment-card">
      <header className="card-header">
        <div>
          <div className="card-meta">
            <span className={`environment environment--${deployment.environment}`}>
              {deployment.environment}
            </span>
            <span>v{deployment.version}</span>
            <span>{formatDate(deployment.createdAt)}</span>
          </div>
          <h2>{deployment.name}</h2>
          <p className="card-owner">Owned by <strong>{deployment.owner}</strong></p>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label={`Delete ${deployment.name}`}
          onClick={() => onDelete(deployment)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
            <path d="M8 8v10m4-10v10m4-10v10M5 5h14m-2 0-.7 15H7.7L7 5m3-2h4l1 2H9l1-2Z" />
          </svg>
        </button>
      </header>

      <div className="progress-summary">
        <div className="progress-copy">
          <span>{progress}% complete</span>
          <strong className={`status status--${status}`}>
            <span className="status-dot" aria-hidden="true" />
            {status === 'ready' ? 'Ready' : 'Not Ready'}
          </strong>
        </div>
        <progress
          className="progress-track"
          aria-label={`${deployment.name} readiness`}
          max={100}
          value={progress}
        >
          {progress}%
        </progress>
      </div>

      <div className="checklist-grid">
        {categories.map((category) => {
          const items = deployment.items.filter(
            (item) => item.category === category,
          )
          const completed = items.filter((item) => item.completed).length

          return (
            <fieldset className="checklist-group" key={category}>
              <legend>
                <span className={`category-icon category-icon--${category}`} aria-hidden="true">
                  {categoryLabels[category].charAt(0)}
                </span>
                <span>{categoryLabels[category]}</span>
                <span className="group-count">
                  {completed}/{items.length}
                </span>
              </legend>
              {items.map((item) => (
                <label className="checklist-item" key={item.id}>
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => onToggle(deployment.id, item.id)}
                  />
                  <span className="custom-checkbox" aria-hidden="true">
                    <svg viewBox="0 0 12 10">
                      <path d="m1 5 3 3 7-7" />
                    </svg>
                  </span>
                  <span>{item.label}</span>
                </label>
              ))}
            </fieldset>
          )
        })}
      </div>
    </article>
  )
}
