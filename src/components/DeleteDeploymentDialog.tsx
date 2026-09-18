import { useEffect, useRef } from 'react'

import type { Deployment } from '../domain/types'

interface DeleteDeploymentDialogProps {
  deployment: Deployment | null
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteDeploymentDialog({
  deployment,
  onCancel,
  onConfirm,
}: DeleteDeploymentDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!deployment) return
    const dialogElement = dialog.current
    if (typeof dialogElement?.showModal === 'function') {
      dialogElement.showModal()
    } else {
      dialogElement?.setAttribute('open', '')
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      if (dialogElement?.open && typeof dialogElement.close === 'function') {
        dialogElement.close()
      }
    }
  }, [deployment, onCancel])

  if (!deployment) return null

  return (
    <dialog
      ref={dialog}
      className="dialog dialog--small"
      aria-labelledby="delete-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
    >
        <div className="danger-icon" aria-hidden="true">!</div>
        <h2 id="delete-dialog-title">Delete deployment?</h2>
        <p>
          <strong>{deployment.name}</strong> and its checklist progress will be
          permanently removed.
        </p>
        <div className="dialog-actions">
          <button autoFocus className="button button--secondary" type="button" onClick={onCancel}>Cancel</button>
          <button className="button button--danger" type="button" onClick={onConfirm}>Delete permanently</button>
        </div>
    </dialog>
  )
}
