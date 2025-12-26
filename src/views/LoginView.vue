<template>
  <div class="login-container">
    <h1>✈️ 도쿄 여행 2026</h1>
    <button @click="handleLogin" :disabled="isLoggingIn">
      {{ isLoggingIn ? '로그인 중...' : '구글 아이디로 입장' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const router = useRouter();
const isLoggingIn = ref(false);

const handleLogin = async () => {
  isLoggingIn.value = true;
  try {
    await signInWithPopup(auth, googleProvider);
    router.replace('/');
  } catch (error: any) {
    alert("로그인 실패: " + error.message);
  } finally {
    isLoggingIn.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
button {
  padding: 15px 30px;
  font-size: 1.2rem;
  cursor: pointer;
  background: #2979FF;
  color: white;
  border: none;
  border-radius: 8px;
}
</style>