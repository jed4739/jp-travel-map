<template>
  <div class="check-tab">
    <div class="input-area">
      <input
          v-model="newCheckItem"
          @keyup.enter="addCheckItem"
          placeholder="준비물 입력 (예: 돼지코 어댑터)"
          type="text"
      />
      <button @click="addCheckItem" class="add-btn">+</button>
    </div>

    <ul class="checklist">
      <li
          v-for="item in sortedItems"
          :key="item.id"
          :class="{ completed: item.checked }"
      >
        <label class="check-label">
          <input type="checkbox" v-model="item.checked" @change="saveChecklist" />
          <span class="check-text">{{ item.text }}</span>
        </label>
        <button class="delete-btn" @click="deleteCheckItem(item.id)">×</button>
      </li>
    </ul>

    <div v-if="checkItems.length === 0" class="empty-msg">
      준비물을 추가해보세요!
    </div>

    <div class="reset-area">
      <button class="reset-btn" @click="resetChecklist">
        ↻ 초기값으로 되돌리기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

/* 초기 기본값 정의 (상수로 분리) */
const DEFAULT_ITEMS = [
  { id: 1, text: '여권 챙기기', checked: false },
  { id: 2, text: '돼지코 (110v)', checked: false },
  { id: 3, text: 'eSIM OR WIFI 도시락', checked: false },
  { id: 4, text: '동전지갑', checked: false },
  { id: 5, text: '비짓재팬웹', checked: false },
  { id: 6, text: '비상약', checked: false },
  { id: 7, text: '보조배터리', checked: false },
  { id: 8, text: '인천스마트패스', checked: false },
  { id: 9, text: '숙박자 명부 확인', checked: false },
  { id: 10, text: '숙소 체크인', checked: false },
  { id: 11, text: '숙소 체크아웃', checked: false },
];

const newCheckItem = ref('');
const checkItems = ref<{ id: number; text: string; checked: boolean }[]>([]);

// 자동 정렬을 위한 computed 속성
const sortedItems = computed(() => {
  // 원본 배열을 복사([...])하여 정렬
  return [...checkItems.value].sort((a, b) => {
    // 체크 여부가 다르면: 체크 안 된 것(false)이 앞으로(-1), 된 것(true)이 뒤로(1)
    if (a.checked !== b.checked) {
      return a.checked ? 1 : -1;
    }
    // 체크 여부가 같으면: id(시간) 순서대로 유지
    return 0;
  });
});

const loadChecklist = () => {
  const saved = localStorage.getItem('myChecklist');
  if (saved) {
    checkItems.value = JSON.parse(saved);
  } else {
    // 저장된 게 없으면 기본값 사용
    checkItems.value = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
  }
};

const saveChecklist = () => {
  localStorage.setItem('myChecklist', JSON.stringify(checkItems.value));
};

const addCheckItem = () => {
  if (!newCheckItem.value.trim()) return;

  checkItems.value.unshift({
    id: Date.now(),
    text: newCheckItem.value,
    checked: false
  });

  newCheckItem.value = '';
  saveChecklist();
};

const deleteCheckItem = (id: number) => {
  checkItems.value = checkItems.value.filter(item => item.id !== id);
  saveChecklist();
};

// 초기화 함수
const resetChecklist = () => {
  if (confirm('모든 준비물 목록이 사라지고 초기값으로 돌아갑니다.\n계속하시겠습니까?')) {
    // 깊은 복사로 기본값 재할당
    checkItems.value = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
    saveChecklist();
  }
};

onMounted(() => {
  loadChecklist();
});
</script>

<style scoped lang="scss">
.check-tab {
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  min-height: 100%;

  .input-area {
    display: flex; gap: 10px; margin-bottom: 20px;
    input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; &:focus { outline: none; border-color: #333; } }
    .add-btn { background: #333; color: white; border: none; width: 44px; border-radius: 8px; font-size: 1.5rem; cursor: pointer; }
  }

  .checklist {
    list-style: none; padding: 0; margin: 0; flex: 1; /* 남은 공간 차지 */
    li {
      display: flex; align-items: center; justify-content: space-between; background: white; padding: 12px 16px; margin-bottom: 8px; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); transition: all 0.3s ease; /* 애니메이션 추가 */

      &.completed {
        background: #f1f3f5;
        opacity: 0.7; /* 완료된 항목 흐리게 */
        .check-text { text-decoration: line-through; color: #adb5bd; }
      }

      .check-label { display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer; input[type="checkbox"] { width: 20px; height: 20px; accent-color: #2962FF; } .check-text { font-size: 1rem; color: #333; } }
      .delete-btn { background: none; border: none; color: #e03131; font-size: 1.2rem; cursor: pointer; padding: 0 8px; }
    }
  }

  .empty-msg { text-align: center; color: #999; margin-top: 40px; }

  /* 초기화 버튼 스타일 */
  .reset-area {
    margin-top: 30px;
    margin-bottom: 20px;

    .reset-btn {
      width: 100%;
      padding: 14px;
      background: white;
      border: 1px dashed #ccc;
      color: #888;
      border-radius: 12px;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #fff5f5;
        border-color: #ff8787;
        color: #e03131;
      }

      &:active {
        background: #ffe3e3;
      }
    }
  }
}
</style>
