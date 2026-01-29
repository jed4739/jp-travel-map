<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="close">
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <div class="title-section">
            <span class="category-badge" :class="item.category.toLowerCase()">
              {{ item.category }}
            </span>
            <h3>{{ item.content }}</h3>
          </div>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <div class="modal-body">
          <div class="info-group">
            <label>위치 정보</label>
            <div class="address-box">
              <p class="address-text">{{ item.address || '상세 주소 정보가 없습니다.' }}</p>

              <div class="button-group">
                <button class="action-btn copy" @click="copyAddress" :class="{ copied: isCopied }">
                  {{ isCopied ? '복사완료!' : '주소 복사' }}
                </button>
                <button class="action-btn map" @click="openGoogleMap">
                  구글맵 보기
                </button>
              </div>
            </div>
          </div>

          <div class="info-group">
            <label>메모 & 체크</label>
            <textarea
                v-model="localNote"
                placeholder="예약번호, 꼭 먹을 메뉴, 주의사항 등을 적어두세요."
                rows="5"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="save-btn" @click="save">저장하기</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  item: any;
  loading: boolean;
}>();

const emit = defineEmits(['close', 'save']);

const localNote = ref('');
const isCopied = ref(false);

// 팝업이 열릴 때마다 부모의 note 데이터를 로컬 변수로 가져옴 (원본 훼손 방지)
watch(() => props.item, (newItem) => {
  if (newItem) {
    localNote.value = newItem.note || '';
    isCopied.value = false; // 복사 상태 초기화
  }
}, { immediate: true });

const close = () => {
  emit('close');
};

const save = () => {
  // 부모에게 변경된 내용 전달
  emit('save', { ...props.item, note: localNote.value });
  close();
};

const copyAddress = async () => {
  if (!props.item.address) return alert('복사할 주소가 없습니다.');

  try {
    await navigator.clipboard.writeText(props.item.address);
    isCopied.value = true;
    setTimeout(() => isCopied.value = false, 2000); // 2초 뒤 복귀
  } catch (err) {
    console.error('복사 실패', err);
    alert('복사에 실패했습니다.');
  }
};

const openGoogleMap = () => {
  const query = props.item.address || props.item.content; // 주소 없으면 이름으로 검색
  console.log(props.item)
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
};
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6); /* 배경 어둡게 */
  z-index: 10000; /* 최상단 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  background: white;
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .title-section {
    h3 {
      margin: 8px 0 0 0;
      font-size: 1.2rem;
      color: #333;
    }
    .category-badge {
      font-size: 0.7rem;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      background: #eee;
      color: #555;

      /* 기존 카테고리 컬러 재사용 */
      &.sight { background: #E3F2FD; color: #1565C0; }
      &.food { background: #E0F2F1; color: #00695C; }
      /* ... 기타 카테고리 컬러 ... */
    }
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #999;
  }
}

.modal-body {
  padding: 20px;

  .info-group {
    margin-bottom: 20px;

    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      color: #777;
      margin-bottom: 8px;
    }
  }
}

.address-box {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;

  .address-text {
    margin: 0 0 10px 0;
    font-size: 0.9rem;
    color: #444;
    word-break: break-all;
  }

  .button-group {
    display: flex;
    gap: 8px;

    .action-btn {
      flex: 1;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #ddd;
      background: white;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &.map {
        background: #4285F4;
        color: white;
        border-color: #4285F4;
      }
      &.copy.copied {
        background: #E8F5E9;
        color: #2E7D32;
        border-color: #C8E6C9;
      }
    }
  }
}

textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  resize: none;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #333;
  }
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;

  .save-btn {
    width: 100%;
    padding: 14px;
    background: #222;
    color: white;
    font-weight: bold;
    font-size: 1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;

    &:active {
      transform: scale(0.98);
    }
  }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>