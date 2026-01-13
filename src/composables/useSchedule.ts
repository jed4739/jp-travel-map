import { ref } from 'vue';
import Papa from 'papaparse';

// ==========================================
// 구글 시트 URL 및 헤더 매핑 정보
// ==========================================

// 1. 구글 시트 CSV URL (웹에 게시된 링크)
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTdvDTydKSw88q0PAvkotKGM7Vtasw_7ASXZa_4mcmXZ1rovFhZMoceN7p2-Wgb-6ppw2LA2SX8T_GO/pub?gid=0&single=true&output=csv';

// 2. 엑셀 헤더 이름 매핑 설정
// 좌측(Key): 코드에서 사용할 변수명
// 우측(Value): 실제 구글 시트의 1행(헤더) 이름
const SHEET_HEADERS = {
    date: '날짜',          // 날짜 컬럼 이름
    timeRange: '시간 범위', // 시간 컬럼 이름
    content: '내용',       // 장소명/내용 컬럼 이름
    lat: 'lat',           // 위도 컬럼 이름
    lng: 'lng',           // 경도 컬럼 이름
    category: 'category', // 카테고리 컬럼 이름
    note: '주의사항'       // 비고/메모 컬럼 이름
};

// ==========================================
// 코드 내부에서 사용할 데이터 구조
// ==========================================
export interface ScheduleItem {
    date: string;
    timeRange: string;
    content: string;
    lat: number;
    lng: number;
    category: string;
    note?: string;
}

// ==========================================
// 데이터 가져오기 및 파싱
// ==========================================
export function useSchedule() {
    const scheduleData = ref<ScheduleItem[]>([]);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);

    const fetchSchedule = async () => {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await fetch(GOOGLE_SHEET_URL);
            const csvText = await response.text();

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const rawData = results.data as any[];
                    const processedData: ScheduleItem[] = [];

                    // 병합된 날짜 셀 처리를 위한 변수
                    let lastDate = '';

                    rawData.forEach((row) => {
                        // 헤더 매핑 정보를 사용하여 데이터 접근
                        const dateVal = row[SHEET_HEADERS.date];
                        const latVal = row[SHEET_HEADERS.lat];
                        const lngVal = row[SHEET_HEADERS.lng];

                        // 1. 날짜가 있으면 갱신, 없으면 이전 날짜 사용 (병합 셀 대응)
                        if (dateVal && dateVal.trim() !== '') {
                            lastDate = dateVal;
                        }

                        // 2. 좌표 변환
                        const lat = parseFloat(latVal);
                        const lng = parseFloat(lngVal);

                        // 3. 유효한 좌표가 있는 데이터만 리스트에 추가
                        if (!isNaN(lat) && !isNaN(lng)) {
                            processedData.push({
                                date: lastDate, // 채워진 날짜 사용
                                timeRange: row[SHEET_HEADERS.timeRange] || '',
                                content: row[SHEET_HEADERS.content] || '',
                                lat: lat,
                                lng: lng,
                                category: row[SHEET_HEADERS.category] || 'DEFAULT',
                                note: row[SHEET_HEADERS.note] || ''
                            });
                        }
                    });

                    scheduleData.value = processedData;
                    console.log('Parsed Data:', scheduleData.value);
                },
                error: (err: Error) => {
                    throw err;
                }
            });
        } catch (err: any) {
            console.error('Data fetch error:', err);
            error.value = '일정 데이터를 불러오지 못했습니다.';
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