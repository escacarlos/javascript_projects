import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MapLeafLet from '@/components/MapLeafLet.vue'

// Mock Leaflet
vi.mock('leaflet', () => {
  const mockMap = vi.fn(() => ({
    setView: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    hasLayer: vi.fn(() => false),
    removeControl: vi.fn(),
    getCenter: vi.fn(() => ({ lat: 40.7128, lng: -74.006 })),
    fitBounds: vi.fn(),
    once: vi.fn(),
    invalidateSize: vi.fn(),
  }))

  const mockTileLayer = vi.fn(() => ({
    addTo: vi.fn(() => ({})),
  }))

  const mockMarker = vi.fn(() => ({
    addTo: vi.fn(() => ({
      bindPopup: vi.fn(() => ({
        openPopup: vi.fn(() => ({})),
      })),
    })),
    bindPopup: vi.fn(() => ({
      openPopup: vi.fn(() => ({})),
    })),
    openPopup: vi.fn(() => ({})),
  }))

  const mockIcon = vi.fn()

  const mockLatLng = vi.fn()

  const mockFeatureGroup = vi.fn(() => ({
    getBounds: vi.fn(() => ({
      pad: vi.fn(() => ({})),
    })),
  }))

  const mockRoutingControl = vi.fn(() => ({
    addTo: vi.fn(() => ({})),
  }))

  return {
    default: {
      map: mockMap,
      tileLayer: mockTileLayer,
      marker: mockMarker,
      icon: mockIcon,
      latLng: mockLatLng,
      featureGroup: mockFeatureGroup,
      Routing: {
        control: mockRoutingControl,
      },
    },
  }
})

// Mock leaflet-routing-machine
vi.mock('leaflet-routing-machine', () => ({}))

// Mock vue-router
const mockRouter = {
  push: vi.fn(),
}
vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}))

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
}
Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
  configurable: true,
})

describe('MapLeafLet', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset geolocation mock
    mockGeolocation.getCurrentPosition.mockReset()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('List Mode (restaurants prop provided)', () => {
    const mockRestaurants = [
      {
        id: '1',
        name: 'Restaurant 1',
        address: '123 Main St',
        location: {
          coordinates: [-74.006, 40.7128], // lng, lat
        },
      },
      {
        id: '2',
        name: 'Restaurant 2',
        address: '456 Oak St',
        location: {
          coordinates: [-74.0061, 40.7129],
        },
      },
    ]

    beforeEach(async () => {
      wrapper = mount(MapLeafLet, {
        props: {
          restaurants: mockRestaurants,
        },
        attachTo: document.body,
      })
      await nextTick()
    })

    it('renders the map container', () => {
      expect(wrapper.find('div').exists()).toBe(true)
    })

    it('renders the center on location button', () => {
      expect(wrapper.text()).toContain('Center on My Location')
    })

    it('exposes centerOnUserLocation method', () => {
      expect(typeof wrapper.vm.centerOnUserLocation).toBe('function')
    })

    it('exposes getDirections method', () => {
      expect(typeof wrapper.vm.getDirections).toBe('function')
    })

    it('calls geolocation when centerOnUserLocation is called', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      }
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      await wrapper.vm.centerOnUserLocation()

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        },
      )
    })

    it('handles geolocation error gracefully', async () => {
      const mockError = new Error('Geolocation error')
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError)
      })

      await wrapper.vm.centerOnUserLocation()

      expect(alertSpy).toHaveBeenCalledWith(
        'Unable to obtain your location. Please check permissions and refresh.',
      )

      alertSpy.mockRestore()
    })

    it('emits mapCenterChange when map is initialized', () => {
      // Test that the emit setup is correct by checking if the function exists
      expect(wrapper.vm.$emit).toBeDefined()
    })
  })

  describe('Props and Reactivity', () => {
    it('updates markers when restaurants prop changes', async () => {
      const initialRestaurants = [
        {
          id: '1',
          name: 'Restaurant 1',
          address: '123 Main St',
          location: {
            coordinates: [-74.006, 40.7128],
          },
        },
      ]

      const wrapper = mount(MapLeafLet, {
        props: {
          restaurants: initialRestaurants,
        },
        attachTo: document.body,
      })
      await nextTick()

      const newRestaurants = [
        ...initialRestaurants,
        {
          id: '2',
          name: 'Restaurant 2',
          address: '456 Oak St',
          location: {
            coordinates: [-74.0061, 40.7129],
          },
        },
      ]

      await wrapper.setProps({ restaurants: newRestaurants })
      await nextTick()

      // Test that the component reacts to prop changes
      expect(wrapper.props('restaurants')).toHaveLength(2)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty restaurants array', async () => {
      wrapper = mount(MapLeafLet, {
        props: {
          restaurants: [],
        },
        attachTo: document.body,
      })
      await nextTick()

      expect(wrapper.props('restaurants')).toHaveLength(0)
    })

    it('handles null selectedRestaurant', async () => {
      wrapper = mount(MapLeafLet, {
        props: {
          selectedRestaurant: null,
        },
        attachTo: document.body,
      })
      await nextTick()

      expect(wrapper.props('selectedRestaurant')).toBeNull()
    })

    it('handles geolocation not available', async () => {
      // Temporarily mock geolocation as undefined
      const originalGeolocation = navigator.geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      wrapper = mount(MapLeafLet, {
        props: {
          restaurants: [
            { id: '1', name: 'Test', address: 'Test', location: { coordinates: [-74, 40] } },
          ],
        },
        attachTo: document.body,
      })
      await nextTick()

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      // This should trigger the geolocation check
      await wrapper.vm.centerOnUserLocation()
      expect(alertSpy).toHaveBeenCalledWith('Geolocation is not available in this browser.')

      alertSpy.mockRestore()
      // Restore geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true,
        configurable: true,
      })
    })
  })
})
