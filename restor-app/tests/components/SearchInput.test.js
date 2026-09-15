import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SearchInput from '@/components/SearchInput.vue'
import { searchRestaurants } from '@/services/restaurantsService.js'
import { searchUsers } from '@/services/userService.js'
import { mockToastCreate } from '../../vitest.setup.js'

vi.mock('@/services/restaurantsService.js', () => ({
  searchRestaurants: vi.fn(),
}))

vi.mock('@/services/userService.js', () => ({
  searchUsers: vi.fn(),
}))

function mountSearchInput(props = {}) {
  return mount(SearchInput, {
    props,
    attachTo: document.body,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SearchInput', () => {
  it('renders input and placeholder correctly', () => {
    const wrapper = mountSearchInput({
      enableUserSearch: true,
      enableRestaurantSearch: true,
    })

    const input = wrapper.get('input')
    expect(input.attributes('placeholder')).toBe('Search restaurant or user...')
  })

  it('does not search when query has less than 2 characters', async () => {
    const wrapper = mountSearchInput()
    const input = wrapper.get('input')

    await input.setValue('a')
    await flushPromises()

    expect(searchRestaurants).not.toHaveBeenCalled()
    expect(searchUsers).not.toHaveBeenCalled()
  })

  it('searches restaurants when enabled', async () => {
    searchRestaurants.mockResolvedValue({
      items: [{ id: 'r1', name: 'Pizza', address: '123' }],
    })

    const wrapper = mountSearchInput({ enableRestaurantSearch: true })

    await wrapper.get('input').setValue('pi')
    await flushPromises()

    expect(searchRestaurants).toHaveBeenCalledWith('pi')
    expect(wrapper.text()).toContain('Pizza')
  })

  it('filters out restaurants in restaurantsToExclude', async () => {
    searchRestaurants.mockResolvedValue({
      items: [
        { id: 'r1', name: 'Pizza', address: '123' },
        { id: 'r2', name: 'Burger', address: '456' },
      ],
    })

    const wrapper = mountSearchInput({
      restaurantsToExclude: [{ id: 'r1' }],
    })

    await wrapper.get('input').setValue('pi')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Pizza')
    expect(wrapper.text()).toContain('Burger')
  })

  it('searches users when enabled', async () => {
    searchUsers.mockResolvedValue({
      items: [{ id: 'u1', name: 'Alex', email: 'alex@test.com' }],
    })

    const wrapper = mountSearchInput({ enableUserSearch: true })

    await wrapper.get('input').setValue('al')
    await flushPromises()

    expect(searchUsers).toHaveBeenCalledWith('al')
    expect(wrapper.text()).toContain('Alex')
  })

  it('emits selectFromSearchRestaurant when clicking a restaurant', async () => {
    searchRestaurants.mockResolvedValue({
      items: [{ id: 'r1', name: 'Pizza', address: '123' }],
    })

    const wrapper = mountSearchInput()

    await wrapper.get('input').setValue('pi')
    await flushPromises()

    const restaurantRow = wrapper
      .findAll('.list-group-item')
      .find((li) => li.text().includes('Pizza'))

    await restaurantRow.trigger('click')

    const events = wrapper.emitted().selectFromSearchRestaurant
    expect(events[events.length - 1][0]).toEqual({
      id: 'r1',
      name: 'Pizza',
      address: '123',
    })
  })

  it('emits selectFromSearchUser when clicking a user', async () => {
    searchUsers.mockResolvedValue({
      items: [{ id: 'u1', name: 'Alex', email: 'alex@test.com' }],
    })

    const wrapper = mountSearchInput({
      enableUserSearch: true,
      enableRestaurantSearch: false,
    })

    await wrapper.get('input').setValue('al')
    await flushPromises()

    const userRow = wrapper.findAll('.list-group-item').find((li) => li.text().includes('Alex'))

    await userRow.trigger('click')

    const events = wrapper.emitted().selectFromSearchUser
    expect(events[events.length - 1][0]).toEqual({
      id: 'u1',
      name: 'Alex',
      email: 'alex@test.com',
    })
  })

  it('shows toast on restaurant search error', async () => {
    searchRestaurants.mockRejectedValue(new Error('network'))

    const wrapper = mountSearchInput()

    await wrapper.get('input').setValue('pi')
    await flushPromises()

    expect(mockToastCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error searching restaurants',
        variant: 'danger',
      }),
    )
  })

  it('shows dropdown when results exist and hides when cleared', async () => {
    searchRestaurants.mockResolvedValue({
      items: [{ id: 'r1', name: 'Pizza', address: '123' }],
    })

    const wrapper = mountSearchInput()

    await wrapper.get('input').setValue('pi')
    await flushPromises()

    expect(wrapper.find('ul').exists()).toBe(true)

    await wrapper.get('input').setValue('')
    await flushPromises()

    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('clears results on focusout and restores on focusin', async () => {
    searchRestaurants.mockResolvedValue({
      items: [{ id: 'r1', name: 'Pizza', address: '123' }],
    })

    const wrapper = mountSearchInput()

    await wrapper.get('input').setValue('pi')
    await flushPromises()

    expect(wrapper.text()).toContain('Pizza')

    await wrapper.trigger('focusout')
    await new Promise((r) => setTimeout(r, 200))

    expect(wrapper.text()).not.toContain('Pizza')

    await wrapper.trigger('focusin')
    expect(wrapper.text()).toContain('Pizza')
  })
})
