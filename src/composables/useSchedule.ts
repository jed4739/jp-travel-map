import { ref } from 'vue';

// ==========================================
// 데이터 타입 정의
// ==========================================
export interface ScheduleItem {
    date: string;       // 예: "2026.02.04 (수)"
    timeRange: string;  // 예: "12:30 ~ 14:00"
    content: string;    // 장소명
    lat: number;        // 위도
    lng: number;        // 경도
    category: string;   // 카테고리 (FOOD, SIGHT 등)
    note?: string;      // 리스트에 보여줄 간단한 메모
}

// ==========================================
// Composable 함수
// ==========================================
export function useSchedule() {
    // 반응형 상태 변수
    const scheduleData = ref<ScheduleItem[]>([]);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);

    // API 호출 함수
    const fetchSchedule = async () => {
        isLoading.value = true;
        error.value = null;

        try {
            // 1. API 요청 (GET /api/v1/schedules)
            // 개발 환경에서는 vite.config.ts의 proxy 설정이 필요할 수 있습니다.
            const response = await fetch('/api/v1/schedules', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // 필요 시 JWT 인증 헤더 추가: 'Authorization': `Bearer ${token}`
                }
            });

            // 2. HTTP 에러 체크
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            // 3. JSON 파싱
            const result = await response.json();

            // 4. 데이터 검증 및 할당
            // API 응답 구조가 { status: 'success', data: [...] } 형태라고 가정
            if (result.data && Array.isArray(result.data)) {
                scheduleData.value = result.data;
            } else if (Array.isArray(result)) {
                // 혹은 바로 배열이 오는 경우
                scheduleData.value = result;
            } else {
                throw new Error('Unexpected API response format');
            }

            console.log('Schedules Loaded:', scheduleData.value.length, 'items');

        } catch (err: any) {
            console.error('Failed to fetch schedules:', err);
            error.value = '일정 데이터를 서버에서 불러오지 못했습니다.';

            // (선택사항) 에러 시 빈 배열 처리
            scheduleData.value = [];
        } finally {
            isLoading.value = false;
        }
    };

    return {
        scheduleData,
        isLoading,
        error,
        fetchSchedule
    };
}