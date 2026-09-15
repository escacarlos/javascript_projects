import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import VisitViewModal from '@/components/VisitViewModal.vue'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

function mountVisitView(restaurantVisit) {
  const Wrapper = defineComponent({
    components: { VisitViewModal },
    setup() {
      return { restaurantVisit }
    },
    template: `
      <VisitViewModal :restaurant-visit="restaurantVisit">
        <template #before-modal="{ openModal }">
          <button data-testid="open-visit-view" type="button" @click="openModal">Open</button>
        </template>
      </VisitViewModal>
    `,
  })
  return mount(Wrapper, { attachTo: document.body })
}

beforeEach(() => {
  mockPush.mockReset()
})

describe('VisitViewModal', () => {
  it('affiche directement le détail de la visite lorsqu’il n’y en a qu’une', async () => {
    const restaurantVisit = {
      id: 'rest-1',
      name: 'Café Central',
      visits: [
        {
          id: 'v1',
          date: '2025-06-10T12:00:00.000Z',
          rating: 5,
          comment: 'Excellent service.',
        },
      ],
    }
    const wrapper = mountVisitView(restaurantVisit)
    await wrapper.get('[data-testid="open-visit-view"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Café Central')
    expect(wrapper.text()).toContain('Excellent service.')
    expect(wrapper.text()).toContain('5/5')
  })

  it('affiche la liste des visites puis le détail après sélection lorsqu’il y en a plusieurs', async () => {
    const restaurantVisit = {
      id: 'rest-2',
      name: 'Duos',
      visits: [
        { id: 'v1', date: '2025-01-05T00:00:00.000Z', rating: 3, comment: '' },
        { id: 'v2', date: '2025-03-20T00:00:00.000Z', rating: 4, comment: 'Encore mieux' },
      ],
    }
    const wrapper = mountVisitView(restaurantVisit)
    await wrapper.get('[data-testid="open-visit-view"]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.list-group-item')).toHaveLength(2)

    await wrapper.findAll('.list-group-item')[1].trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Encore mieux')
    expect(wrapper.text()).toContain('Back to List')

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Back to List'))
      .trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.list-group-item')).toHaveLength(2)
  })
})
