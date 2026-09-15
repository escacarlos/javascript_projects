import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ShowGenres from '@/components/ShowGenres.vue'

describe('ShowGenres.vue', () => {
  it('affiche aucun badge lorsque la liste de genres est vide', () => {
    const wrapper = mount(ShowGenres, {
      props: { genres: [] },
    })

    expect(wrapper.findAll('.badge').length).toBe(0)
  })

  it('affiche un badge par genre avec le libellé attendu', () => {
    const wrapper = mount(ShowGenres, {
      props: { genres: ['Italien', 'Pizza', 'Végétarien'] },
    })

    const badges = wrapper.findAll('.badge')
    expect(badges.length).toBe(3)
    expect(badges[0].text()).toBe('Italien')
    expect(badges[1].text()).toBe('Pizza')
    expect(badges[2].text()).toBe('Végétarien')
  })

  it('affiche un seul badge pour un genre unique', () => {
    const wrapper = mount(ShowGenres, {
      props: { genres: ['Sushi'] },
    })

    expect(wrapper.findAll('.badge').length).toBe(1)
    expect(wrapper.text()).toContain('Sushi')
  })
})
