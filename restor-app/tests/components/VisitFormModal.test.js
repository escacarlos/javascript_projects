import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import VisitFormModal from '@/components/VisitFormModal.vue'
import { store } from '@/store/store'
import { createVisitUnsecure } from '@/services/userService.js'
import { mockToastCreate } from '../../vitest.setup.js'

vi.mock('@/services/userService.js', () => ({
  createVisitUnsecure: vi.fn(),
}))

const restaurant = { id: 'rest-42', name: 'Trattoria Verde' }

function mountVisitForm() {
  const Wrapper = defineComponent({
    components: { VisitFormModal },
    setup() {
      return { restaurant }
    },
    template: `
      <VisitFormModal :restaurant="restaurant">
        <template #before-modal="{ openModal }">
          <button data-testid="open-visit-form" type="button" @click="openModal">Open</button>
        </template>
      </VisitFormModal>
    `,
  })
  return mount(Wrapper, { attachTo: document.body })
}

beforeEach(() => {
  vi.mocked(createVisitUnsecure).mockReset()
  mockToastCreate.mockReset()
  store.user = { id: 'user-1', email: 'u@test.com' }
})

describe('VisitFormModal', () => {
  it('affiche le nom du restaurant dans le corps de la modale une fois ouverte', async () => {
    const wrapper = mountVisitForm()
    await wrapper.get('[data-testid="open-visit-form"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain(restaurant.name)
    expect(wrapper.text()).toContain('Mark as Visited')
  })

  it('appelle createVisitUnsecure, affiche un toast succès et ferme la modale après une soumission réussie', async () => {
    vi.mocked(createVisitUnsecure).mockResolvedValue(undefined)
    const wrapper = mountVisitForm()
    await wrapper.get('[data-testid="open-visit-form"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="b-form-select"]').setValue('4')
    await flushPromises()

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save visit'))
    expect(saveBtn).toBeDefined()
    await saveBtn.trigger('click')
    await flushPromises()

    expect(createVisitUnsecure).toHaveBeenCalledTimes(1)
    expect(createVisitUnsecure).toHaveBeenCalledWith(
      'user-1',
      restaurant.id,
      4,
      '',
      expect.any(String),
    )
    expect(mockToastCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Visit saved successfully',
        variant: 'success',
      }),
    )
    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(false)
  })
})
