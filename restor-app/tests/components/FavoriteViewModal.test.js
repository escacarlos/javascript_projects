import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import FavoriteViewModal from '@/components/FavoriteViewModal.vue'
import { store } from '@/store/store'
import {
  addRestaurantToFavorite,
  createFavoriteList,
  updateFavoriteList,
} from '@/services/favoritesService.js'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@/services/favoritesService.js', () => ({
  addRestaurantToFavorite: vi.fn(),
  createFavoriteList: vi.fn(),
  updateFavoriteList: vi.fn(),
}))

vi.mock('@/components/SearchInput.vue', () => ({
  default: defineComponent({
    name: 'SearchRestaurantInputStub',
    template: '<div data-testid="search-restaurant-stub"></div>',
  }),
}))

vi.mock('@/components/FavoriteConfirmationModal.vue', () => ({
  default: defineComponent({
    name: 'FavoriteConfirmationModalStub',
    template: '<span data-testid="favorite-confirm-stub"></span>',
  }),
}))

function mountFavoriteModal() {
  return mount(FavoriteViewModal, {
    attachTo: document.body,
  })
}

beforeEach(() => {
  mockPush.mockReset()
  vi.mocked(addRestaurantToFavorite).mockReset()
  vi.mocked(createFavoriteList).mockReset()
  vi.mocked(updateFavoriteList).mockReset()
  store.user = { id: 'u1', email: 'alex@example.com' }
  store.favoriteLists = []
})

describe('FavoriteViewModal', () => {
  it('ouvre la modale au clic sur « My Favorites » et affiche le titre', async () => {
    const wrapper = mountFavoriteModal()
    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(false)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(true)
    expect(wrapper.get('.modal-title').text()).toContain('My Favorite Lists')
  })

  it('affiche le message lorsqu’il n’y a aucune liste favorite', async () => {
    const wrapper = mountFavoriteModal()
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No favorite lists yet')
  })
})
