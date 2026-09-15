import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import FavoriteRestaurantModal from '@/components/FavoriteRestaurantModal.vue'
import { store } from '@/store/store'
import { addRestaurantToFavorite } from '@/services/favoritesService.js'
import { mockToastCreate } from '../../vitest.setup.js'

vi.mock('@/services/favoritesService.js', () => ({
  addRestaurantToFavorite: vi.fn(),
}))

const restaurant = { id: 'rest-1', name: 'Pizza Place' }

function mountModal() {
  return mount(FavoriteRestaurantModal, {
    props: { restaurant },
    attachTo: document.body,
  })
}

beforeEach(() => {
  vi.mocked(addRestaurantToFavorite).mockReset()
  mockToastCreate.mockReset()
  store.user = undefined
  store.favoriteLists = undefined
})

describe('FavoriteRestaurantModal', () => {
  it('disables the Favorite button when the user is not logged in', () => {
    store.user = undefined
    const wrapper = mountModal()
    const btn = wrapper.get('[data-testid="favorite-trigger"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('enables the Favorite button when the user is logged in', () => {
    store.user = { id: 'u1', name: 'Alex' }
    const wrapper = mountModal()
    const btn = wrapper.get('[data-testid="favorite-trigger"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('opens the modal when Favorite is clicked', async () => {
    store.user = { id: 'u1', name: 'Alex' }
    store.favoriteLists = []
    const wrapper = mountModal()
    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(false)

    await wrapper.get('[data-testid="favorite-trigger"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Select Favorite List')
    expect(wrapper.text()).toContain(restaurant.name)
  })

  it('shows favorite list names when lists exist', async () => {
    store.user = { id: 'u1' }
    store.favoriteLists = [
      { id: 'l1', name: 'Weekend picks', restaurants: [] },
      { id: 'l2', name: 'Date night', restaurants: [] },
    ]
    const wrapper = mountModal()
    await wrapper.get('[data-testid="favorite-trigger"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="b-list-group"]').text()).toContain('Weekend picks')
    expect(wrapper.get('[data-testid="b-list-group"]').text()).toContain('Date night')
  })

  it('shows "Already added" and disables the row when the restaurant is already in a list', async () => {
    store.user = { id: 'u1' }
    store.favoriteLists = [
      {
        id: 'l1',
        name: 'Has it',
        restaurants: [{ id: restaurant.id, name: restaurant.name }],
      },
    ]
    const wrapper = mountModal()
    await wrapper.get('[data-testid="favorite-trigger"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Already added')
    const rows = wrapper.findAll('.list-group-item')
    expect(rows).toHaveLength(1)
    expect(rows[0].attributes('disabled')).toBeDefined()

    await rows[0].trigger('click')
    expect(addRestaurantToFavorite).not.toHaveBeenCalled()
  })

  it('calls addRestaurantToFavorite with list id and restaurant id on list click', async () => {
    vi.mocked(addRestaurantToFavorite).mockResolvedValue({ restaurants: [] })
    store.user = { id: 'u1' }
    store.favoriteLists = [{ id: 'list-99', name: 'Empty', restaurants: [] }]
    const wrapper = mountModal()
    await wrapper.get('[data-testid="favorite-trigger"]').trigger('click')
    await flushPromises()

    const row = wrapper.get('.list-group-item')
    await row.trigger('click')
    await flushPromises()

    expect(addRestaurantToFavorite).toHaveBeenCalledTimes(1)
    expect(addRestaurantToFavorite).toHaveBeenCalledWith('list-99', restaurant.id)
  })

  it('shows a success toast and closes the modal when add succeeds', async () => {
    vi.mocked(addRestaurantToFavorite).mockResolvedValue({ restaurants: [{ id: restaurant.id }] })
    store.user = { id: 'u1' }
    store.favoriteLists = [{ id: 'l1', name: 'My list', restaurants: [] }]
    const wrapper = mountModal()
    await wrapper.get('[data-testid="favorite-trigger"]').trigger('click')
    await flushPromises()

    await wrapper.get('.list-group-item').trigger('click')
    await flushPromises()

    expect(mockToastCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('My list'),
        variant: 'success',
      }),
    )
    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(false)
  })

  it('shows an error toast and keeps the modal open when add fails', async () => {
    vi.mocked(addRestaurantToFavorite).mockRejectedValue(new Error('network'))
    store.user = { id: 'u1' }
    store.favoriteLists = [{ id: 'l1', name: 'My list', restaurants: [] }]
    const wrapper = mountModal()
    await wrapper.get('[data-testid="favorite-trigger"]').trigger('click')
    await flushPromises()

    await wrapper.get('.list-group-item').trigger('click')
    await flushPromises()

    expect(mockToastCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Error'),
        variant: 'danger',
      }),
    )
    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(true)
  })

  it('shows loading spinner on the row being added', async () => {
    let resolveAdd
    vi.mocked(addRestaurantToFavorite).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAdd = resolve
        }),
    )
    store.user = { id: 'u1' }
    store.favoriteLists = [{ id: 'l1', name: 'Solo', restaurants: [] }]
    const wrapper = mountModal()
    await wrapper.get('[data-testid="favorite-trigger"]').trigger('click')
    await flushPromises()

    const clickPromise = wrapper.get('.list-group-item').trigger('click')
    await flushPromises()
    await nextTick()

    expect(wrapper.find('[data-testid="b-spinner"]').exists()).toBe(true)

    resolveAdd({ restaurants: [] })
    await clickPromise
    await flushPromises()

    expect(wrapper.find('[data-testid="b-spinner"]').exists()).toBe(false)
  })

  it('shows empty state when there are no favorite lists', async () => {
    store.user = { id: 'u1' }
    store.favoriteLists = []
    const wrapper = mountModal()
    await wrapper.get('[data-testid="favorite-trigger"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No favorite lists available')
  })
})
