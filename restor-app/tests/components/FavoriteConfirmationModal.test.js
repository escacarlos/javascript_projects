import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import FavoriteConfirmationModal from '@/components/FavoriteConfirmationModal.vue'
import { removeRestaurantFromFavorite, deleteFavoriteList } from '@/services/favoritesService.js'
import { mockToastCreate } from '../../vitest.setup.js'

vi.mock('@/services/favoritesService.js', () => ({
  removeRestaurantFromFavorite: vi.fn(),
  deleteFavoriteList: vi.fn(),
}))

function mountConfirmation(props) {
  return mount(FavoriteConfirmationModal, {
    props,
    attachTo: document.body,
  })
}

beforeEach(() => {
  vi.mocked(removeRestaurantFromFavorite).mockReset()
  vi.mocked(deleteFavoriteList).mockReset()
  mockToastCreate.mockReset()
})

describe('FavoriteConfirmationModal', () => {
  it('renders the trash trigger to open the modal', () => {
    const wrapper = mountConfirmation({
      listToDelete: { id: 'l1', name: 'My list' },
    })
    expect(wrapper.find('[data-testid="favorite-confirm-open"]').exists()).toBe(true)
  })

  it('opens the modal when the trash button is clicked', async () => {
    const wrapper = mountConfirmation({
      listToDelete: { id: 'l1', name: 'My list' },
    })
    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(false)

    await wrapper.get('[data-testid="favorite-confirm-open"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(true)
  })

  it('uses "Delete List" title and list copy when deleting a list only', async () => {
    const wrapper = mountConfirmation({
      listToDelete: { id: 'l1', name: 'Brunch spots' },
    })
    await wrapper.get('[data-testid="favorite-confirm-open"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Delete List')
    expect(wrapper.text()).toContain('Brunch spots')
    expect(wrapper.text()).toContain('delete')
  })

  it('uses "Delete Restaurant" title when removing a restaurant from a list', async () => {
    const wrapper = mountConfirmation({
      listToDelete: { id: 'l1', name: 'Any' },
      restaurantToDelete: { id: 'r1', name: 'Taco Bell' },
    })
    await wrapper.get('[data-testid="favorite-confirm-open"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Delete Restaurant')
    expect(wrapper.text()).toContain('Taco Bell')
    expect(wrapper.text()).toContain('remove')
  })

  it('closes the modal when Cancel is clicked', async () => {
    const wrapper = mountConfirmation({
      listToDelete: { id: 'l1', name: 'My list' },
    })
    await wrapper.get('[data-testid="favorite-confirm-open"]').trigger('click')
    await flushPromises()

    const cancel = wrapper.findAll('button').find((b) => b.text().includes('Cancel'))
    expect(cancel).toBeDefined()
    await cancel.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(false)
  })

  it('calls removeRestaurantFromFavorite and closes on success when both list and restaurant are set', async () => {
    vi.mocked(removeRestaurantFromFavorite).mockResolvedValue(undefined)
    const list = { id: 'l1', name: 'Favs' }
    const restaurant = { id: 'r9', name: 'Sushi Bar' }
    const wrapper = mountConfirmation({
      listToDelete: list,
      restaurantToDelete: restaurant,
    })

    await wrapper.get('[data-testid="favorite-confirm-open"]').trigger('click')
    await flushPromises()

    const deleteBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Delete')
    await deleteBtn.trigger('click')
    await flushPromises()

    expect(removeRestaurantFromFavorite).toHaveBeenCalledWith('l1', 'r9')
    expect(deleteFavoriteList).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(false)
  })

  it('shows danger toast on error when removing a restaurant', async () => {
    vi.mocked(removeRestaurantFromFavorite).mockRejectedValue(new Error('fail'))
    const wrapper = mountConfirmation({
      listToDelete: { id: 'l1', name: 'Favs' },
      restaurantToDelete: { id: 'r9', name: 'Sushi Bar' },
    })

    await wrapper.get('[data-testid="favorite-confirm-open"]').trigger('click')
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Delete')
      .trigger('click')
    await flushPromises()

    expect(mockToastCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error removing restaurant',
        variant: 'danger',
      }),
    )
    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(true)
  })

  it('calls deleteFavoriteList when only a list is deleted', async () => {
    vi.mocked(deleteFavoriteList).mockResolvedValue(undefined)
    const wrapper = mountConfirmation({
      listToDelete: { id: 'l2', name: 'Old list' },
    })

    await wrapper.get('[data-testid="favorite-confirm-open"]').trigger('click')
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Delete')
      .trigger('click')
    await flushPromises()

    expect(deleteFavoriteList).toHaveBeenCalledWith('l2')
    expect(removeRestaurantFromFavorite).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(false)
  })

  it('shows danger toast on error when deleting a list', async () => {
    vi.mocked(deleteFavoriteList).mockRejectedValue(new Error('fail'))
    const wrapper = mountConfirmation({
      listToDelete: { id: 'l2', name: 'Old list' },
    })

    await wrapper.get('[data-testid="favorite-confirm-open"]').trigger('click')
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Delete')
      .trigger('click')
    await flushPromises()

    expect(mockToastCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error deleting list',
        variant: 'danger',
      }),
    )
  })

  it('shows generic error toast when Delete is confirmed without list or restaurant props', async () => {
    const wrapper = mountConfirmation({})

    await wrapper.get('[data-testid="favorite-confirm-open"]').trigger('click')
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Delete')
      .trigger('click')
    await flushPromises()

    expect(mockToastCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error deleting item',
        variant: 'danger',
      }),
    )
    expect(removeRestaurantFromFavorite).not.toHaveBeenCalled()
    expect(deleteFavoriteList).not.toHaveBeenCalled()
  })

  it('sets loading state on the Delete button while delete is in progress', async () => {
    let resolveRemove
    vi.mocked(removeRestaurantFromFavorite).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRemove = resolve
        }),
    )
    const wrapper = mountConfirmation({
      listToDelete: { id: 'l1', name: 'Favs' },
      restaurantToDelete: { id: 'r1', name: 'Place' },
    })

    await wrapper.get('[data-testid="favorite-confirm-open"]').trigger('click')
    await flushPromises()

    const deleteBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Delete')
    const clickPromise = deleteBtn.trigger('click')
    await flushPromises()
    await nextTick()

    expect(deleteBtn.attributes('data-loading')).toBe('true')

    resolveRemove()
    await clickPromise
    await flushPromises()
    await nextTick()

    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(false)
  })
})
