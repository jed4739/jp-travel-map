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
        <div v-if="loading && items.length === 0" class="loading">로딩 중...</div>
        <div v-else-if="items.length === 0" class="empty">일정이 없습니다.</div>

        <template v-for="(item, index) in items" :key="index">

          <div v-if="isNewDay(index)" class="date-header">
            <div class="header-left">
              <span class="day-badge">{{ getDay(item.date) }}</span>
              <span class="date-text">{{ item.date }}</span>
            </div>

            <div class="header-right">
              <span class="last-updated">{{ timeAgo }}</span>

              <button
                  class="header-refresh-btn"
                  @click.stop="$emit('refresh')"
                  :disabled="loading"
                  aria-label="새로고침"
              >
                <img
                    :src="RefreshIcon"
                    class="refresh-icon"
                    :class="{ spinning: loading }"
                    alt="refresh"
                />
              </button>
            </div>
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
                  <span>메모 & 정보</span>
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <ChecklistTab v-if="currentTab === 'check'" />

      <InfoTab v-if="currentTab === 'info'" />
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
import { ref, watch, onMounted, onUnmounted } from 'vue';
import type { ScheduleItem } from '../composables/useSchedule';
import DetailPopup from './DetailPopup.vue';
import { api } from '../utils/commonAPI';
import RefreshIcon from '../assets/refresh.svg';
import InfoTab from "./tabs/InfoTab.vue";
import ChecklistTab from "./tabs/ChecklistTab.vue";

const props = defineProps<{
  items: ScheduleItem[];
  loading: boolean;
}>();

defineEmits(['item-click', 'refresh']);

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

/* 마지막 업데이트 시간 관리 로직 */
const lastUpdated = ref<Date>(new Date()); // 초기값: 현재 시간
const timeAgo = ref('방금 전');
let timer: ReturnType<typeof setInterval> | null = null;

// 시간 문구 업데이트 함수 ("1분 전", "2시간 전" 등)
const updateTimeLabel = () => {
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - lastUpdated.value.getTime()) / 1000);

  if (diffSeconds < 60) {
    timeAgo.value = '방금 전';
  } else if (diffSeconds < 3600) {
    timeAgo.value = `${Math.floor(diffSeconds / 60)}분 전`;
  } else {
    timeAgo.value = `${Math.floor(diffSeconds / 3600)}시간 전`;
  }
};

// 로딩 상태 감지: 로딩이 끝났을 때(true -> false) 시간 갱신
watch(() => props.loading, (newVal, oldVal) => {
  if (!newVal && oldVal) {
    lastUpdated.value = new Date();
    updateTimeLabel();
  }
});

onMounted(() => {
  // 1분마다 텍스트 갱신 (예: 59초 -> 1분 전)
  timer = setInterval(updateTimeLabel, 60000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});


// 1. 상세 정보 조회 API
const fetchDetailInfo = async (id: number) => {
  try {
    const response = await api(`/schedules/detail?id=${id}`);
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
    const detailData = await fetchDetailInfo(item.id);
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
  try {
    const response = await api('/schedules/memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: updatedItem.id,
        note: updatedItem.note
      })
    });

    if (!response.ok) throw new Error(`Save Failed: ${response.status}`);

    alert("저장되었습니다!");

    const target = props.items.find(i => i.id === updatedItem.id);
    if (target) {
      target.note = updatedItem.note;
    }

    isPopupOpen.value = false;
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

const getStartTime = (range: string) => {
  if (!range) return '';
  return range.split(/~|\n/)[0]?.trim() || '';
};

const getEndTime = (range: string) => {
  if (!range || !range.includes('~')) return '';
  return range.split('~')[1]?.trim() || '';
};

const changeTab = (tabId: string) => {
  currentTab.value = tabId;
  if (panelHeight.value < 20) panelHeight.value = 45;
};

const startDrag = (e: TouchEvent) => {
  const touch = e.touches[0];
  if (touch) {
    isDragging.value = true;
    startY = touch.clientY;
    startHeight = panelHeight.value;
  }
};

const onDrag = (e: TouchEvent) => {
  if (!isDragging.value) return;
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
  background: rgba(248, 249, 250, 0.95);
  padding: 15px 0 10px 0;

  /* 양쪽 정렬 (날짜 - 우측 묶음) */
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 10px;
  border-bottom: 1px solid #eee;

  /* 날짜 정보 (좌측 묶음) */
  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* 우측 묶음 (시간 텍스트 + 새로고침 버튼) */
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px; /* 텍스트와 버튼 사이 간격 */
  }

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

  /* 마지막 업데이트 텍스트 스타일 */
  .last-updated {
    font-size: 0.75rem;
    color: #868e96;
    font-weight: 500;
  }

  /* 새로고침 버튼 */
  .header-refresh-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }

    &:disabled {
      cursor: not-allowed;
    }

    .refresh-icon {
      width: 20px;
      height: 20px;

      /* 로딩 중 회전 애니메이션 */
      &.spinning {
        animation: spin 1s linear infinite;
        filter: invert(28%) sepia(98%) saturate(2334%) hue-rotate(218deg) brightness(98%) contrast(98%);
      }
    }
  }
}

/* 회전 키프레임 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ... (이하 Schedule item 및 Card 스타일 기존 동일) ... */
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
