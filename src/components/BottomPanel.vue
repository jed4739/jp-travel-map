<template>
  <div
      class="bottom-panel"
      :style="{ height: panelHeight + '%', transition: isDragging ? 'none' : 'height 0.3s ease-out' }"
  >
    <div
        class="panel-handle-area"
        @touchstart="startDrag"
        @touchmove="onDrag"
        @touchend="endDrag"
    >
      <div class="panel-handle"></div>
    </div>

    <div class="tab-menu">
      <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ active: currentTab === tab.id }"
          @click="changeTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="panel-content">
      <div v-if="currentTab === 'schedule'" class="schedule-list">
        <div v-if="loading" class="loading">로딩 중...</div>
        <div v-else-if="items.length === 0" class="empty">일정이 없습니다.</div>

        <div
            v-else
            v-for="(item, index) in items"
            :key="index"
            class="schedule-item"
            @click="$emit('item-click', item)"
        >
          <div class="time-col">
            <span class="date">{{ item.date }}</span>
            <span class="time">{{ formatTime(item.timeRange) }}</span>
          </div>
          <div class="info-col">
            <div class="category-tag" :class="item.category.toLowerCase()">
              {{ item.category }}
            </div>
            <div class="title">{{ item.content }}</div>
            <div v-if="item.note" class="note">⚠️ {{ item.note }}</div>
          </div>
        </div>
      </div>

      <div v-if="currentTab === 'check'" class="check-tab">
        <h3>✅ 준비물 체크리스트</h3>
        <p>여권, 지갑, 돼지코 변압기...</p>
      </div>

      <div v-if="currentTab === 'info'" class="info-tab">
        <h3>ℹ️ 정보</h3>
        <p>숙소 정보 등...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ScheduleItem } from '../composables/useSchedule';

defineProps<{
  items: ScheduleItem[];
  loading: boolean;
}>();

defineEmits(['item-click']);

const tabs = [
  { id: 'schedule', label: '📅 일정' },
  { id: 'check', label: '✅ 준비' },
  { id: 'info', label: 'ℹ️ 정보' },
];

const currentTab = ref('schedule');
const panelHeight = ref(45); // 초기 높이 (45%)
const isDragging = ref(false);
let startY = 0;
let startHeight = 0;

// 탭 변경 시 패널이 너무 작으면 살짝 올려줌
const changeTab = (tabId: string) => {
  currentTab.value = tabId;
  if (panelHeight.value < 20) {
    panelHeight.value = 45;
  }
};

// 🖐 드래그 시작
const startDrag = (e: TouchEvent) => {
  isDragging.value = true;
  startY = e.touches[0].clientY; // 터치한 Y 좌표
  startHeight = panelHeight.value; // 현재 높이 (%)
};

// 🖐 드래그 중 (실시간 높이 계산)
const onDrag = (e: TouchEvent) => {
  if (!isDragging.value) return;

  const currentY = e.touches[0].clientY;
  const deltaY = currentY - startY; // 이동한 거리 (px)
  const windowHeight = window.innerHeight;

  // 픽셀을 퍼센트로 변환 (위로 올리면 deltaY가 마이너스이므로 빼줘야 높이가 늘어남)
  const deltaPercent = (deltaY / windowHeight) * 100;

  let newHeight = startHeight - deltaPercent;

  // 높이 제한 (최소 10% ~ 최대 95%)
  if (newHeight < 10) newHeight = 10;
  if (newHeight > 95) newHeight = 95;

  panelHeight.value = newHeight;
};

// 🖐 손 뗐을 때 (스냅 효과)
const endDrag = () => {
  isDragging.value = false;
  const h = panelHeight.value;

  // 가까운 위치로 자석처럼 붙기
  if (h < 25) {
    panelHeight.value = 15; // 최소 (탭만 보임)
  } else if (h < 65) {
    panelHeight.value = 45; // 중간 (지도+리스트 반반)
  } else {
    panelHeight.value = 90; // 최대 (리스트 꽉 채움)
  }
};

const formatTime = (raw: string) => {
  if (!raw) return '';
  return raw.split('\n')[0].replace('~', '').trim();
};
</script>

<style scoped lang="scss">
.bottom-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  /* height는 style 바인딩으로 제어 */
  background: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;

  /* 데스크탑 대응 */
  @media (min-width: 768px) {
    width: 400px;
    left: 20px;
    bottom: 20px;
    max-height: 90vh;
  }
}

.panel-handle-area {
  padding: 15px 0; /* 터치 영역 넉넉하게 */
  display: flex;
  justify-content: center;
  cursor: grab;
  background: #fff;
  flex-shrink: 0; /* 크기 줄어들지 않게 고정 */
  touch-action: none; /* 브라우저 기본 스크롤 막기 (드래그 전용) */

  .panel-handle {
    width: 40px;
    height: 5px;
    background: #e0e0e0;
    border-radius: 10px;
  }

  &:active {
    cursor: grabbing;
    background: #f5f5f5; /* 누르면 색 살짝 변하게 */
  }
}

.tab-menu {
  display: flex;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
  background: white;

  button {
    flex: 1;
    padding: 15px 0;
    border: none;
    background: none;
    font-weight: bold;
    color: #888;
    cursor: pointer;
    font-size: 1rem;

    &.active {
      color: #2979FF;
      border-bottom: 2px solid #2979FF;
    }
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto; /* 내용 많으면 내부 스크롤 */
  padding: 0 20px 20px 20px;
  background: #f9f9f9;
}

/* 리스트 아이템 스타일 (이전과 동일) */
.schedule-item {
  background: white;
  padding: 15px;
  margin-top: 15px; /* 간격 조정 */
  border-radius: 12px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  display: flex;
  gap: 15px;
  cursor: pointer;

  .time-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 50px;
    border-right: 1px solid #eee;
    padding-right: 15px;
    .date { font-size: 0.8rem; color: #888; }
    .time { font-weight: bold; font-size: 1.1rem; color: #333; }
  }

  .info-col {
    .category-tag {
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      background: #eee;
      display: inline-block;
      margin-bottom: 5px;
      font-weight: bold;

      &.sight { background: #E3F2FD; color: #1565C0; }
      &.food { background: #E0F2F1; color: #00695C; }
      &.home { background: #F3E5F5; color: #7B1FA2; }
      &.shop { background: #FCE4EC; color: #C2185B; }
      &.airport { background: #ECEFF1; color: #455A64; }
    }
    .title { font-weight: bold; margin-bottom: 4px; }
    .note { font-size: 0.8rem; color: #e53935; }
  }
}
</style>