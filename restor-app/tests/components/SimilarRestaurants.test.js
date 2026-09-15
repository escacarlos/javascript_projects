import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SimilarRestaurants from '@/components/SimilarRestaurants.vue'
import { getSimilarRestaurants } from '@/services/restaurantsService.js'

vi.mock('bootstrap-vue-next', () => {
  const stub = (name) => ({
    name,
    template: `<div class="${name.toLowerCase()}"><slot /></div>`,
  })

  return {
    BCard: stub('BCard'),
    BCardHeader: stub('BCardHeader'),
    BCardBody: stub('BCardBody'),
    BSpinner: stub('BSpinner'),
    BAlert: stub('BAlert'),
    BButton: stub('BButton'),
    BBadge: stub('BBadge'),
    BRow: stub('BRow'),
    BCol: stub('BCol'),
    BContainer: stub('BContainer'),
    BNavbar: stub('BNavbar'),
    BNavbarBrand: stub('BNavbarBrand'),
    BNavbarNav: stub('BNavbarNav'),
    BNavbarToggle: stub('BNavbarToggle'),
    BCollapse: stub('BCollapse'),
    BNavItem: stub('BNavItem'),
    BNavText: stub('BNavText'),
  }
})

vi.mock('@/components/RestaurantCard.vue', () => ({
  default: {
    name: 'RestaurantCard',
    template: '<div class="restaurant-card-mock"></div>',
  },
}))

vi.mock('@/services/restaurantsService.js')

describe('SimilarRestaurants.vue', () => {
  const currentRestaurant = { id: 1, name: 'Test Restaurant' }

  function mountComponent() {
    return mount(SimilarRestaurants, {
      props: { currentRestaurant },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', async () => {
    getSimilarRestaurants.mockResolvedValue([])

    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Loading similar restaurants...')
  })

  it('shows an error message when the service fails', async () => {
    getSimilarRestaurants.mockRejectedValue(new Error('fail'))

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('Error loading similar restaurants')
  })

  it('shows a message when no similar restaurants are found', async () => {
    getSimilarRestaurants.mockResolvedValue([])

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('No similar restaurants found')
  })

  it('renders a list of restaurants when results exist', async () => {
    getSimilarRestaurants.mockResolvedValue([
      { id: 10, name: 'A' },
      { id: 11, name: 'B' },
    ])

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.findAll('.scroll-card').length).toBe(2)
  })

  it('scrollLeft button calls scrollBy with negative value', async () => {
    getSimilarRestaurants.mockResolvedValue([{ id: 10 }])

    const wrapper = mountComponent()
    await flushPromises()

    const scrollEl = wrapper.find('.similar-scroll').element
    Object.defineProperty(scrollEl, 'scrollWidth', { value: 2000, configurable: true })
    Object.defineProperty(scrollEl, 'clientWidth', { value: 400, configurable: true })
    Object.defineProperty(scrollEl, 'scrollLeft', { value: 100, configurable: true })
    const scrollBySpy = vi.fn()
    scrollEl.scrollBy = scrollBySpy

    await wrapper.find('.similar-scroll').trigger('scroll')
    await wrapper.vm.$nextTick()

    await wrapper.find('.scroll-btn.left').trigger('click')

    expect(scrollBySpy).toHaveBeenCalledWith({
      left: -360,
      behavior: 'smooth',
    })
  })

  it('scrollRight button calls scrollBy with positive value', async () => {
    getSimilarRestaurants.mockResolvedValue([{ id: 10 }])

    const wrapper = mountComponent()
    await flushPromises()

    const scrollEl = wrapper.find('.similar-scroll').element
    Object.defineProperty(scrollEl, 'scrollWidth', { value: 2000, configurable: true })
    Object.defineProperty(scrollEl, 'clientWidth', { value: 400, configurable: true })
    Object.defineProperty(scrollEl, 'scrollLeft', { value: 0, configurable: true })
    const scrollBySpy = vi.fn()
    scrollEl.scrollBy = scrollBySpy

    await wrapper.find('.similar-scroll').trigger('scroll')
    await wrapper.vm.$nextTick()

    await wrapper.find('.scroll-btn.right').trigger('click')

    expect(scrollBySpy).toHaveBeenCalledWith({
      left: 360,
      behavior: 'smooth',
    })
  })

  it('reloads similar restaurants when the currentRestaurant id changes', async () => {
    getSimilarRestaurants.mockResolvedValue([{ id: 10 }])

    const wrapper = mountComponent()
    await flushPromises()

    expect(getSimilarRestaurants).toHaveBeenCalledTimes(1)

    await wrapper.setProps({ currentRestaurant: { id: 2 } })
    await flushPromises()

    expect(getSimilarRestaurants).toHaveBeenCalledTimes(2)
  })
})
