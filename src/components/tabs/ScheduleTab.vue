<template>
  <div class="schedule-tab">
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

    <DetailPopup
        :is-open="isPopupOpen"
        :item="selectedItem"
        :loading="isPopupLoading"
        @close="isPopupOpen = false"
        @save="handleSaveMemo"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import type { ScheduleItem } from '../../composables/useSchedule'; // 경로 확인 필요
import DetailPopup from '../DetailPopup.vue'; // 경로 확인 필요
import { api } from '../../utils/commonAPI'; // 경로 확인 필요
import RefreshIcon from '../../assets/refresh.svg'; // 경로 확인 필요

const props = defineProps<{
  items: ScheduleItem[];
  loading: boolean;
}>();

const emit = defineEmits(['item-click', 'refresh']);

// --- 시간 업데이트 로직 ---
const lastUpdated = ref<Date>(new Date());
const timeAgo = ref('방금 전');
let timer: ReturnType<typeof setInterval> | null = null;

const updateTimeLabel = () => {
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - lastUpdated.value.getTime()) / 1000);
  if (diffSeconds < 60) timeAgo.value = '방금 전';
  else if (diffSeconds < 3600) timeAgo.value = `${Math.floor(diffSeconds / 60)}분 전`;
  else timeAgo.value = `${Math.floor(diffSeconds / 3600)}시간 전`;
};

watch(() => props.loading, (newVal, oldVal) => {
  if (!newVal && oldVal) {
    lastUpdated.value = new Date();
    updateTimeLabel();
  }
});

onMounted(() => { timer = setInterval(updateTimeLabel, 60000); });
onUnmounted(() => { if (timer) clearInterval(timer); });

// --- 팝업 로직 ---
const isPopupOpen = ref(false);
const isPopupLoading = ref(false);
const selectedItem = ref<any>({});

const fetchDetailInfo = async (id: number) => {
  const response = await api(`/schedules/detail?id=${id}`);
  const result = await response.json();
  return result.data;
};

const openDetailPopup = async (item: ScheduleItem) => {
  selectedItem.value = { ...item };
  isPopupOpen.value = true;
  isPopupLoading.value = true;
  try {
    const detailData = await fetchDetailInfo(item.id);
    selectedItem.value = { ...selectedItem.value, address: detailData.address, note: detailData.note };
  } catch (e) { console.error(e); } finally { isPopupLoading.value = false; }
};

const handleSaveMemo = async (updatedItem: any) => {
  try {
    await api('/schedules/memo', { method: 'POST', body: JSON.stringify({ id: updatedItem.id, note: updatedItem.note }) });
    alert("저장되었습니다!");
    // 부모의 데이터를 갱신하기 위해 refresh 이벤트를 쏘거나,
    // 여기서는 간단히 팝업만 닫습니다. (화면 갱신은 새로고침 버튼 권장)
    isPopupOpen.value = false;
  } catch (e) { alert("실패"); }
};

// --- 유틸 함수 ---
const isNewDay = (index: number) => index === 0 || props.items[index]?.date !== props.items[index - 1]?.date;
const isSameTimeAsPrev = (index: number) => index !== 0 && !isNewDay(index) && props.items[index - 1]?.timeRange === props.items[index]?.timeRange;
const isAlternative = (item: ScheduleItem) => item.content.includes('(대안)') || item.content.includes('선택');
const getDay = (s: string) => s.match(/\((.*?)\)/)?.[1] || '';
const getStartTime = (s: string) => s.split(/~|\n/)[0]?.trim() || '';
const getEndTime = (s: string) => s.split('~')[1]?.trim() || '';
</script>

<style scoped lang="scss">
/* 스케줄 관련 CSS 전부 여기로 이동 */
.schedule-tab { padding-bottom: 20px; }
.loading, .empty { text-align: center; padding: 20px; color: #999; }

/* 날짜 헤더 */
.date-header {
  position: sticky; top: 0; z-index: 10;
  background: rgba(248, 249, 250, 0.95);
  padding: 15px 0 10px 0;
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px; border-bottom: 1px solid #eee;

  .header-left { display: flex; align-items: center; gap: 8px; }
  .header-right { display: flex; align-items: center; gap: 8px; }

  .day-badge { background: #333; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; }
  .date-text { font-weight: 800; font-size: 1.1rem; color: #222; }
  .last-updated { font-size: 0.75rem; color: #868e96; font-weight: 500; }
  .header-refresh-btn {
    background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; opacity: 0.6; transition: opacity 0.2s;
    &:hover { opacity: 1; } &:disabled { cursor: not-allowed; }
    .refresh-icon { width: 20px; height: 20px; &.spinning { animation: spin 1s linear infinite; filter: invert(28%) sepia(98%) saturate(2334%) hue-rotate(218deg) brightness(98%) contrast(98%); } }
  }
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* 스케줄 아이템 */
.schedule-item-wrapper { display: flex; gap: 12px; margin-bottom: 15px; position: relative;
  &.is-alternative { opacity: 0.85; .info-card { background: #f1f3f5; border: 1px dashed #ccc; box-shadow: none; } } }

.time-col {
  width: 50px;
  flex-shrink: 0;
  text-align: right;
  padding-top: 5px;
  .time-group {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
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

.timeline-col { width: 16px; flex-shrink: 0; position: relative; display: flex; justify-content: center;
  .line { position: absolute; top: 5px; bottom: -20px; width: 2px; background: #e9ecef; }
  .dot { width: 12px; height: 12px; border-radius: 50%; background: #ccc; z-index: 1; margin-top: 8px; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
    &.sight { background: #2962FF; } &.food { background: #00BFA5; } &.home { background: #6200EA; } &.shop { background: #C51162; } &.airport { background: #37474F; } &.cafe { background: #795548; } }
}

.info-card { flex: 1; background: white; padding: 12px 15px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); cursor: pointer; transition: transform 0.1s; display: flex; flex-direction: column;
  &:active { transform: scale(0.98); }
  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .category-pill { font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 12px; background: #eee; color: #555;
    &.sight { background: #E3F2FD; color: #1565C0; } &.food { background: #E0F2F1; color: #00695C; } &.home { background: #F3E5F5; color: #7B1FA2; } &.shop { background: #FCE4EC; color: #C2185B; } &.airport { background: #ECEFF1; color: #455A64; } &.cafe { background: #EFEBE9; color: #5D4037; } }
  .alt-badge { font-size: 0.65rem; background: #aaa; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
  .title { font-size: 0.95rem; font-weight: 600; color: #333; line-height: 1.4; white-space: pre-wrap; }
  .note-box { margin-top: 8px; background: #fff5f5; padding: 8px; border-radius: 6px; display: flex; gap: 6px; .note-icon { font-size: 0.8rem; } .note-text { font-size: 0.75rem; color: #e03131; line-height: 1.3; white-space: pre-wrap; } }
  .card-actions { margin-top: 10px; display: flex; justify-content: flex-end; .detail-btn { background: transparent; border: 1px solid #e9ecef; border-radius: 6px; padding: 4px 10px; font-size: 0.75rem; color: #868e96; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s; &:hover { background: #f8f9fa; color: #333; border-color: #ced4da; } &:active { background: #e9ecef; } } }
}
</style>
