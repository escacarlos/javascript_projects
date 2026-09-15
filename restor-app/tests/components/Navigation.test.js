import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import Navigation from '@/components/Navigation.vue'
import { store } from '@/store/store'
import { mockToastCreate } from '../../vitest.setup.js'
import { logout as logoutService } from '@/services/authService'

vi.mock('@/services/authService', () => ({
  logout: vi.fn(),
}))

const currentRoute = ref({ name: 'Home' })
const mockRouter = {
  push: vi.fn(),
  currentRoute,
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => mockRouter,
  }
})

function mountNavigation() {
  return mount(Navigation, {
    global: {
      stubs: {
        SearchInput: {
          name: 'SearchInput',
          template: '<div data-testid="search-input" />',
        },
        FavoriteViewModal: {
          name: 'FavoriteViewModal',
          template: '<div data-testid="favorite-view-modal" />',
        },
      },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockToastCreate.mockReset()
  vi.mocked(logoutService).mockReset()
  store.user = undefined
  store.favoriteLists = undefined
  currentRoute.value = { name: 'Home' }
})

describe('Navigation', () => {
  it('renders the brand and home link', () => {
    const wrapper = mountNavigation()

    expect(wrapper.text()).toContain('RestorApp')
    expect(wrapper.text()).toContain('Home')
  })

  it('shows the login button for anonymous users and navigates to login', async () => {
    const wrapper = mountNavigation()
    const loginButton = wrapper.findAll('button').find((button) => button.text().trim() === 'Login')

    expect(loginButton).toBeDefined()
    expect(loginButton.exists()).toBe(true)

    await loginButton.trigger('click')

    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'Login' })
  })

  it('shows user info, profile button, and logout button when logged in', async () => {
    store.user = { id: 'u1', name: 'Alex' }
    currentRoute.value = { name: 'User' }
    const wrapper = mountNavigation()

    expect(wrapper.text()).toContain('Logged in as:')
    expect(wrapper.text()).toContain('Alex')

    const profileButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === 'Profile')
    const logoutButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === 'Logout')

    expect(profileButton).toBeDefined()
    expect(profileButton.exists()).toBe(true)
    expect(logoutButton).toBeDefined()
    expect(logoutButton.exists()).toBe(true)

    await logoutButton.trigger('click')

    expect(logoutService).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'Home' })
    expect(mockToastCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('logged out'),
        variant: 'info',
      }),
    )
  })

  it('renders the search input when the current route is not Home', () => {
    currentRoute.value = { name: 'Restaurant' }
    const wrapper = mountNavigation()

    expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(true)
  })

  it('does not render the search input on the Home route', () => {
    currentRoute.value = { name: 'Home' }
    const wrapper = mountNavigation()

    expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(false)
  })

  it('renders the favorite view modal when user and favoriteLists are present', () => {
    store.user = { id: 'u1', name: 'Alex' }
    store.favoriteLists = []
    const wrapper = mountNavigation()

    expect(wrapper.find('[data-testid="favorite-view-modal"]').exists()).toBe(true)
  })
})
