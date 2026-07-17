import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useRegister } from '@/hooks/api/useAuth.new'
import { RegisterForm } from '../RegisterForm'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock the useRegister hook
vi.mock('@/hooks/api/useAuth.new', () => ({
  useRegister: vi.fn(),
}))

// Helper to render with QueryClient
function renderWithClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('RegisterForm', () => {
  let mockRouter: any
  let mockUseRegister: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockRouter = {
      push: vi.fn(),
    }
    vi.mocked(useRouter).mockReturnValue(mockRouter)

    mockUseRegister = {
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    }
    vi.mocked(useRegister).mockReturnValue(mockUseRegister)
  })

  it('should render register form with all required inputs', () => {
    renderWithClient(<RegisterForm />)

    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('firstName-input')).toBeInTheDocument()
    expect(screen.getByTestId('lastName-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('confirmPassword-input')).toBeInTheDocument()
    expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
  })

  it('should successfully register with valid data', () => {
    renderWithClient(<RegisterForm />)

    // Fill in all required fields
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'newuser@example.com' } })
    fireEvent.change(screen.getByTestId('firstName-input'), { target: { value: 'John' } })
    fireEvent.change(screen.getByTestId('lastName-input'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'SecurePass123!' } })
    fireEvent.change(screen.getByTestId('confirmPassword-input'), { target: { value: 'SecurePass123!' } })
    fireEvent.click(screen.getByTestId('terms-checkbox'))

    // Submit form
    fireEvent.click(screen.getByTestId('submit-button'))

    // Verify mutation was called with the payload + success/error callbacks
    expect(mockUseRegister.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123!',
      }),
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    )
  })

  it('should prevent submission without terms agreement', () => {
    renderWithClient(<RegisterForm />)

    // Fill all fields except don't check terms
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByTestId('firstName-input'), { target: { value: 'John' } })
    fireEvent.change(screen.getByTestId('lastName-input'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'SecurePass123!' } })
    fireEvent.change(screen.getByTestId('confirmPassword-input'), { target: { value: 'SecurePass123!' } })
    // DO NOT check terms checkbox

    // Try to submit
    fireEvent.click(screen.getByTestId('submit-button'))

    // Mutation should NOT have been called
    expect(mockUseRegister.mutate).not.toHaveBeenCalled()
  })

  it('should show loading state while submitting', () => {
    mockUseRegister.isPending = true
    vi.mocked(useRegister).mockReturnValue(mockUseRegister)

    renderWithClient(<RegisterForm />)

    const submitButton = screen.getByTestId('submit-button') as HTMLButtonElement
    expect(submitButton.disabled).toBe(true)
    expect(submitButton.textContent).toContain('Creating account...')
  })

  function fillAndSubmitValidForm() {
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByTestId('firstName-input'), { target: { value: 'John' } })
    fireEvent.change(screen.getByTestId('lastName-input'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'SecurePass123!' } })
    fireEvent.change(screen.getByTestId('confirmPassword-input'), { target: { value: 'SecurePass123!' } })
    fireEvent.click(screen.getByTestId('terms-checkbox'))
    fireEvent.click(screen.getByTestId('submit-button'))
  }

  it('should call onSuccess callback when registration succeeds', async () => {
    const onSuccess = vi.fn()

    // The form passes onSuccess/onError callbacks to mutate() — simulate a
    // successful mutation by invoking the provided onSuccess callback.
    mockUseRegister.mutate.mockImplementation((_payload: unknown, opts: any) => {
      opts?.onSuccess?.({ user: { id: '123', email: 'test@example.com' } })
    })
    vi.mocked(useRegister).mockReturnValue(mockUseRegister)

    renderWithClient(<RegisterForm onSuccess={onSuccess} />)
    fillAndSubmitValidForm()

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ id: '123', email: 'test@example.com' })
    })
  })

  it('should redirect after successful registration', async () => {
    mockUseRegister.mutate.mockImplementation((_payload: unknown, opts: any) => {
      opts?.onSuccess?.({ user: { id: '123', email: 'test@example.com' } })
    })
    vi.mocked(useRegister).mockReturnValue(mockUseRegister)

    renderWithClient(<RegisterForm redirectTo="/onboarding" />)
    fillAndSubmitValidForm()

    // Redirect happens after a 100ms delay inside the component
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/onboarding')
    }, { timeout: 1000 })
  })

  it('should allow optional phone field', () => {
    renderWithClient(<RegisterForm />)

    // Fill in all required fields including valid phone
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByTestId('firstName-input'), { target: { value: 'John' } })
    fireEvent.change(screen.getByTestId('lastName-input'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '+84 912345678' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'SecurePass123!' } })
    fireEvent.change(screen.getByTestId('confirmPassword-input'), { target: { value: 'SecurePass123!' } })
    fireEvent.click(screen.getByTestId('terms-checkbox'))

    // Submit should work
    fireEvent.click(screen.getByTestId('submit-button'))

    expect(mockUseRegister.mutate).toHaveBeenCalled()
  })
})
