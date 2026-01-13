<template>
  <main class="home-view">
    <MapView
        ref="mapViewRef"
        :schedule-items="scheduleData"
        @marker-click="handleMarkerClick"
    />

    <BottomPanel
        :items="scheduleData"
        :loading="isLoading"
        @item-click="handleListClick"
    />
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MapView from '../components/MapView.vue';
import BottomPanel from '../components/BottomPanel.vue';
import { useSchedule, type ScheduleItem } from '../composables/useSchedule';

// 데이터 가져오기 훅 사용
const { scheduleData, isLoading, fetchSchedule } = useSchedule();

// 자식 컴포넌트(MapView) 제어용 변수
const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);

onMounted(() => {
  fetchSchedule(); // 데이터 로딩 시작
});

// 리스트 클릭 -> 지도 이동
const handleListClick = (item: ScheduleItem) => {
  if (!item.lat || !item.lng) return;
  // MapView가 노출(expose)한 flyToLocation 함수 실행
  mapViewRef.value?.flyToLocation(item.lat, item.lng);
};

// 마커 클릭 -> (필요 시 로직 추가)
const handleMarkerClick = (item: ScheduleItem) => {
  console.log("마커 클릭됨:", item.content);
};
</script>

<style scoped>
.home-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #eee;
}
</style>