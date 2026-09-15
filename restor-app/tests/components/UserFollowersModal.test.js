import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import UserFollowersModal from '@/components/UserFollowersModal.vue'

vi.mock('@/services/gravatarService.js', () => ({
  getGravatarUrl: vi.fn((email) => `https://gravatar.test/?e=${encodeURIComponent(email)}`),
}))

function mountModal(props = {}) {
  return mount(UserFollowersModal, {
    props: {
      followers: [],
      following: [],
      ...props,
    },
    attachTo: document.body,
    global: {
      stubs: {
        RouterLink: {
          name: 'RouterLink',
          props: ['to'],
          template: '<a :href="to" class="router-link-stub"><slot /></a>',
        },
      },
    },
  })
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('UserFollowersModal', () => {
  it('affiche le nombre et le libellé Followers lorsque tab vaut followers', () => {
    const wrapper = mountModal({
      tab: 'followers',
      followers: [{ id: '1', name: 'A', email: 'a@test.com' }],
      following: [{ id: '2', name: 'B', email: 'b@test.com' }],
    })
    expect(wrapper.get('h3').text()).toBe('1')
    expect(wrapper.text()).toContain('Followers')
    expect(wrapper.text()).not.toContain('Following')
  })

  it('affiche le nombre et le libellé Following lorsque tab vaut following', () => {
    const wrapper = mountModal({
      tab: 'following',
      followers: [{ id: '1', name: 'A', email: 'a@test.com' }],
      following: [
        { id: '2', name: 'B', email: 'b@test.com' },
        { id: '3', name: 'C', email: 'c@test.com' },
      ],
    })
    expect(wrapper.get('h3').text()).toBe('2')
    expect(wrapper.text()).toContain('Following')
  })

  it('ouvre le modal lorsque la tuile de statistique est cliquée', async () => {
    const wrapper = mountModal({ tab: 'followers' })
    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(false)

    await wrapper.get('.social-stat-tile').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="b-modal"]').exists()).toBe(true)
    expect(wrapper.get('.modal-title').text()).toBe('Followers & Following')
  })

  it('affiche les noms des followers et le lien View profile dans le modal', async () => {
    const wrapper = mountModal({
      tab: 'followers',
      followers: [{ id: 'u1', name: 'Marie Dupont', email: 'marie@test.com' }],
    })

    await wrapper.get('.social-stat-tile').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Marie Dupont')
    expect(wrapper.text()).toContain('View profile')
    expect(wrapper.find('.router-link-stub').attributes('href')).toBe('/user/u1')
  })

  it('affiche le message vide lorsqu’il n’y a aucun follower', async () => {
    const wrapper = mountModal({
      tab: 'followers',
      followers: [],
    })

    await wrapper.get('.social-stat-tile').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No followers yet.')
  })
})
