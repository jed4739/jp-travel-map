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

        <template v-for="(item, index) in items" :key="index">

          <div v-if="isNewDay(index)" class="date-header">
            <span class="day-badge">{{ getDay(item.date) }}</span>
            <span class="date-text">{{ item.date }}</span>
          </div>

          <div
              class="schedule-item-wrapper"
              :class="{ 'is-alternative': isAlternative(item) }"
              @click="$emit('item-click', item)"
          >
            <div class="time-col">
              <div v-if="!isSameTimeAsPrev(index)" class="time-group">
                <span class="start-time">{{ getStartTime(item.timeRange) }}</span>
                <span class="end-time">{{ getEndTime(item.timeRange) }}</span>
              </div>
              <div v-else class="time-connector">↳</div>
            </div>

            <div class="timeline-col">
              <div class="line"></div>
              <div class="dot" :class="item.category.toLowerCase()"></div>
            </div>

            <div class="info-card">
              <div class="card-header">
                <span class="category-pill" :class="item.category.toLowerCase()">
                  {{ item.category }}
                </span>
                <span v-if="isAlternative(item)" class="alt-badge">Plan B</span>
              </div>

              <div class="title">{{ item.content }}</div>

              <div v-if="item.note" class="note-box">
                <span class="note-icon">⚠️</span>
                <span class="note-text">{{ item.note }}</span>
              </div>

              <div class="card-actions">
                <button class="detail-btn" @click.stop="openDetailPopup(item)">
                  <span>📝 메모 & 정보</span>
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div v-if="currentTab === 'check'" class="check-tab">
        <h3>준비물 체크리스트</h3>
      </div>

      <div v-if="currentTab === 'info'" class="info-tab">
        <h3>정보</h3>
      </div>
    </div>
  </div>

  <DetailPopup
      :is-open="isPopupOpen"
      :item="selectedItem"
      :loading="isPopupLoading"
      @close="isPopupOpen = false"
      @save="handleSaveMemo"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ScheduleItem } from '../composables/useSchedule';
import DetailPopup from './DetailPopup.vue';

const props = defineProps<{
  items: ScheduleItem[];
  loading: boolean;
}>();

defineEmits(['item-click']);

const tabs = [
  { id: 'schedule', label: '일정' },
  { id: 'check', label: '준비' },
  { id: 'info', label: '정보' },
];

const currentTab = ref('schedule');
const panelHeight = ref(45);
const isDragging = ref(false);
let startY = 0;
let startHeight = 0;

const isPopupOpen = ref(false);
const isPopupLoading = ref(false);
const selectedItem = ref<any>({});

