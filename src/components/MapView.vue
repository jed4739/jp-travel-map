<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>

    <div class="map-controls-left">
      <button @click="changeMapType('terrain')" :class="{ active: currentLayer === 'terrain' }">일반</button>
      <button @click="changeMapType('satellite')" :class="{ active: currentLayer === 'satellite' }">위성</button>
    </div>

    <button class="my-location-btn" @click="moveToMyLocation">
      <img :src="icMyLocation" alt="내 위치">
    </button>

    <div ref="popupContainer" class="popup-overlay">
      <div v-if="selectedItem" class="popup-content">
        <strong class="popup-title">{{ selectedItem.content }}</strong>
        <p class="popup-desc">{{ selectedItem.timeRange }}</p>
        <button class="popup-close" @click.stop="closePopup">✖</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import 'ol/ol.css';
import icMyLocation from '../assets/ic_my_location.svg';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';
import type { ScheduleItem } from '../composables/useSchedule';
import XYZ from 'ol/source/XYZ';

const props = defineProps<{
  scheduleItems: ScheduleItem[];
}>();

const myLocationStyle = new Style({
  image: new Circle({
    radius: 8,
    fill: new Fill({ color: '#4285F4' }),
    stroke: new Stroke({ color: '#FFFFFF', width: 3 }),
  })
});

const emit = defineEmits(['marker-click']);

const mapContainer = ref<HTMLElement | null>(null);
const popupContainer = ref<HTMLElement | null>(null);
const map = ref<Map | null>(null);
const overlay = ref<Overlay | null>(null);
const selectedItem = ref<ScheduleItem | null>(null);
const currentLayer = ref<'terrain' | 'satellite'>('terrain');
const vectorSource = new VectorSource();
const currentMyPosition = ref<number[] | null>(null);

const baseLayer = new TileLayer({
  source: new XYZ({
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
  })
});

let watchId: number | null = null;
const myLocationSource = new VectorSource();
const myLocationLayer = new VectorLayer({
  source: myLocationSource,
  zIndex: 999
});

const getMarkerStyle = (category: string) => {
  let color = '#2962FF';
  const cat = category?.toUpperCase() || '';
  if (cat.includes('HOME')) color = '#6200EA';
  else if (cat.includes('FOOD')) color = '#00BFA5';
  else if (cat.includes('SHOP')) color = '#C51162';
  else if (cat.includes('AIRPORT')) color = '#37474F';

  return new Style({
    image: new Circle({
      radius: 8,
      fill: new Fill({ color: color }),
      stroke: new Stroke({ color: '#FFFFFF', width: 3 }),
    })
  });
};

const vectorLayer = new VectorLayer({
  source: vectorSource,
});

onMounted(() => {
  if (!mapContainer.value || !popupContainer.value) return;

  const overlayInstance = new Overlay({
    element: popupContainer.value,
    positioning: 'top-left',
    offset: [0, 0],
    stopEvent: true,
  });

  overlay.value = overlayInstance;

  map.value = new Map({
    target: mapContainer.value,
    layers: [
      baseLayer,
      vectorLayer,
      myLocationLayer
    ],
    view: new View({
      center: fromLonLat([139.75982642460093, 35.64244258194261]),
      zoom: 12,
    }),
    overlays: [overlayInstance],
    controls: []
  });

  map.value.on('click', (e) => {
    const feature = map.value?.forEachFeatureAtPixel(e.pixel, (f) => f);

    if (feature) {
      const item = feature.get('data') as ScheduleItem;
      if (!item) return;

      selectedItem.value = item;
      const geometry = feature.getGeometry();
      if (geometry instanceof Point) {
        const coordinates = geometry.getCoordinates();
        overlay.value?.setPosition(coordinates);
        flyToLocation(item.lat, item.lng);
        emit('marker-click', item);
      }
    }
  });
  startTracking();
});

watch(() => props.scheduleItems, (newItems) => {
  if (!newItems) return;
  vectorSource.clear();
  newItems.forEach((item) => {
    if (isNaN(item.lat) || isNaN(item.lng)) return;
    const feature = new Feature({
      geometry: new Point(fromLonLat([item.lng, item.lat])),
      data: item
    });
    feature.setStyle(getMarkerStyle(item.category));
    vectorSource.addFeature(feature);
  });
});

const changeMapType = (type: 'terrain' | 'satellite') => {
  currentLayer.value = type;
  const newUrl = type === 'satellite'
      ? 'https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}'
      : 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
  baseLayer.setSource(new XYZ({ url: newUrl }));
};

const startTracking = () => {
  if (!navigator.geolocation) return;
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);

  watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const center = fromLonLat([longitude, latitude]);

        currentMyPosition.value = center;

        const existingFeature = myLocationSource.getFeatures()[0];
        if (existingFeature) {
          const geom = existingFeature.getGeometry();
          if (geom instanceof Point) {
            geom.setCoordinates(center);
          }
        } else {
          const feature = new Feature({ geometry: new Point(center) });
          feature.setStyle(myLocationStyle);
          myLocationSource.addFeature(feature);
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 0 }
  );
};

