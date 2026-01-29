<template>
  <div class="login-container">
    <h1>도쿄 여행 2026</h1>
    <p class="subtitle">구글 계정으로 간편하게 시작하세요</p>

    <GoogleLogin :callback="handleLogin" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { GoogleLogin } from 'vue3-google-login'; // 라이브러리 컴포넌트
import { jwtDecode } from 'jwt-decode'; // 토큰 해석용
import { api, setAccessToken } from '../utils/commonAPI'; // 아까 만든 api 함수 import

const router = useRouter();

// 구글 로그인이 성공하면 이 함수가 실행됩니다.
const handleLogin = async (response: any) => {
  try {
    const googleToken = response.credential;

    // 토큰 정보 해석
    const decoded: any = jwtDecode(googleToken);

    console.log("구글 유저 정보:", decoded);

    // api data
    const loginPayload = {
      email: decoded.email,
      displayName: decoded.name,
      uid: decoded.sub
    };

    const res = await api('/auth/google', {
      method: 'POST',
      body: JSON.stringify(loginPayload)
    });

    if (res.ok) {
      const data = await res.json();

      // 백엔드가 준 Access Token 저장
      setAccessToken(data.accessToken);

      /** Refresh Token은 백엔드가 Set-Cookie 헤더로 기입함.**/
      alert(`환영합니다, ${decoded.name}님!`);
      await router.replace('/'); // 메인으로 이동 (뒤로가기 방지 위해 replace 사용)
    } else {
      // 403 Forbidden (승인 대기 중 등) 처리
      const errData = await res.json();
      alert("로그인 실패: " + (errData.message || "알 수 없는 오류"));
    }

  } catch (error: any) {
    console.error("로그인 에러:", error);
    alert("서버 연결에 실패했습니다.");
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
  background-color: #f5f5f5; /* 배경색 살짝 추가 */
}

h1 {
  margin-bottom: 10px;
  color: #333;
}

.subtitle {
  margin-bottom: 30px;
  color: #666;
}

/* GoogleLogin 컴포넌트는 자체 스타일을 가지지만,
   컨테이너 정렬을 위해 필요시 추가 스타일링 가능 */
</style>