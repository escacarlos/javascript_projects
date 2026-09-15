import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import RestaurantCard from '@/components/RestaurantCard.vue'
import { store } from '@/store/store.js'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@/components/VisitFormModal.vue', () => ({
  default: defineComponent({
    name: 'VisitFormModal',
    props: ['restaurant'],
    setup() {
      const openModal = () => {}
      return { openModal }
    },
    template:
      '<div data-testid="visit-form-modal"><slot name="before-modal" :openModal="openModal" /></div>',
  }),
}))

function makeRestaurant(overrides = {}) {
  return {
    id: 42,
    name: 'Chez Test',
    address: '123 rue Example',
    rating: 4.5,
    price_range: 2,
    genres: ['Italien'],
    pictures: ['https://example.com/photo.jpg'],
    ...overrides,
  }
}

describe('RestaurantCard.vue', () => {
  beforeEach(() => {
    mockPush.mockClear()
    store.user = undefined
    store.userRestaurantVisitsId = []
  })

  afterEach(() => {
    store.user = undefined
    store.userRestaurantVisitsId = []
  })

  it('affiche le nom, l’adresse, la note et la fourchette de prix', () => {
    const wrapper = mount(RestaurantCard, {
      props: { restaurant: makeRestaurant() },
    })

    expect(wrapper.text()).toContain('Chez Test')
    expect(wrapper.text()).toContain('123 rue Example')
    expect(wrapper.text()).toContain('4.50')
    expect(wrapper.text()).toContain('$$')
  })

  it('affiche l’image lorsque le restaurant a au moins une photo', () => {
    const wrapper = mount(RestaurantCard, {
      props: { restaurant: makeRestaurant({ pictures: ['https://img.test/a.png'] }) },
    })

    const img = wrapper.find('[data-testid="b-card-img"]')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://img.test/a.png')
  })

  it('n’affiche pas d’image lorsque la liste de photos est vide ou absente', () => {
    const sansPhotos = mount(RestaurantCard, {
      props: { restaurant: makeRestaurant({ pictures: [] }) },
    })
    expect(sansPhotos.find('[data-testid="b-card-img"]').exists()).toBe(false)

    const sansCle = mount(RestaurantCard, {
      props: { restaurant: makeRestaurant({ pictures: undefined }) },
    })
    expect(sansCle.find('[data-testid="b-card-img"]').exists()).toBe(false)
  })

  it('navigue vers la fiche restaurant au clic sur View', async () => {
    const restaurant = makeRestaurant({ id: 99 })
    const wrapper = mount(RestaurantCard, {
      props: { restaurant },
    })

    const viewBtn = wrapper.findAll('button').find((b) => b.text().includes('View'))
    expect(viewBtn).toBeDefined()
    await viewBtn.trigger('click')

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith({
      name: 'Restaurant',
      params: { id: 99 },
    })
  })

  it('n’affiche pas le formulaire de visite lorsque buttonVisitVisible est absent ou faux', () => {
    const sansProp = mount(RestaurantCard, {
      props: { restaurant: makeRestaurant() },
    })
    expect(sansProp.find('[data-testid="visit-form-modal"]').exists()).toBe(false)

    const faux = mount(RestaurantCard, {
      props: { restaurant: makeRestaurant(), buttonVisitVisible: false },
    })
    expect(faux.find('[data-testid="visit-form-modal"]').exists()).toBe(false)
  })

  it('affiche Mark as visited ou Already visited selon l’utilisateur et l’historique', async () => {
    const restaurant = makeRestaurant({ id: 7 })

    store.user = { id: 1, name: 'User' }
    store.userRestaurantVisitsId = []

    const wrapper = mount(RestaurantCard, {
      props: { restaurant, buttonVisitVisible: true },
    })

    expect(wrapper.text()).toContain('Mark as visited')

    store.userRestaurantVisitsId = [7]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Already visited')
  })
})