// 타입 단언(Assertion)을 사용하여 TS 에러 강제 해결
const moveToMyLocation = () => {
  const animateToPosition = (originalCenter: number[]) => {
    if (!map.value) return;

    const view = map.value.getView();
    const size = map.value.getSize();

    // Size가 없으면 동작 안 함
    if (!size) return;

    const targetZoom = 16;

    // "이건 무조건 숫자 배열 [x, y]야" 라고 TS에게 알림
    const [x, y] = originalCenter as [number, number];

    const mapHeight = size[1] as number;

    // resolution이 없으면 0으로 처리 (! 대신 || 0 사용)
    const resolution = view.getResolutionForZoom(targetZoom) || 0;

    const pixelOffset = mapHeight * 0.2;
    const offsetY = pixelOffset * resolution;

    // newCenter는 무조건 숫자 배열임을 명시
    const newCenter: [number, number] = [x, y - offsetY];

    view.animate({
      center: newCenter,
      zoom: targetZoom,
      duration: 1000,
      easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    });
  };

  if (currentMyPosition.value) {
    animateToPosition(currentMyPosition.value);
  }
  else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const center = fromLonLat([pos.coords.longitude, pos.coords.latitude]);
      currentMyPosition.value = center;
      animateToPosition(center);
    });
  } else {
    alert("위치 정보를 가져올 수 없습니다.");
  }
};

// 타입 단언(Assertion)을 사용하여 TS 에러 강제 해결
const flyToLocation = (lat: number, lng: number) => {
  if (!map.value) return;
  const view = map.value.getView();
  const targetZoom = 16;

  // 변환된 좌표는 무조건 [number, number] 형식이므로 단언
  const targetLocation = fromLonLat([lng, lat]) as [number, number];

  const size = map.value.getSize();
  if (!size) return;

  const mapHeight = size[1] as number;
  const pixelOffset = mapHeight * 0.2;
  const resolution = view.getResolutionForZoom(targetZoom) || 0;

  const offsetY = pixelOffset * resolution;

  // newCenter 타입 명시
  const newCenter: [number, number] = [targetLocation[0], targetLocation[1] - offsetY];

  const targetItem = props.scheduleItems.find(i => i.lat === lat && i.lng === lng);
  if (targetItem) {
    selectedItem.value = targetItem;
    overlay.value?.setPosition(targetLocation);
  }

  view.animate({
    center: newCenter,
    zoom: targetZoom,
    duration: 1000,
    easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  });
};

const closePopup = () => {
  overlay.value?.setPosition(undefined);
  selectedItem.value = null;
};

defineExpose({ flyToLocation });
</script>

<style scoped lang="scss">
.map-wrapper { width: 100%; height: 100%; position: relative; }
.map-container { width: 100%; height: 100%; background-color: #f0f0f0; position: absolute; z-index: 0; }

:deep(.ol-overlay-container) { z-index: 1000 !important; }
:deep(.ol-viewport) { z-index: 0 !important; }

/* 팝업 스타일 */
.popup-overlay {
  position: absolute;
  background: white;
  padding: 18px 18px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);

  width: max-content;
  max-width: 280px;
  text-align: center;

  /* [수정 2] pointer-events: auto (필수!) */
  /* 이제 말풍선은 마우스 이벤트를 "직접" 받습니다. (투명인간 해제) */
  pointer-events: auto;

  /* 중앙 정렬 */
  transform: translate(-50%, -100%);
  margin-top: -15px;
}

.popup-overlay::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 8px 8px 0;
  border-style: solid;
  border-color: white transparent transparent transparent;
}

.popup-content {
  position: relative;
  .popup-title { display: block; font-size: 0.95rem; color: #333; margin-bottom: 4px; white-space: pre-wrap; }
  .popup-desc { font-size: 0.8rem; color: #666; margin: 0; }

  .popup-close {
    position: absolute;
    top: -20px;
    right: -20px;
    background: none;
    border: none;
    color: #bbb;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 5px;
    line-height: 1;
    &:hover { color: #333; }
  }
}
/* [좌측 상단] 스타일 */
.map-controls-left {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000; /* 지도 위에 떠야 함 */
  display: flex;

  /* 그림자 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.map-controls-left button {
  background: white;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
}

.map-controls-left button:nth-child(1) {
  border-radius: 4px 0 0 4px;   /* 좌측만 둥글게 */
}

/* 두 번째 버튼 */
.map-controls-left button:nth-child(2) {
  border-radius: 0 4px 4px 0;   /* 우측만 둥글게 */
}

/* 활성화된 버튼 색상 (Vue 느낌의 녹색) */
.map-controls-left button.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

.my-location-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;

  /* 기존 버튼 꾸미기 스타일 유지 */
  background-color: white;
  border: none;
  border-radius: 24px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  width: 48px;
  height: 48px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.my-location-btn:hover {
  background-color: #f1f1f1;
}

.my-location-btn:active {
  background-color: #e6e6e6;
}

/* 내부 이미지(SVG) 사이즈 조절 */
.my-location-btn img {
  width: 32px;
  height: 32px;
  display: block;
}

</style>