<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>

    <div class="map-controls-left">
      <button @click="changeMapType('terrain')" :class="{ active: currentLayer === 'terrain' }">2D지도</button>
      <button @click="changeMapType('satellite')" :class="{ active: currentLayer === 'satellite' }">위성지도</button>
    </div>

    <button class="my-location-btn" @click="moveToMyLocation">
      내 위치
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
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
// import OSM from 'ol/source/OSM';
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

// 파란색 점 스타일 (구글맵 현재위치 느낌)
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
    // 기본값: 지형도(p)
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
  })
});

// 내위치 추적용
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

  overlay.value = new Overlay({
    element: popupContainer.value,

    // JS 계산 끄고 왼쪽 위 기준으로 (CSS로 중앙 맞춤)
    positioning: 'top-left',
    offset: [0, 0],

    // stopEvent: true (필수!)
    // 의미: 말풍선을 클릭하면, 그 클릭이 지도로 전달되지 않게 막아라!
    stopEvent: true,
  });


  map.value = new Map({
    target: mapContainer.value,
    layers: [
      baseLayer,
      vectorLayer,
      myLocationLayer
    ],
    view: new View({
      center: fromLonLat([139.6917, 35.6895]), // 도쿄
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

      if (!item) return;

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
  // 내위치 추적
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

// 지도 타입(위성/지형) 변경 함수
const changeMapType = (type: 'terrain' | 'satellite') => {
  currentLayer.value = type;

  // 타입에 따라 URL 결정
  const newUrl = type === 'satellite'
      ? 'https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}' // 위성(s)+라벨(h)
      : 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';  // 지형도(p)

  // OpenLayers 방식: 기존 레이어의 소스(Source)만 샥 바꿔치기
  baseLayer.setSource(new XYZ({ url: newUrl }));
};

// 앱 켜지면 무조건 내위치로 이동: 내 위치를 계속 감시하고 파란 점만 찍음 (지도는 이동 안 함)
const startTracking = () => {
  if (!navigator.geolocation) return;

  // 기존 추적 해제 (중복 방지)
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);

  watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const center = fromLonLat([longitude, latitude]);

        // 1. 현재 위치 좌표를 변수에 저장 (버튼 누르면 여기로 가려고)
        currentMyPosition.value = center;

        // 2. 지도상에 파란 점(마커) 업데이트
        const existingFeature = myLocationSource.getFeatures()[0];
        if (existingFeature) {
          (existingFeature.getGeometry() as Point).setCoordinates(center);
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

// 내위치 버튼 클릭 시 실행: 저장된 내 위치로 '카메라만' 이동
const moveToMyLocation = () => {
  // 실제 이동을 수행하는 내부 함수 (Offset 로직 포함)
  const animateToPosition = (originalCenter: number[]) => {
    if (!map.value) return;

    const view = map.value.getView();
    const size = map.value.getSize();
    const targetZoom = 16; // 내 위치 줌 레벨 (flyToLocation과 동일하게 16 추천)

    let newCenter = originalCenter;

    if (size) {
      const mapHeight = size[1];
      // 화면 높이의 25% (flyToLocation과 동일한 비율)
      const pixelOffset = mapHeight * 0.25;

      // 해당 줌 레벨에서의 해상도(픽셀당 지도 거리)를 가져옴
      const resolution = view.getResolutionForZoom(targetZoom);

      // 픽셀 오프셋을 지도 좌표 오프셋으로 변환
      const offsetY = pixelOffset * resolution;

      // 카메라 중심을 Y축 아래로 내림 -> 결과적으로 아이콘은 화면 위로 올라감
      newCenter = [originalCenter[0], originalCenter[1] - offsetY];
    }

    view.animate({
      center: newCenter,
      zoom: targetZoom,
      duration: 1000,
      easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    });
  };

  // 1. 이미 추적된 위치가 있으면 바로 이동
  if (currentMyPosition.value) {
    animateToPosition(currentMyPosition.value);
  }
  // 2. 없으면 새로 조회해서 이동
  else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const center = fromLonLat([pos.coords.longitude, pos.coords.latitude]);
      // 조회된 위치도 저장해둠
      currentMyPosition.value = center;
      animateToPosition(center);
    });
  } else {
    alert("위치 정보를 가져올 수 없습니다.");
  }
};

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
/* [좌측 상단] 스타일 */
.map-controls-left {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000; /* 지도 위에 떠야 함 */
  display: flex;
  gap: 5px;
}

.map-controls-left button {
  background: white;
  border: 1px solid #ccc;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-weight: bold;
}

/* 활성화된 버튼 색상 (Vue 느낌의 녹색) */
.map-controls-left button.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

/* [우측 상단] 스타일 */
.my-location-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: white;
  border: 1px solid #ccc;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>