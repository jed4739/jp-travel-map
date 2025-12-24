# 🇯🇵 J-Travel Map (일본 여행 자료 한눈에 보기)

![Vue.js](https://img.shields.io/badge/vue-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![OpenLayers](https://img.shields.io/badge/OpenLayers-1F6BBA?style=for-the-badge&logo=OpenLayers&logoColor=white)

> **"지도는 시각적 중심, 정보는 직관적 관리"** > 흩어진 여행 정보를 한곳에 모으고, GPS 기반으로 '지금' 필요한 정보를 제공하는 개인 맞춤형 여행 지도 웹 애플리케이션입니다.

---

## 📖 목차 (Table of Contents)

1. [프로젝트 소개 (Introduction)](#-프로젝트-소개-introduction)
2. [개발 배경 및 목적 (Background & Motivation)](#-개발-배경-및-목적-background--motivation)
3. [핵심 기능 (Key Features)](#-핵심-기능-key-features)
4. [기술 스택 (Tech Stack)](#-기술-스택-tech-stack)
5. [프로젝트 구조 (Project Structure)](#-프로젝트-구조-project-structure)
6. [시작하기 (Getting Started)](#-시작하기-getting-started)
7. [UX/UI 설계 원칙 (Design Principles)](#-uxui-설계-원칙-design-principles)

---

## 📌 프로젝트 소개 (Introduction)

**J-Travel Map**은 일본 여행 중 발생할 수 있는 "정보의 파편화" 문제를 해결하기 위해 고안된 **모바일 중심의 싱글 페이지 애플리케이션(SPA)**입니다.

별도의 백엔드 서버 없이 **정적 데이터(JSON/GeoJSON)**만을 활용하여 운영 비용을 '0'으로 유지하면서도, **OpenLayers**와 **HTML5 Geolocation API**를 활용해 상용 지도 앱 수준의 위치 추적 및 경로 안내 경험을 제공합니다. 사용자는 현재 위치를 기반으로 숙소, 방문 예정지, 이동 경로를 지도 위에서 직관적으로 파악할 수 있습니다.

---

## 🚀 개발 배경 및 목적 (Background & Motivation)

이 프로젝트는 단순한 토이 프로젝트를 넘어, **개발자가 실제 사용자(End-user)가 되어 제품을 개선하는 Dogfooding** 경험을 목표로 시작되었습니다.

### 1. 정보 파편화 해결 (Problem Solving)
기존의 여행 준비 과정에서 **Discord(일정 논의)**와 **Google Spreadsheets(상세 정보)**를 오가며 데이터를 확인하는 경험은 매우 번거로웠습니다. 이를 하나의 인터페이스로 통합하여, 여행 중 불필요한 컨텍스트 스위칭을 제거하고자 했습니다.

### 2. 사용자 중심 개발 (Dogfooding)
"내가 쓸 제품을 내가 만든다"는 원칙 아래, 실제 일본 여행 현장에서 사용할 수 있는 수준의 **실용성과 안정성**을 최우선으로 고려했습니다.

### 3. 기술적 도전 (Technical Challenge)
* **TypeScript 도입:** 정적 타입 시스템을 통해 데이터 구조(장소, 일정 등)의 안정성을 확보하고 유지보수성을 높이고자 했습니다.
* **Vue.js 3 탐구:** "왜 Vue.js가 생산성이 높은가?"에 대한 답을 찾기 위해, Composition API와 Vite 생태계를 직접 경험하고 적용했습니다.

---

## 🌟 핵심 기능 (Key Features)

### 🗺️ 지도 중심 인터페이스 (Map-Centric UI)
* **실시간 위치 추적:** `watchPosition` API를 활용하여 사용자의 현재 위치를 실시간으로 갱신하고 지도에 반영합니다.
* **동적 경로 시각화:** 현재 위치에서 목적지까지의 직선거리 및 경로를 시각적으로 연결하여 방향성을 제시합니다.
* **스마트 마커:** 숙소, 방문 예정지, 중요 경유지 등을 역할별 색상 코드로 구분하여 표시합니다.

### 🗂️ 통합 정보 패널 (Bottom Panel)
지도의 맥락을 유지하면서 하단 패널을 통해 세부 정보를 관리합니다.
* **Ready (준비물):** 여권, 패스 등 필수 지참 물품 체크리스트.
* **Members (인원):** 여행 동반자 정보 및 역할 확인.
* **Schedule (일정):** 타임라인별 방문 장소 리스트 및 지도 연동.
* **Places (장소):** 저장된 장소 목록과 "지도에서 보기" 기능을 통한 즉각적인 포커싱.

### ⚡ 오프라인 퍼스트 & 고성능
* **Serverless:** 백엔드 없이 정적 배포되어 로딩 속도가 빠르며 서버 장애로부터 자유롭습니다.
* **Reactive Interaction:** Vue 3의 반응형 시스템을 통해 데이터 변경 시 UI가 즉각적으로 업데이트됩니다.

---

## 🛠 기술 스택 (Tech Stack)

| Category | Technology | Detail |
| :--- | :--- | :--- |
| **Language** | ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) | 정적 타입 지정, 인터페이스 정의 |
| **Framework** | ![Vue.js](https://img.shields.io/badge/-Vue.js%203-4FC08D?logo=vuedotjs&logoColor=white) | Composition API (`<script setup>`) |
| **Build Tool** | ![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white) | 초고속 HMR 및 빌드 환경 |
| **Map Engine** | ![OpenLayers](https://img.shields.io/badge/-OpenLayers-1F6BBA?logo=openlayers&logoColor=white) | 지도 렌더링 및 마커/레이어 관리 |
| **Map Data** | ![OSM](https://img.shields.io/badge/-OpenStreetMap-7EBC6F?logo=openstreetmap&logoColor=white) | 배경 지도 타일 데이터 |
| **Deploy** | ![GitHub Pages](https://img.shields.io/badge/-GitHub%20Pages-222222?logo=github&logoColor=white) | 정적 사이트 호스팅 |

---

## 🗓️ 향후 로드맵 (Roadmap)
여행 전까지 지속적으로 기능을 개선하여, 실제 도쿄 여행에서 완벽하게 동작하는 것을 목표로 합니다.

- **Phase 1 (현재):** 기본 지도 뷰어, JSON 데이터 연동, 하단 탭 UI 구현

- **Phase 2:** HTML5 Geolocation API 최적화 (배터리 소모 방지, 오차 범위 보정)

- **Phase 3:** PWA(Progressive Web App) 적용 (일본 현지 오프라인 환경 대비 캐싱 전략)