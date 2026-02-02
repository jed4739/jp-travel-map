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
      <ScheduleTab
          v-if="currentTab === 'schedule'"
          :items="items"
          :loading="loading"
          @refresh="$emit('refresh')"
          @item-click="(item) => $emit('item-click', item)"
      />

      <ChecklistTab v-if="currentTab === 'check'" />

      <InfoTab v-if="currentTab === 'info'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ScheduleItem } from '../composables/useSchedule';

// 분리된 컴포넌트 import
import ScheduleTab from './tabs/ScheduleTab.vue';
import ChecklistTab from './tabs/ChecklistTab.vue';
import InfoTab from './tabs/InfoTab.vue';

defineProps<{
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
/* 패널 껍데기 스타일만 남음 */
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
  background: #f8f9fa;
}
</style>