// 1. 상세 정보 조회 API
const fetchDetailInfo = async (date: string, timeRange: string) => {
  // ?.로 접근하고 없으면 빈 문자열 반환
  const safeTimeRange = timeRange || '';
  const startTime = safeTimeRange.split(/~|\n/)[0]?.trim() || '';

  const params = new URLSearchParams({
    date: date,
    time: startTime
  }).toString();

  try {
    const response = await fetch(`/api/v1/schedules/detail?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Fetch Detail Error:', error);
    throw error;
  }
};

// 2. 팝업 열기 핸들러
const openDetailPopup = async (item: ScheduleItem) => {
  selectedItem.value = { ...item };
  isPopupOpen.value = true;
  isPopupLoading.value = true;

  try {
    const detailData = await fetchDetailInfo(item.date, item.timeRange);
    selectedItem.value = {
      ...selectedItem.value,
      address: detailData.address,
      note: detailData.note,
    };
  } catch (error) {
    console.error("상세 정보 로딩 실패");
  } finally {
    isPopupLoading.value = false;
  }
};

// 3. 메모 저장 API 핸들러
const handleSaveMemo = async (updatedItem: any) => {
  // 안전한 접근
  const safeTimeRange = updatedItem.timeRange || '';
  const startTime = safeTimeRange.split(/~|\n/)[0]?.trim() || '';

  try {
    const response = await fetch('/api/v1/schedules/memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: updatedItem.date,
        time: startTime,
        note: updatedItem.note
      })
    });

    if (!response.ok) throw new Error(`Save Failed: ${response.status}`);
    alert("저장되었습니다!");

    const target = props.items.find(i => i.date === updatedItem.date && i.timeRange === updatedItem.timeRange);
    if (target) {
      target.note = updatedItem.note;
    }
  } catch (error) {
    console.error('Save Error:', error);
    alert("저장에 실패했습니다.");
  }
};

const isNewDay = (index: number) => {
  if (index === 0) return true;
  const curr = props.items[index];
  const prev = props.items[index - 1];
  if (!curr || !prev) return true;
  return curr.date !== prev.date;
};

const isSameTimeAsPrev = (index: number) => {
  if (index === 0) return false;
  if (isNewDay(index)) return false;
  const prev = props.items[index - 1];
  const curr = props.items[index];
  if (!prev || !curr) return false;
  return prev.timeRange === curr.timeRange;
};

const isAlternative = (item: ScheduleItem) => {
  if (!item || !item.content) return false;
  return item.content.includes('(대안)') || item.content.includes('선택');
};

const getDay = (dateStr: string) => {
  if (!dateStr) return '';
  const match = dateStr.match(/\((.*?)\)/);
  return match ? match[1] : '';
};

// ?.trim() 및 || '' 추가로 undefined 방지
const getStartTime = (range: string) => {
  if (!range) return '';
  return range.split(/~|\n/)[0]?.trim() || '';
};

// ?.trim() 및 || '' 추가로 undefined 방지
const getEndTime = (range: string) => {
  if (!range || !range.includes('~')) return '';
  return range.split('~')[1]?.trim() || '';
};

const changeTab = (tabId: string) => {
  currentTab.value = tabId;
  if (panelHeight.value < 20) panelHeight.value = 45;
};

const startDrag = (e: TouchEvent) => {
  // 터치 객체가 있는지 확인 후 접근
  const touch = e.touches[0];
  if (touch) {
    isDragging.value = true;
    startY = touch.clientY;
    startHeight = panelHeight.value;
  }
};

const onDrag = (e: TouchEvent) => {
  if (!isDragging.value) return;
  // 터치 객체가 있는지 확인 후 접근
  const touch = e.touches[0];
  if (touch) {
    const currentY = touch.clientY;
    const deltaY = currentY - startY;
    const windowHeight = window.innerHeight;
    const deltaPercent = (deltaY / windowHeight) * 100;

    let newHeight = startHeight - deltaPercent;
    if (newHeight < 10) newHeight = 10;
    if (newHeight > 95) newHeight = 95;
    panelHeight.value = newHeight;
  }
};

const endDrag = () => {
  isDragging.value = false;
  const h = panelHeight.value;
  if (h < 25) panelHeight.value = 15;
  else if (h < 65) panelHeight.value = 45;
  else panelHeight.value = 90;
};
</script>

<style scoped lang="scss">

/* 기본 패널 스타일 */
.bottom-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 9999;
  background: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (min-width: 768px) {
    width: 400px;
    left: 20px;
    bottom: 20px;
    max-height: 90vh;
  }
}

.panel-handle-area {
  padding: 14px 0;
  display: flex;
  justify-content: center;
  cursor: grab;
  background: white;
  flex-shrink: 0;

  .panel-handle {
    width: 40px;
    height: 4px;
    background: #e0e0e0;
    border-radius: 10px;
  }
}

.tab-menu {
  display: flex;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;

  button {
    flex: 1;
    padding: 2px 0 12px 0;
    border: none;
    background: white;
    font-weight: 600;
    font-size: 18px;
    color: #999;
    cursor: pointer;

    &.active {
      color: #333;
      border-bottom: 2px solid #333;
    }
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding-left: 20px;
  padding-right: 20px;
  background: #f8f9fa; /* 아주 연한 회색 */
}

/* 타임라인 스타일 시작 */

.date-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(248, 249, 250, 0.95); /* 반투명 배경 */
  padding: 15px 0 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;

  .day-badge {
    background: #333;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
  }
  .date-text {
    font-weight: 800;
    font-size: 1.1rem;
    color: #222;
  }
}

.schedule-item-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
  position: relative;

  &.is-alternative {
    opacity: 0.85;
    .info-card {
      background: #f1f3f5;
      border: 1px dashed #ccc;
      box-shadow: none;
    }
  }
}

/* 1. 왼쪽 시간 컬럼 */
.time-col {
  width: 50px;
  flex-shrink: 0;
  text-align: right;
  padding-top: 5px;

  .time-group {
    display: flex;
    flex-direction: column;
  }
  .start-time {
    font-weight: 700;
    font-size: 1rem;
    color: #333;
  }
  .end-time {
    font-size: 0.75rem;
    color: #999;
    margin-top: 2px;
  }
  .time-connector {
    font-size: 1.5rem;
    color: #ccc;
    padding-right: 10px;
  }
}

/* 2. 중앙 타임라인 컬럼 */
.timeline-col {
  width: 16px;
  flex-shrink: 0;
  position: relative;
  display: flex;
  justify-content: center;

  .line {
    position: absolute;
    top: 5px;
    bottom: -20px;
    width: 2px;
    background: #e9ecef;
  }

  /* 동그라미 점 */
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ccc;
    z-index: 1;
    margin-top: 8px;
    border: 2px solid white;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.1);

    &.sight { background: #2962FF; }
    &.food { background: #00BFA5; }
    &.home { background: #6200EA; }
    &.shop { background: #C51162; }
    &.airport { background: #37474F; }
    &.cafe { background: #795548; }
  }
}

/* 3. 오른쪽 정보 카드 */
.info-card {
  flex: 1;
  background: white;
  padding: 12px 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: transform 0.1s;

  display: flex;
  flex-direction: column;

  &:active {
    transform: scale(0.98);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .category-pill {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 12px;
    background: #eee;
    color: #555;

    &.sight { background: #E3F2FD; color: #1565C0; }
    &.food { background: #E0F2F1; color: #00695C; }
    &.home { background: #F3E5F5; color: #7B1FA2; }
    &.shop { background: #FCE4EC; color: #C2185B; }
    &.airport { background: #ECEFF1; color: #455A64; }
    &.cafe { background: #EFEBE9; color: #5D4037; }
  }

  .alt-badge {
    font-size: 0.65rem;
    background: #aaa;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
  }

  .title {
    font-size: 0.95rem;
    font-weight: 600;
    color: #333;
    line-height: 1.4;
    white-space: pre-wrap;
  }

  .note-box {
    margin-top: 8px;
    background: #fff5f5;
    padding: 8px;
    border-radius: 6px;
    display: flex;
    gap: 6px;

    .note-icon { font-size: 0.8rem; }
    .note-text {
      font-size: 0.75rem;
      color: #e03131;
      line-height: 1.3;
      white-space: pre-wrap;
    }
  }

  .card-actions {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;

    .detail-btn {
      background: transparent;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 0.75rem;
      color: #868e96;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;

      &:hover {
        background: #f8f9fa;
        color: #333;
        border-color: #ced4da;
      }

      &:active {
        background: #e9ecef;
      }
    }
  }
}
</style>