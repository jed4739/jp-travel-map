const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'; // 개발용 기본값

// 액세스 토큰은 메모리 변수에 저장 (새로고침하면 날아감 -> 재발급 받으면 됨)
let accessToken = '';

export const setAccessToken = (token: string) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

// 커스텀 fetch 함수
export const api = async (url: string, options: RequestInit = {}) => {
    // 1. 헤더에 Access Token 탑재
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    } as Record<string, string>;

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // 2. 요청 전송
    // credentials: 'include'는 쿠키(Refresh Token)를 주고받기 위해 필수!
    let response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    // 3. [핵심] 401 Unauthorized (토큰 만료) 발생 시
    if (response.status === 401) {
        try {
            console.log("액세스 토큰 만료. 재발급 시도 중...");

            // 4. 재발급 API 호출 (쿠키에 있는 Refresh Token이 자동으로 감)
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!refreshRes.ok) {
                throw new Error('리프레시 토큰 만료');
            }

            // 5. 새 토큰 저장
            const data = await refreshRes.json();
            setAccessToken(data.accessToken);

            // 6. 실패했던 원래 요청 재시도 (새 토큰으로)
            headers['Authorization'] = `Bearer ${data.accessToken}`;
            response = await fetch(`${BASE_URL}${url}`, {
                ...options,
                headers,
                credentials: 'include',
            });

        } catch (error) {
            console.error("로그인 세션이 만료되었습니다.");
            // 로그아웃 처리 (메인으로 튕기거나 로그인 모달 띄우기)
            setAccessToken('');
            window.location.href = '/login'; // 로그인 페이지로 이동
            throw error;
        }
    }

    return response;
};