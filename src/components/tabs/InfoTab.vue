<template>
  <div class="info-tab">
    <div class="info-card">
      <div class="info-header">
        <span class="icon">🏠</span><span class="label">숙소 주소</span>
      </div>
      <div class="info-body">
        <p>〒136-0071 Tokyo, Koto City, Kameido</p>
        <p class="sub-text">(가메이도 역 앞)</p>
      </div>
      <button class="copy-btn" @click="copyToClipboard('〒136-0071 Tokyo, Koto City, Kameido')">주소 복사</button>
    </div>

    <div class="info-card warning">
      <div class="info-header"><span class="icon">🚨</span><span class="label">긴급 연락처</span></div>
      <div class="info-body">
        <p><strong>경찰서:</strong> 110</p>
        <p><strong>소방서:</strong> 119</p>
        <p><strong>대사관:</strong> +81-3-3452-7611</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const copyToClipboard = async (text: string) => {
  try { await navigator.clipboard.writeText(text); alert('주소가 복사되었습니다! 📋'); }
  catch (err) { alert('복사 실패'); }
};
</script>

<style scoped lang="scss">
.info-tab {
  padding-top: 10px; display: flex; flex-direction: column; gap: 15px;
  .info-card {
    background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 5px solid #2962FF;
    &.warning { border-left-color: #FF5252; }
    .info-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; .icon { font-size: 1.2rem; } .label { font-weight: 700; font-size: 1rem; color: #333; } }
    .info-body { p { margin: 4px 0; color: #555; font-size: 0.95rem; line-height: 1.5; } .sub-text { font-size: 0.8rem; color: #999; } }
    .copy-btn { margin-top: 12px; width: 100%; padding: 8px; background: #f1f3f5; border: none; border-radius: 6px; color: #495057; font-weight: 600; cursor: pointer; transition: background 0.2s; &:hover { background: #e9ecef; } }
  }
}
</style>
