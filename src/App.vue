<template>
  <RouterView />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<style>
/* 전역 스타일은 보통 src/assets/main.css에 두지만,
  App.vue에 두어도 됩니다.
  앱 전체가 화면을 꽉 채우도록 설정합니다.
*/
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden; /* 스크롤바 숨김 (지도 앱 특성) */
}
</style>