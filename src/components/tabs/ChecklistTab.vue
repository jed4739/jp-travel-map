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
      <li v-for="item in checkItems" :key="item.id" :class="{ completed: item.checked }">
        <label class="check-label">
          <input type="checkbox" v-model="item.checked" @change="saveChecklist" />
          <span class="check-text">{{ item.text }}</span>
        </label>
        <button class="delete-btn" @click="deleteCheckItem(item.id)">×</button>
      </li>
    </ul>

    <div v-if="checkItems.length === 0" class="empty-msg">
      준비물을 추가해보세요! 🎒
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const newCheckItem = ref('');
const checkItems = ref<{ id: number; text: string; checked: boolean }[]>([]);

const loadChecklist = () => {
  const saved = localStorage.getItem('myChecklist');
  if (saved) {
    checkItems.value = JSON.parse(saved);
  } else {
    checkItems.value = [
      { id: 1, text: '여권 챙기기 🛂', checked: false },
      { id: 2, text: '돼지코 (110v) 🔌', checked: false },
    ];
  }
};

const saveChecklist = () => {
  localStorage.setItem('myChecklist', JSON.stringify(checkItems.value));
};

const addCheckItem = () => {
  if (!newCheckItem.value.trim()) return;
  checkItems.value.push({ id: Date.now(), text: newCheckItem.value, checked: false });
  newCheckItem.value = '';
  saveChecklist();
};

const deleteCheckItem = (id: number) => {
  checkItems.value = checkItems.value.filter(item => item.id !== id);
  saveChecklist();
};

onMounted(() => {
  loadChecklist();
});
</script>

<style scoped lang="scss">
.check-tab {
  padding-top: 10px;
  .input-area {
    display: flex; gap: 10px; margin-bottom: 20px;
    input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; &:focus { outline: none; border-color: #333; } }
    .add-btn { background: #333; color: white; border: none; width: 44px; border-radius: 8px; font-size: 1.5rem; cursor: pointer; }
  }
  .checklist {
    list-style: none; padding: 0; margin: 0;
    li {
      display: flex; align-items: center; justify-content: space-between; background: white; padding: 12px 16px; margin-bottom: 8px; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); transition: all 0.2s;
      &.completed { background: #f8f9fa; .check-text { text-decoration: line-through; color: #adb5bd; } }
      .check-label { display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer; input[type="checkbox"] { width: 20px; height: 20px; accent-color: #2962FF; } .check-text { font-size: 1rem; color: #333; } }
      .delete-btn { background: none; border: none; color: #e03131; font-size: 1.2rem; cursor: pointer; padding: 0 8px; }
    }
  }
  .empty-msg { text-align: center; color: #999; margin-top: 40px; }
}
</style>
