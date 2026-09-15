<script setup>
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import L from 'leaflet'
import 'leaflet-routing-machine'
import { useRouter } from 'vue-router'

const props = defineProps({
  restaurants: {
    type: Array,
    default: () => [],
  },
  selectedRestaurant: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['mapCenterChange'])

const isListMode = computed(() => !props.selectedRestaurant)

let suppressMapCenterEmit = false

function emitMapCenterFromMap() {
  if (!map || !isListMode.value || suppressMapCenterEmit) return
  const c = map.getCenter()
  emit('mapCenterChange', { lat: c.lat, lng: c.lng })
}

function onListMapMoveEnd() {
  emitMapCenterFromMap()
}

const restaurantMarkerIcon = L.icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
})

const defaultWaypointIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
})

function createRoutingMarkerFactory(routeWhileDragging) {
  return function createRoutingMarker(i, waypoint, n) {
    const latLng = waypoint.latLng ?? waypoint
    const isDestination = i === n - 1
    return L.marker(latLng, {
      icon: isDestination ? restaurantMarkerIcon : defaultWaypointIcon,
      draggable: i === 0 && routeWhileDragging,
    })
  }
}

function clearRestaurantMarkerForRoute() {
  if (restaurantMarker && map?.hasLayer(restaurantMarker)) {
    map.removeLayer(restaurantMarker)
    restaurantMarker = null
  }
}

const router = useRouter()
const mapContainer = ref(null)
let map = null

let markers = []
let userLocationMarker = null

let clickMarker = null
let restaurantMarker = null
let routingControl = null

function updateListMarkers(options = {}) {
  const emitCenterWhenDone = options.emitCenterWhenDone === true
  const fitToMarkers = options.fitToMarkers === true

  if (!map) return
  markers.forEach((marker) => map.removeLayer(marker))
  markers = []

  if (props.restaurants.length === 0) return

  props.restaurants.forEach((restaurant) => {
    const marker = L.marker(
      [restaurant.location.coordinates[1], restaurant.location.coordinates[0]],
      { icon: restaurantMarkerIcon },
    ).addTo(map).bindPopup(`
        <div>
          <h5>${restaurant.name}</h5>
          <p>${restaurant.address}</p>
          <button class="btn btn-primary btn-sm" onclick="window.viewRestaurant('${restaurant.id}')">View</button>
        </div>
      `)
    markers.push(marker)
  })

  if (fitToMarkers) {
    suppressMapCenterEmit = true
    const group = new L.featureGroup(markers)
    map.fitBounds(group.getBounds().pad(0.1), { animate: false })
    map.once('moveend', () => {
      suppressMapCenterEmit = false
      if (emitCenterWhenDone) {
        const c = map.getCenter()
        emit('mapCenterChange', { lat: c.lat, lng: c.lng })
      }
    })
  } else if (emitCenterWhenDone) {
    const c = map.getCenter()
    emit('mapCenterChange', { lat: c.lat, lng: c.lng })
  }
}

function initListMap() {
  if (!mapContainer.value || props.restaurants.length === 0) return

  const centerLat = props.restaurants[0].location.coordinates[1]
  const centerLng = props.restaurants[0].location.coordinates[0]

  suppressMapCenterEmit = true
  map = L.map(mapContainer.value)
  map.on('moveend', onListMapMoveEnd)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map)

  map.setView([centerLat, centerLng], 13)

  updateListMarkers({ emitCenterWhenDone: true, fitToMarkers: true })
}

function initDetailMap() {
  if (!mapContainer.value || !props.selectedRestaurant) return
  const r = props.selectedRestaurant

  map = L.map(mapContainer.value).setView(
    [r.location.coordinates[1], r.location.coordinates[0]],
    13,
  )

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map)

  restaurantMarker = L.marker([r.location.coordinates[1], r.location.coordinates[0]], {
    icon: restaurantMarkerIcon,
  })
    .addTo(map)
    .bindPopup(r.name)
    .openPopup()

  map.on('click', onMapClick)
}

onMounted(() => {
  if (isListMode.value) {
    window.viewRestaurant = (id) => {
      router.push({ name: 'Restaurant', params: { id } })
    }
    initListMap()
  } else {
    initDetailMap()
  }
})

