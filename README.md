# 이더리움 블록체인 EVENTS 실시간 추적 백엔드 서비스

| 👉 목차                            |                                        |
| ---------------------------------- | -------------------------------------- |
| [1. 요구사항 분석](#요구사항-분석) | 각 요구사항 분석                       |
| [2. API 명세서](#API-명세서)       | swagger url                            |
| [3. 구현 과정](#구현-과정)         | 기술스택, 모델링, 폴더 구조, 작업 내역 |
| [4. 테스트](#테스트)               | 각 서비스 unit test / e2e test         |
| [5. 서비스 배포](#서비스-배포)     | service url 및 배포 화면               |

### 본 서비스는 이더리움 블록 체인의 스마트 컨트랙트에서 발생하는 이벤트를 구독하여 실시간으로 추적하여 저장하고, 구독한 이벤트를 조회할 수 있는 기능을 제공하는 백엔드 서비스 입니다.

## Introduction

`이더리움(Ethereum)`은 블록체인 기술을 기반으로 Smart Contract 기능을 구현하기 위한 분산 컴퓨팅 플랫폼입니다.
소프트웨어 애플리케이션이 블록체인 데이터를 읽거나 네트워크에 트랜잭션을 전송하여 이더리움 블록체임과 상호작용 하려면 이더리움 노드에 연결해야 합니다. 이를 위해 모든 이더리움 클라이언트는 `JSON-RPC specification`을 구현하므로, 특정 노드 또는 클라이언트 구현에 관계없이 애플리케이션이 이용할 수 있는 균일화된 메서드 집합이 있습니다.

`스마트 계약(Smart Contract)`는 계약 당사자가 사전에 협의한 내용을 미리 프로그래밍하여 전자 계약서 문서 안에 넣어두고, 이 계약 조건이 모두 충족되면 자동으로 계약 내용이 실행되도록 하는 시스템 입니다.
이더리움 블록체인의 스마트 컨트랙트에는 트랙잭션 중 로그를 남기는 기능(`Event`)이 있습니다. 해당 이벤트는 체인에 영구히 기록되며 이더리움 API를 사용해 이벤트 로그 데이터를 검색(쿼리)하여 가져올 수 있습니다.

이더리움 이벤트는 Topic과 Data로 구성됩니다.

- Topic: 이벤트를 추적하거나 쿼리할 때 사용되는 요소로 데이터베이스의 인덱스에 해당하는 개념입니다. 하나의 이벤트에 토픽은 한 개 이상 존재할 수 있어며, 첫 번째 토픽은 특별히 이벤트의 호출 시그니처(ex. `Transfer(address,address,uint256)`)를 `keccak256` 해시 함수로 해시한 Hex 값 입니다. (ex. `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`). 나머지 토픽들은 디벤트 내 각각 인자들 중 `indexed`가 붙은 인자들의 값입니다.
- data: 이벤트의 인자 중 `indexed` 키워드가 붙지 않은 인자들의 값은 모두 데이터에 포함됩니다. 쿼리/필터링 조건으로 사용 가능한 Topic과 달리, data는 쿼리 조건으로 상요 불가능하다는 차이점이 있습니다.

본 프로젝트에서는 이더리움 블록 체인과 상호작용 할 수 있는 기능을 제공하는 `ethers.js`를 사용하여 주어진 요구사항을 구현합니다.

본 프로젝트를 통해 Blcokchain Event와 연동된 Backend개발능력을 학습할 수 있는 역량이 있는지를 보여드리고자 합니다.

# 요구사항 분석

## 0. 특이사항

주어진 API 스펙에서 data type 변경

- `CreateSubscriptionRequestDto`의 `topics` type을 `string[]` 에서 `BLOCKCHAIN_EVENT_ENUM[]`으로 변경
- 변경 이유
  - 존재하지 않는 topic hash 값일 경우 오류 처리를 용이하게 하기 위함.
  - 존재하지 않는 topic hash 값일 경우 결과적으로 아무런 로그 정보도 저장되지 않을 것이며, 이 경우 요청 측에서 이 상황을 파악할 수 있도록 하는 것이 합리적이라고 판단.

```typescript
/**
 * 이벤트의 호출 시그 니처 (예시 - Transfer(address,address,uint256) ) 를 keccak256 해시 함수로 해시한 Hex 값
 */
export enum BLOCKCHAIN_EVENT_ENUM {
  TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  APPROVAL = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
  APPROVAL_FOR_ALL = "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31",
  PUNK_OFFERED = "0x3c7b682d5da98001a9b8cbda6c647d2c63d698a4184fd1d55e2ce7b66f5d21eb",
  PUNK_TRANSFER = "0x05af636b70da6819000c49f85b21fa82081c632069bb626f30932034099107d8",
}
```

## 1. 구독 관리 API

구독할 이더리움 체인 이벤트를 관리하는 API

### 1.1 구독 추가

`POST /subscriptions`

- Method: `POST`
- Request

  - Path: `/subsctiptions`
  - Content-Type: `application/json`
  - Schema

    ```typescript
    export class CreateSubscriptionsRequestDto {
      /**
       * 구독할 이벤트의 토픽
       */
      topics: BLOCKCHAIN_EVENT_ENUM[];
      /**
       * 이벤트를 구독할 스마트 컨트랙트의 주소
       */
      contractAddress: string;
    }
    ```

  - 예시

    ```json
    {
      "topics": [
        // Transfer(address,address,uint256) 이벤트
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      ],
      // ENS (Ethereum Name Service) 의 Smart Contract
      "contractAddress": "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85"
    }
    ```

- Response

  - Status Codes

    - `201 (Created)`
      - 구독 성공
    - `400 (Bad Request)`
      - 요청 Header나 Body가 잘못된 경우
    - `409 (Conflic)`
      - 서버에 이미 존재하는 구독인 경우

  - Headers
    - Contenty-Type: `application/json`
  - Body  
    응답코드 201인 경우의 응답 스키마 - 스키마

    ```typescript
    export class CreateSubscriptionsResponseDto {
      /** * 구독 id (:subscription-id) */
      id: number;

      /** * 구독한 이벤트의 토픽 */
      topics: string[];

      /** * 이벤트를 구독한 스마트 컨트랙트의 주소 */
      contractAddress: string;

      /** * 구독 생성일시. 서버에서는 Date 객체로 다루지만 응답은 string 으로 내려준다 */
      createdAt: Date;

      /** * 구독 최종 수정일시. 서버에서는 Date 객체로 다루지만 응답은 string 으로 내려준다 */
      updatedAt: Date;
    }
    ```

    - 예시

    ```json
    {
      "subscriptions": [
        {
          "id": 1,
          "topics": ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
          "contractAddress": "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
          "createdAt": "2022-08-09T15:50:50.123Z",
          "updatedAt": "2022-08-09T15:50:50.123Z"
        }
      ]
    }
    ```

### 1.2 구독 목록 조회

`GET /subscriptions`

- Request

  - Method: `GET`
  - Path: `/subscriptions`

- Response

  - Status Codes
    - 200 (OK)
      - 구독 목록 조회 성공
  - Headers
    - Content-Type: application/json
  - Body  
    응답코드 200인 경우의 응답 스키마

    - Schema
      ```typescript
      class SubscriptionInfo {
        id: number;
        topics: string[];
        contractAddress: string;
        createdAt: Date;
        updatedAt: Date;
      }
      export class ListSubscriptionsResponseDto {
        subscriptions: SubscriptionInfo[];
      }
      ```
    - 예시

      ```typescript
      {
        subscriptions: [
          {
            id: 1,
            topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
            contractAddress: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
            createdAt: "2022-08-09T15:50:50.123Z",
            updatedAt: "2022-08-09T15:50:50.123Z",
          },
        ];
      }
      ```

### 1.3 구독 정보 조회

`GET /subscriptions/:subscription-id`

- Request
  - Method: `GET`
  - Path: `/subscriptions/:subscription-id`
  - Parameters
    - `:subscription-id`
      - 정보를 조회할 구독 id
      - `number` 타입
- Response

  - Status Codes
    - `200 (OK)`
      - 구독 정보 조회 성공
    - `404 (Not Found)`
      - 존재하지 않는 subscription-id 인 경우
  - Headers
    - Content-Type: `application/json`
  - Body  
    응답 코드 200인 경우의 스키마

    - Schema

      ```typescript
      export class GetSubscriptionsResponseDto {
        id: number;
        topics: string[];
        contractAddress: string;
        createdAt: Date;
        updatedAt: Date;
        /**
         * 서버에 저장된 해당 구독의 로그 수
         */
        logSize: number;
        /**
         * 첫 번째 로그의 timestamp
         */
        firstLogTimestamp: Date | null;
      }
      ```

    - 예시
      ```json
      {
        "id": 1,
        "topics": ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
        "contractAddress": "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        "createdAt": "2022-08-09T15:50:50.123Z",
        "updatedAt": "2022-08-09T15:50:50.123Z",
        "logSize": 100,
        "firstLogTimestamp": "2022-08-09T15:55:10.321Z"
      }
      ```

### 1.4 구독 삭제

`DELETE /subscriptions/:subscription-id`

- Request
  - Method: `DELETE`
  - Path: `/subscriptions/:subscription-id`
  - Parameters
    - `:subscription-id`
      - 삭제할 구독 id
      - `number` 타입
- Response

  - Status Codes
    - `200 (OK)`
      - 구독 삭제 성공
    - `404 (Not Found)`
      - 존재하지 않는 subscription-id 인 경우
  - Headers
    - Content-type: `application/json`
  - Body  
    응답코드 200인 경우의 스키마

    - Schema

      ```typescript
      export class DeleteSubscriptionsResponseDto {
        id: number;
        topics: string[];
        contractAddress: string;
        createdAt: Date;
        updatedAt: Date;
        /**
         * 구독을 삭제한 일시. 서버에서는 Date 객체로 다루지만 응답은 string 으로 내려준다
         */
        deletedAt: Date;
      }
      ```

    - 예시

      ```json
      {
        "id": 1,
        "topics": ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
        "contractAddress": "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        "createdAt": "2022-08-09T15:50:50.123Z",
        "updatedAt": "2022-08-09T15:50:50.123Z",
        "deletedAt": "2022-08-10T10:10:10.010Z"
      }
      ```

## 2. 구독한 이벤트 로그 조회 API

구독한 이더리움 체인 이벤트의 로그를 조회하는 API

### 2.1 구독에서 발생한 로그 조회

`GET /subscriptions/:subscription-id/logs?sort=desc&start=1660060510323&end=&offset=0&limit=2`

- Request
  - Method: `GET`
  - Path: `/subscriptions/:subscription-id/logs`
  - Parameters
    - `:subscription-id`
      - 로그를 조회할 구독 id
      - `number` 타입
    - `sort`
      - 정렬 순서, 정렬 방법은 timestamp 기준으로 고정이며 오름차순, 내림차순 정렬만 선택이 가능하다.
      - 가능한 값들
        - desc (기본값)
        - asc
    - `start`
      - 조회할 로그의 timestamp 조건. 이 timestamp 보다 값이 크거나 같은 timestamp의 로그만 조회한다.
      - `number` 타입
      - 13 자리의 unix timestamp (밀리초)
      - 기본값 = null (제약 조건 없음)
    - `end`
      - 조회할 로그의 timestamp 조건. 이 timestamp 보다 값이 작은 timestamp의 로그만 조회한다.
      - `number` 타입
      - 13 자리의 unix timestamp (밀리초)
      - 기본값 = null (제약 조건 없음)
    - `offset`
      - pagination 조건
      - `number` 타입
      - 기본값: 0
    - `limit`
      - pagination 조건
      - `number` 타입
      - 기본값: 50
- Response

  - Status Codes

    - `200 (OK)`
      - 구독에서 발생한 로그 조회 성공
    - `400 (Bad Request)`
      - 쿼리 파라미터의 값이 잘못된 경우
    - `404 (Not Found)`
      - 존재하지 않는 subscription-id인 경우

  - Headers
    - Content-Type: `application/json`
  - Body  
    응답코드 200인 경우의 응답 스키마

    - Schema

      ```typescript
      class ChainEventLog {
        /**
         * 로그의 id. number 가 아니라 string (uuid) 형식도 좋습니다.
         */
        id: number;
        /**
         * 로그의 timestamp. 서버에서는 Date 객체로 다루지만 응답은 string 으로 내려준다
         */
        timestamp: Date;
        // 아래는 ethers.js 에서 내려주는 체인 이벤트 로그의 정보들입니다.
        // 아래 링크를 참고해주세요
        // https://github.com/ethersio/ethers.js/blob/608864fc3f00390e1260048a157af00378a98e41/packages/abstractprovider/src.ts/index.ts#L90_L104
        blockNumber: number;
        blockHash: string;
        transactionIndex: number;
        removed: boolean;
        address: string;
        data: string;
        topics: string[];
        transactionHash: string;
        logIndex: number;
      }

      export class GetSubscriptionLogsResponseDto {
        /**
         * 구독 id (:subscription-id)
         */
        id: number;

        /**
         * 서버에 저장된 해당 구독의 로그 수
         */
        logSize: number;

        /**
         * start, end 조건에 맞는 로그 수.
         */
        logSizeInCondition: number;

        /**
         * request 의 offset 파라미터 값
         */
        offset: number;

        /**
         * request 의 limit 파라미터 값
         */
        limit: number;

        /**
         * request 의 sort 파라미터 값
         */
        sort: "asc" | "desc";

        /**
         * request 의 start 파라미터 값. unix timestamp (밀리초. 13 자리)
         */
        start: number | null;

        /**
         * request 의 end 파라미터 값. unix timestamp (밀리10 자리)
         */
        end: number | null;

        /**
         * 조건에 해당하는 로그들
         */
        logs: ChainEventLog[];
      }
      ```

    - 예시

      ```json
      {
        "id": 1,
        "logSize": 3,
        "logSizeInCondition": 2,
        "offset": 0,
        "limit": 1,
        "sort": "desc",
        "start": 1660060510323,
        "end": null,
        "logs": [
          {
            "id": 2,
            "timestamp": "2022-08-09T15:55:10.325Z",
            "blockNumber": 15306727,
            "blockHash": "0x2706905c2c102de25f76455c41eef7c7b1e5c28ce17ed5b71d6ba82d1c53ade0",
            "transactionIndex": 191,
            "removed": false,
            "address": "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
            "data": "0x",
            "topics": [
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0x000000000000000000000000283af0b28c62c092c9727f1ee09c02ca627eb7f5",
              "0x000000000000000000000000d4e81e319647fd31c8c395f074eaed20b45c596f",
              "0x23d4a64676e5685bd29fddfa30830b2182a36b1dd8c40d2a80c5681ef6ab7e40"
            ],
            "transactionHash": "0x2a3aaca135066cc46dd0ebebbe261f145645aae06264c06f3f1553e74f965a10",
            "logIndex": 306
          }
        ]
      }
      ```

### 3. 사용자 인증 API

- [Authentication | NestJS - A progressive Node.js framework](https://docs.nestjs.com/security/authentication)
- 위 링크를 참고하여 API 인증 구현

`POST /auth/login`

### 4. API 문서

- [OpenAPI (Swagger) | NestJS - A progressive Node.js framework](https://docs.nestjs.com/openapi/introduction)
- 위 링크를 참고하여 API 문서를 `/docs` path에 보이게 구현

# API 명세서

swagger를 사용하여 제작한 API Docs

[👉 Swagger Docs 바로가기]() //TODO : link 수정

# 구현 과정

## 기술 스택

- Framework: <img
      src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white"
    />
- Database: <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white">
- ORM: <img
      src="https://img.shields.io/badge/TypeORM-262627?style=for-the-badge&logo=null&logoColor=white"
    />
- Blockchain Library: <img src="https://img.shields.io/badge/ethers.js-3C3C3D?style=for-the-badge&logo=null&logoColor=white">

## 환경 세팅

### 모델링

// TODO : modeling image

### 폴더 구조

```
realtime-ethereum-blockchain-events-tracking-backend-service/
├─ src/
│  ├─ auth/
│  ├─ chain-event-log/
│  ├─ common/
│  │  ├─ enums/
│  │  │  ├─ event.enum.ts
│  │  │  ├─ log.enum.ts
│  ├─ database/
│  ├─ subscriptions/
│  ├─ users/
│  ├─ app.controller.ts
│  ├─ app.module.ts
│  ├─ app.service.ts
│  ├─ main.ts
├─ test/
```

백엔드 서비스에 필요한 리소스들을 기준으로 폴더로 나누고, 각 폴더에 DTO 및 Entity를 작성하여 테이블 생성  
각 리소스 폴더에 module, controller, service, unit test가 정의되어 있음

- auth: 사용자 인증 리소스
- user: 유저 리소스
- common: enum, interface, type등 프로젝트에서 공통으로 사용되는 파일 저장
- database: 데이터베이스 리소스
- chain-event-log: 이더리움 Chain Event Log 리소스
- subscriptionms: 구독 리소스
- test: e2e 테스트

## 작업 내역

✔️ 서버 초기 세팅  
✔️ 구독 관리 API 구현  
✔️ 이벤트 추적 및 저장 기능 구현  
✔️ Swagger API Documentation  
✔️ Readme.md 작성  
⭐️ Unit test 수행 // TODO
⭐️ e2e test 수행 // TODO
⭐️ 배포 // TODO

# 테스트

## Unit Test

### 테스트 커버리지

// TODO

<!--
#### User Service

- 유저 생성 기능
- 유저 생성기 고유한 id 생성

### BossRaid Service

- 보스레이드 상태 조회

  - 보스레이드를 시작한 기록이 없다면 canEnter: true
  - 보스레이드를 플레이중인 유저가 있다면 canEnter: false
  - 시작한 시간으로부터 레이드 제한 시간 만큼 경과되었으면 canEnter: true

- 보스레이드 입장

  - 존재하지 않는 userId 로 요청시 예외 처리
  - 존재하지 않는 level 로 요청시 예외 처리
  - canEnter: false 일 때 입장 요청시 isEntered: false (입장 거부)

- 보스레이드 종료
  - 저장된 userId와 raidRecordId에 해당하는 user 불일치일 경우 예외처리
  - 존재하지 않는 raidRecordId일 경우 예외처리
  - 이미 종료된 레이드일 경우 예외 처리
  - 시작한 시간으로부터 레이드 제한시간이 지났다면 예외처리 -->

### 테스트 결과

// TODO

<!--
#### User Service

<img width="612" alt="스크린샷 2022-09-20 오전 3 10 18" src="https://user-images.githubusercontent.com/63445753/191086872-20c622bf-706f-4055-b32b-4b8f1738d4dc.png">

#### BossRaid Service

<img width="876" alt="스크린샷 2022-09-20 오전 3 09 55" src="https://user-images.githubusercontent.com/63445753/191086911-f041a4da-95bc-4854-bc67-06ab05caeb4e.png"> -->

## e2e Test

### 테스트 커버리지

// TODO

<!--
#### 보스레이드

- 보스레이드 입장 성공시 서버 응답값 검증
- 보스레이드 입장 실패시 서버 응답값 검증
- 보스레이드 종료시 level에 따른 score 반영 검증

#### 랭킹

- 랭킹 정보 조회 서버 응답값 검증 -->

### 테스트 결과

// TODO

<!--
<img width="862" alt="스크린샷 2022-09-21 오후 3 39 17" src="https://user-images.githubusercontent.com/63445753/191447376-749ee7a4-3f8d-4cf8-8b41-b826f0b3d0d7.png"> -->

# 서비스 배포

// TODO

<!--
NestJS Server: <img
      src="https://img.shields.io/badge/AWS EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white"
    />
Redis Cluster: <img
      src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"
    />
Database: <img
      src="https://img.shields.io/badge/Amazon RDS-FF9900?style=for-the-badge&logo=amazonrds&logoColor=white"
    />
<img
      src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white"
    />

### EC2 배포 화면

<img width="1678" alt="스크린샷 2022-09-20 오후 11 22 52" src="https://user-images.githubusercontent.com/63445753/191448074-a365c14a-d83c-4f4f-b009-842ea696ad5b.png">

### 서버 SSH 접속 화면

<img width="1218" alt="스크린샷 2022-09-21 오후 4 39 47" src="https://user-images.githubusercontent.com/63445753/191445974-6871e18c-5810-4c25-97aa-3ada5b83ed55.png">

### 보스레이드 상태조회 결과 화면

<img width="1678" alt="스크린샷 2022-09-20 오후 11 27 05" src="https://user-images.githubusercontent.com/63445753/191285577-fe9ec233-733f-456f-9c07-684d2f467b3a.png"> -->
