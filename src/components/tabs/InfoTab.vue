<template>
  <div class="info-tab">
    <div class="info-card">
      <div class="info-header">
        <span class="label">숙소 주소</span>
      </div>
      <div class="info-body">
        <p>〒136-0071 Tokyo, Koto City, Kameido, 1-chōme−38−14 Yskビル · 1-chōme-38-14 Kameido, Koto City, Tokyo 136-0071, Japan</p>
        <p class="sub-text">(가메이도 역 앞)</p>
      </div>
      <button class="copy-btn" @click="copyToClipboard('〒136-0071 Tokyo, Koto City, Kameido, 1-chōme−38−14 Yskビル · 1-chōme-38-14 Kameido, Koto City, Tokyo 136-0071, Japan')">주소 복사</button>
    </div>

    <div class="info-card second">
      <div class="info-header">
        <span class="label">숙소 상세정보</span>
      </div>
      <div class="info-body">
        <p><strong>가이드 링크:</strong> <a href="https://welcome-guide-2wa.pages.dev/rooms/k6kameido201?code=HMDYP5BNW2&lang=ko">https://welcome-guide-2wa.pages.dev/rooms/k6kameido201?code=HMDYP5BNW2&lang=ko</a></p>
        <p><strong>사전 짐보관:</strong> 오전 11시</p>
        <p><strong>체크인:</strong> 오후 4시</p>
        <p><strong>체크아웃:</strong> 오전 10시</p>
      </div>
    </div>

    <div class="info-card third">
      <div class="info-header">
        <span class="label">입국심사 및 준비물</span>
      </div>
      <div class="info-body">
        <p><strong>비짓재팬웹 링크:</strong> <a href="https://www.vjw.digital.go.jp/main/#/vjwplo001">https://www.vjw.digital.go.jp/main/#/vjwplo001</a></p>
        <p><strong>인천 스마트패스:</strong> 항공권 체크인 후 등록</p>
        <p><strong>eSIM:</strong> 일본 도착 후 eSIM 활성화 확인</p>
        <p><strong>기타:</strong> 여권, 기타신분증, 지갑은 수시로 확인</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const copyToClipboard = async (text: string) => {
  try { await navigator.clipboard.writeText(text); alert('주소가 복사되었습니다!'); }
  catch (err) { alert('복사 실패'); }
};
</script>

<style scoped lang="scss">
.info-tab {
  padding-top: 10px; display: flex; flex-direction: column; gap: 15px;
  .info-card {
    background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 5px solid #2962FF;
    &.second { border-left-color: #FF5252; }
    &.third { border-left-color: #ff5252; }
    .info-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; .icon { font-size: 1.2rem; } .label { font-weight: 700; font-size: 1rem; color: #333; } }
    .info-body { p { margin: 4px 0; color: #555; font-size: 0.95rem; line-height: 1.5; } .sub-text { font-size: 0.8rem; color: #999; } }
    .copy-btn { margin-top: 12px; width: 100%; padding: 8px; background: #f1f3f5; border: none; border-radius: 6px; color: #495057; font-weight: 600; cursor: pointer; transition: background 0.2s; &:hover { background: #e9ecef; } }
  }
}
</style>
