import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { DEPLOYMENTS_STORAGE_KEY } from './lib/deploymentStorage'

describe('DeployGuard application', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('warns when browser persistence is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })

    render(<App />)

    expect(await screen.findByRole('status')).toHaveTextContent('Changes cannot be saved')
  })

  it('shows a sample deployment and its initial readiness state', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Customer Portal' }),
    ).toBeInTheDocument()
    expect(screen.getByText('v2.4.0')).toBeInTheDocument()
    expect(screen.getByText('Maya Putri')).toBeInTheDocument()
    expect(screen.getByText('Not Ready')).toBeInTheDocument()
    expect(screen.getByText('0% complete')).toBeInTheDocument()
  })

  it('creates a deployment, validates required fields, and persists it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'New deployment' }))
    const dialog = screen.getByRole('dialog', { name: 'Create deployment' })
    await user.click(within(dialog).getByRole('button', { name: 'Create deployment' }))
    expect(screen.getByText('Enter a deployment name.')).toBeInTheDocument()
    expect(screen.getByText('Enter a version.')).toBeInTheDocument()
    expect(screen.getByText('Enter an owner.')).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText('Deployment name'), 'Billing API 🚀')
    await user.type(within(dialog).getByLabelText('Version'), '1.4.0')
    await user.type(within(dialog).getByLabelText('Owner'), 'Fintech Squad')
    await user.selectOptions(within(dialog).getByLabelText('Environment'), 'staging')
    await user.click(within(dialog).getByRole('button', { name: 'Create deployment' }))

    expect(
      screen.getByRole('heading', { name: 'Billing API 🚀' }),
    ).toBeInTheDocument()
    expect(screen.getByText('v1.4.0')).toBeInTheDocument()
    expect(screen.getByText('Fintech Squad')).toBeInTheDocument()
    expect(screen.getByText('Staging')).toBeInTheDocument()
    expect(localStorage.getItem(DEPLOYMENTS_STORAGE_KEY)).toContain('Billing API')
  })

  it('hydrates saved deployments when the application is mounted again', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.click(screen.getByRole('button', { name: 'New deployment' }))
    const dialog = screen.getByRole('dialog', { name: 'Create deployment' })
    await user.type(within(dialog).getByLabelText('Deployment name'), 'Search API')
    await user.type(within(dialog).getByLabelText('Version'), '3.1.0')
    await user.type(within(dialog).getByLabelText('Owner'), 'Discovery Team')
    await user.click(within(dialog).getByRole('button', { name: 'Create deployment' }))
    unmount()

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Search API' })).toBeInTheDocument()
    expect(screen.getByText('Discovery Team')).toBeInTheDocument()
  })

  it('updates progress and readiness as checklist items are completed', async () => {
    const user = userEvent.setup()
    render(<App />)
    const card = screen
      .getByRole('heading', { name: 'Customer Portal' })
      .closest('article')

    expect(card).not.toBeNull()
    const checkboxes = within(card as HTMLElement).getAllByRole('checkbox')
    for (const checkbox of checkboxes) {
      await user.click(checkbox)
    }

    expect(within(card as HTMLElement).getByText('100% complete')).toBeInTheDocument()
    expect(within(card as HTMLElement).getByText('Ready')).toBeInTheDocument()
  })

  it('searches and filters deployments without losing saved records', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByRole('searchbox', { name: 'Search deployments' }), 'Maya Putri')
    expect(screen.getByRole('heading', { name: 'Customer Portal' })).toBeInTheDocument()
    await user.clear(screen.getByRole('searchbox', { name: 'Search deployments' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search deployments' }), '2.4.0')
    expect(screen.getByRole('heading', { name: 'Customer Portal' })).toBeInTheDocument()
    await user.clear(screen.getByRole('searchbox', { name: 'Search deployments' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search deployments' }), 'none')
    expect(screen.getByText('No deployments match your filters.')).toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'Search deployments' }))
    await user.selectOptions(screen.getByLabelText('Status'), 'ready')
    expect(screen.getByText('No deployments match your filters.')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Status'), 'all')
    expect(
      screen.getByRole('heading', { name: 'Customer Portal' }),
    ).toBeInTheDocument()
  })

  it('asks for confirmation before deleting a deployment', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Delete Customer Portal' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete deployment?' })
    expect(dialog).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('heading', { name: 'Customer Portal' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Customer Portal' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete permanently' }))
    expect(screen.getByText('No deployments yet.')).toBeInTheDocument()
  })
})
