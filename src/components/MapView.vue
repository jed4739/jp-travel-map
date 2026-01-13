<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>

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
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';
import type { ScheduleItem } from '../composables/useSchedule';

const props = defineProps<{
  scheduleItems: ScheduleItem[];
}>();

const emit = defineEmits(['marker-click']);

const mapContainer = ref<HTMLElement | null>(null);
const popupContainer = ref<HTMLElement | null>(null);
const map = ref<Map | null>(null);
const overlay = ref<Overlay | null>(null);
const selectedItem = ref<ScheduleItem | null>(null);
const vectorSource = new VectorSource();

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

  overlay.value = new Overlay({
    element: popupContainer.value,

    // [위치 설정] JS 계산 끄고 왼쪽 위 기준으로 (CSS로 중앙 맞춤)
    positioning: 'top-left',
    offset: [0, 0],

    // [수정 1] stopEvent: true (필수!)
    // 의미: 말풍선을 클릭하면, 그 클릭이 지도로 전달되지 않게 막아라!
    stopEvent: true,
  });

  map.value = new Map({
    target: mapContainer.value,
    layers: [ new TileLayer({ source: new OSM() }), vectorLayer ],
    view: new View({
      center: fromLonLat([139.6917, 35.6895]),
      zoom: 12,
    }),
    overlays: [overlay.value],
    controls: []
  });

  map.value.on('click', (e) => {
    // stopEvent: true 덕분에, 말풍선을 클릭했을 때는 이 함수가 실행되지 않습니다.
    // 즉, "빈 지도"를 클릭했을 때만 실행됩니다.
    const feature = map.value?.forEachFeatureAtPixel(e.pixel, (f) => f);

    if (feature) {
      const item = feature.get('data') as ScheduleItem;
      selectedItem.value = item;
      const coordinates = (feature.getGeometry() as Point).getCoordinates();
      overlay.value?.setPosition(coordinates);
      flyToLocation(item.lat, item.lng);
      emit('marker-click', item);
    }
    /* // 빈공간 클릭시 팝업 제거
    else {
      // 빈 곳을 클릭했으므로 닫기
      closePopup();
    }*/
  });
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

const flyToLocation = (lat: number, lng: number) => {
  if (!map.value) return;
  const view = map.value.getView();
  const targetZoom = 16;
  const targetLocation = fromLonLat([lng, lat]);

  const size = map.value.getSize();
  let offsetY = 0;
  if (size) {
    const mapHeight = size[1];
    const pixelOffset = mapHeight * 0.25;
    const resolution = view.getResolutionForZoom(targetZoom);
    offsetY = pixelOffset * resolution;
  }
  const newCenter = [targetLocation[0], targetLocation[1] - offsetY];

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
</style>