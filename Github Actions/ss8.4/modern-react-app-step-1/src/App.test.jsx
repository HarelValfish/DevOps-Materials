import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('renders Understanding Artifacts heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /understanding artifacts/i })).toBeInTheDocument()
  })

  it('increments artifacts counter on click', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: /artifacts collected: 0/i })
    await user.click(button)
    expect(screen.getByRole('button', { name: /artifacts collected: 1/i })).toBeInTheDocument()
  })
})