onUnmounted(() => {
  if (map && isListMode.value) {
    map.off('moveend', onListMapMoveEnd)
  }
  if (isListMode.value && window.viewRestaurant) {
    delete window.viewRestaurant
  }
})

watch(
  () => props.restaurants,
  () => {
    if (!isListMode.value) return
    if (props.restaurants.length === 0) {
      if (map) {
        markers.forEach((m) => map.removeLayer(m))
        markers = []
      }
      return
    }
    if (!map) {
      initListMap()
    } else {
      updateListMarkers()
    }
  },
  { deep: true },
)

watch(
  () => props.selectedRestaurant,
  (newRestaurant) => {
    if (isListMode.value || !map || !newRestaurant) return

    map.setView([newRestaurant.location.coordinates[1], newRestaurant.location.coordinates[0]], 13)

    if (restaurantMarker) {
      map.removeLayer(restaurantMarker)
    }

    if (routingControl) {
      map.removeControl(routingControl)
      routingControl = null
    }
    if (clickMarker) {
      map.removeLayer(clickMarker)
      clickMarker = null
    }

    restaurantMarker = L.marker(
      [newRestaurant.location.coordinates[1], newRestaurant.location.coordinates[0]],
      { icon: restaurantMarkerIcon },
    )
      .addTo(map)
      .bindPopup(newRestaurant.name)
      .openPopup()

    setTimeout(() => {
      map.invalidateSize()
    }, 200)
  },
)

function onMapClick(e) {
  if (isListMode.value || !props.selectedRestaurant) return

  const clickedLat = e.latlng.lat
  const clickedLng = e.latlng.lng

  if (clickMarker) {
    map.removeLayer(clickMarker)
  }

  if (routingControl) {
    map.removeControl(routingControl)
  }

  clickMarker = L.marker([clickedLat, clickedLng], {
    icon: defaultWaypointIcon,
  })
    .addTo(map)
    .bindPopup('Starting point')
    .openPopup()

  clearRestaurantMarkerForRoute()

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(clickedLat, clickedLng),
      L.latLng(
        props.selectedRestaurant.location.coordinates[1],
        props.selectedRestaurant.location.coordinates[0],
      ),
    ],
    routeWhileDragging: false,
    addWaypoints: false,
    createMarker: createRoutingMarkerFactory(false),
  }).addTo(map)
}

function getDirections() {
  if (isListMode.value || !props.selectedRestaurant || !map) return

  navigator.geolocation.getCurrentPosition((position) => {
    const userLat = position.coords.latitude
    const userLng = position.coords.longitude

    if (clickMarker) {
      map.removeLayer(clickMarker)
    }

    if (routingControl) {
      map.removeControl(routingControl)
    }

    clearRestaurantMarkerForRoute()

    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLat, userLng),
        L.latLng(
          props.selectedRestaurant.location.coordinates[1],
          props.selectedRestaurant.location.coordinates[0],
        ),
      ],
      routeWhileDragging: true,
      createMarker: createRoutingMarkerFactory(true),
    }).addTo(map)
  })
}

function centerOnUserLocation() {
  if (!isListMode.value || !map) return

  if (!navigator.geolocation) {
    window.alert('Geolocation is not available in this browser.')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude
      const userLng = position.coords.longitude
      map.setView([userLat, userLng], 13)

      if (userLocationMarker) {
        map.removeLayer(userLocationMarker)
      }
      userLocationMarker = L.marker([userLat, userLng], {
        icon: defaultWaypointIcon,
      })
        .addTo(map)
        .bindPopup('Your location')
        .openPopup()
    },
    () => {
      window.alert('Unable to obtain your location. Please check permissions and refresh.')
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    },
  )
}

defineExpose({
  centerOnUserLocation,
  getDirections,
})
</script>

<template>
  <div>
    <div ref="mapContainer" :style="{ height: isListMode ? '600px' : '400px' }"></div>
    <div v-if="isListMode" class="mt-3 text-center">
      <button class="btn btn-secondary" type="button" @click="centerOnUserLocation">
        <i class="bi bi-geo-alt me-2"></i>Center on My Location
      </button>
    </div>
  </div>
</template>
