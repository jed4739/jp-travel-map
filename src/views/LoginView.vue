<template>
  <div class="login-bg">
    <div class="overlay"></div>

    <div class="login-card">
      <div class="card-content">
        <span class="trip-badge">D-Day Coming Soon</span>

        <h1 class="title">
          TOKYO <span class="highlight">2026</span>
        </h1>

        <p class="subtitle">
          설레는 도쿄 여행의 시작,<br/>
          팀원들과 함께 계획을 세워보세요.
        </p>

        <div class="btn-wrapper">
          <GoogleLogin
              :callback="handleLogin"
              popup-type="TOKEN"
              class="google-btn"
          />
        </div>
      </div>
    </div>

    <div class="footer-text">© 2026 Travel Squad Project. All rights reserved.</div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { GoogleLogin } from 'vue3-google-login';
import { jwtDecode } from 'jwt-decode';
import { api, setAccessToken } from '../utils/commonAPI';

const router = useRouter();

const handleLogin = async (response: any) => {
  try {
    const googleToken = response.credential;
    const decoded: any = jwtDecode(googleToken);

    // console.log("구글 유저 정보:", decoded);

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
      setAccessToken(data.accessToken);
      // alert는 디자인을 해치므로 제거하거나 토스트 메시지로 대체 권장
      // 여기서는 일단 흐름 유지를 위해 router 이동만
      await router.replace('/');
    } else {
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
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Noto+Sans+KR:wght@300;400;700&display=swap');

/* 1. 전체 배경 설정 (도쿄 야경) */
.login-bg {
  position: relative;
  width: 100%;
  height: 100vh;
  /* 도쿄 타워 야경 이미지 (Unsplash source) */
  background-image: url('https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1920&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Sans KR', sans-serif;
  overflow: hidden;
}

/* 2. 어두운 오버레이 (배경이 너무 밝으면 글씨가 안 보여서 깜) */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 40, 0.5));
  z-index: 1;
}

/* 3. 유리 질감 카드 (Glassmorphism) */
.login-card {
  position: relative;
  z-index: 2;
  width: 90%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.1); /* 반투명 흰색 */
  backdrop-filter: blur(20px); /* 뒤쪽 흐리게 (핵심) */
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 60px 40px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  text-align: center;

  /* 둥둥 떠있는 애니메이션 */
  animation: float 6s ease-in-out infinite;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 4. 타이포그래피 및 요소 디자인 */
.trip-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);

  /* 등장 애니메이션 */
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.2s forwards;
}

.title {
  font-family: 'Montserrat', sans-serif;
  font-size: 3.5rem;
  font-weight: 900;
  color: #fff;
  line-height: 1;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
  letter-spacing: -1px;

  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.4s forwards;
}

.title .highlight {
  color: #FF4081; /* 포인트 컬러 (네온 핑크) */
  display: block;
  font-size: 1.8rem;
  font-weight: 400;
  letter-spacing: 4px;
  margin-top: 5px;
}

.subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 40px;
  font-weight: 300;

  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.6s forwards;
}

.btn-wrapper {
  position: relative;
  /* 버튼 뒤에 빛나는 효과 */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    height: 80%;
    background: rgba(255, 255, 255, 0.3);
    filter: blur(20px);
    border-radius: 50%;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.5s;
  }

  &:hover::before {
    opacity: 1;
  }

  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.8s forwards;
}

.footer-text {
  position: absolute;
  bottom: 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
  z-index: 2;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

/* 반응형 (모바일 대응) */
@media (max-width: 480px) {
  .title { font-size: 2.8rem; }
  .title .highlight { font-size: 1.4rem; }
  .login-card { padding: 40px 20px; width: 85%; }
}
</style>
