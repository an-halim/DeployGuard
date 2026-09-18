import { useEffect, useRef, useState } from 'react'

import {
  MAX_DEPLOYMENT_NAME_LENGTH,
  MAX_DEPLOYMENT_OWNER_LENGTH,
  MAX_DEPLOYMENT_VERSION_LENGTH,
} from '../domain/deployments'
import type { CreateDeploymentInput, Environment } from '../domain/types'

interface CreateDeploymentDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (input: CreateDeploymentInput) => void
}

export function CreateDeploymentDialog({
  open,
  onClose,
  onCreate,
}: CreateDeploymentDialogProps) {
  const [name, setName] = useState('')
  const [version, setVersion] = useState('')
  const [owner, setOwner] = useState('')
  const [environment, setEnvironment] = useState<Environment>('production')
  const [errors, setErrors] = useState<Partial<Record<'name' | 'version' | 'owner', string>>>({})
  const nameInput = useRef<HTMLInputElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!open) return
    const dialogElement = dialog.current
    if (typeof dialogElement?.showModal === 'function') {
      dialogElement.showModal()
    } else {
      dialogElement?.setAttribute('open', '')
    }
    const focusTimer = window.setTimeout(() => nameInput.current?.focus(), 0)
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', closeOnEscape)
      if (dialogElement?.open && typeof dialogElement.close === 'function') {
        dialogElement.close()
      }
    }
  }, [onClose, open])

  if (!open) return null

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors = {
      ...(!name.trim() && { name: 'Enter a deployment name.' }),
      ...(!version.trim() && { version: 'Enter a version.' }),
      ...(!owner.trim() && { owner: 'Enter an owner.' }),
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onCreate({ name, version, owner, environment })
  }

  return (
    <dialog
      ref={dialog}
      className="dialog"
      aria-labelledby="create-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">New release</p>
            <h2 id="create-dialog-title">Create deployment</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={submit} noValidate>
          <label className="form-field">
            <span>Deployment name</span>
            <input
              ref={nameInput}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setErrors((current) => ({ ...current, name: undefined }))
              }}
              aria-describedby={errors.name ? 'name-error' : undefined}
              aria-invalid={Boolean(errors.name)}
              placeholder="e.g. Payments API"
              maxLength={MAX_DEPLOYMENT_NAME_LENGTH}
            />
          </label>
          {errors.name && <p className="field-error" id="name-error" role="alert">{errors.name}</p>}
          <label className="form-field">
            <span>Version</span>
            <input
              value={version}
              onChange={(event) => {
                setVersion(event.target.value)
                setErrors((current) => ({ ...current, version: undefined }))
              }}
              aria-describedby={errors.version ? 'version-error' : undefined}
              aria-invalid={Boolean(errors.version)}
              placeholder="e.g. 1.8.0"
              maxLength={MAX_DEPLOYMENT_VERSION_LENGTH}
            />
          </label>
          {errors.version && <p className="field-error" id="version-error" role="alert">{errors.version}</p>}
          <label className="form-field">
            <span>Owner</span>
            <input
              value={owner}
              onChange={(event) => {
                setOwner(event.target.value)
                setErrors((current) => ({ ...current, owner: undefined }))
              }}
              aria-describedby={errors.owner ? 'owner-error' : undefined}
              aria-invalid={Boolean(errors.owner)}
              placeholder="e.g. Platform team"
              maxLength={MAX_DEPLOYMENT_OWNER_LENGTH}
            />
          </label>
          {errors.owner && <p className="field-error" id="owner-error" role="alert">{errors.owner}</p>}
          <label className="form-field">
            <span>Environment</span>
            <select
              aria-label="Environment"
              value={environment}
              onChange={(event) => setEnvironment(event.target.value as Environment)}
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </label>
          <div className="dialog-actions">
            <button className="button button--secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button button--primary" type="submit">Create deployment</button>
          </div>
        </form>
    </dialog>
  )
}
