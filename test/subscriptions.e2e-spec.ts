import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";
import { setupApp } from "./setup-app";
import { response } from "express";
import { BLOCKCHAIN_EVENT_ENUM } from "../src/common/enums/event.enum";

describe("Subscriptions (e2e)", () => {
  let app: INestApplication;
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();

    token = (
      await request(app.getHttpServer()).post("/api/v1/auth/login").send({
        username: "john",
        password: "test123",
      })
    ).body.access_token;
  });

  const DAI_CONTRACT_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

  describe("구독 추가", () => {
    it("구독 추가 API response 데이터 검증", async () => {
      const response = (
        await request(app.getHttpServer())
          .post("/api/v1/subscriptions")
          .set("Authorization", `Bearer ${token}`)
          .send({
            topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
            contractAddress: DAI_CONTRACT_ADDRESS,
          })
      ).body;

      expect(response.topics).toHaveLength(1);
      expect(response.id).toBeDefined();
      expect(response.contractAddress).toEqual(DAI_CONTRACT_ADDRESS);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
    });
  });

  describe("구독 목록 조회", () => {
    it("구독 목록 조회 API 동작 테스트", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/subscriptions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
          contractAddress: DAI_CONTRACT_ADDRESS,
        });

      const response = (
        await request(app.getHttpServer())
          .get("/api/v1/subscriptions")
          .set("Authorization", `Bearer ${token}`)
      ).body;

      expect(response.subscriptions).toHaveLength(1);
    });
  });

  describe("구독 정보 조회", () => {
    it("구독 정보 조회 API pagination 테스트", async () => {
      // 구독 생성
      const subscription = (
        await request(app.getHttpServer())
          .post("/api/v1/subscriptions")
          .set("Authorization", `Bearer ${token}`)
          .send({
            topics: [BLOCKCHAIN_EVENT_ENUM.TRANSFER, BLOCKCHAIN_EVENT_ENUM.APPROVAL],
            contractAddress: DAI_CONTRACT_ADDRESS,
          })
      ).body;

      const response = (
        await request(app.getHttpServer())
          .get(`/api/v1/subscriptions/${subscription.id}`)
          .set("Authorization", `Bearer ${token}`)
      ).body;

      expect(response.id).toEqual(1);
      expect(response.topics).toHaveLength(2);
      expect(response.logSize).toBeDefined();
    });
  });

  describe("구독 제거", () => {
    it("구독 제거 API response 데이터 검증", async () => {
      // 구독 생성
      const subscription = (
        await request(app.getHttpServer())
          .post("/api/v1/subscriptions")
          .set("Authorization", `Bearer ${token}`)
          .send({
            topics: [BLOCKCHAIN_EVENT_ENUM.TRANSFER, BLOCKCHAIN_EVENT_ENUM.APPROVAL],
            contractAddress: DAI_CONTRACT_ADDRESS,
          })
      ).body;

      const response = (
        await request(app.getHttpServer())
          .delete(`/api/v1/subscriptions/${subscription.id}`)
          .set("Authorization", `Bearer ${token}`)
      ).body;

      expect(response.deletedAt).toBeDefined();
    });
  });

  describe("구독에서 발생한 로그 조회", () => {
    it("구독에서 발생한 로그 조회시 Query parameter validation 기능 검증", async () => {
      const subscription = (
        await request(app.getHttpServer())
          .post("/api/v1/subscriptions")
          .set("Authorization", `Bearer ${token}`)
          .send({
            topics: [BLOCKCHAIN_EVENT_ENUM.TRANSFER, BLOCKCHAIN_EVENT_ENUM.APPROVAL],
            contractAddress: DAI_CONTRACT_ADDRESS,
          })
      ).body;

      let response = (
        await request(app.getHttpServer())
          .get(`/api/v1/subscriptions/${subscription.id}/logs?sort=adsf`)
          .set("Authorization", `Bearer ${token}`)
      ).body;
      expect(response.error).toEqual("Bad Request");

      response = (
        await request(app.getHttpServer())
          .get(`/api/v1/subscriptions/${subscription.id}/logs?start=0`)
          .set("Authorization", `Bearer ${token}`)
      ).body;
      expect(response.error).toEqual("Bad Request");

      response = (
        await request(app.getHttpServer())
          .get(`/api/v1/subscriptions/${subscription.id}/logs?end=0`)
          .set("Authorization", `Bearer ${token}`)
      ).body;
      expect(response.error).toEqual("Bad Request");
    });

    it("query parameter 'start', 'end' default value 적용 검증", async () => {
      const subscription = (
        await request(app.getHttpServer())
          .post("/api/v1/subscriptions")
          .set("Authorization", `Bearer ${token}`)
          .send({
            topics: [BLOCKCHAIN_EVENT_ENUM.TRANSFER, BLOCKCHAIN_EVENT_ENUM.APPROVAL],
            contractAddress: DAI_CONTRACT_ADDRESS,
          })
      ).body;

      const response = (
        await request(app.getHttpServer())
          .get(`/api/v1/subscriptions/${subscription.id}/logs`)
          .set("Authorization", `Bearer ${token}`)
      ).body;
      expect(response.start).toBe(null);
      expect(response.end).toBe(null);
    });

    it("query parameter 'offset', 'limit' default value 적용 검증", async () => {
      const subscription = (
        await request(app.getHttpServer())
          .post("/api/v1/subscriptions")
          .set("Authorization", `Bearer ${token}`)
          .send({
            topics: [BLOCKCHAIN_EVENT_ENUM.TRANSFER, BLOCKCHAIN_EVENT_ENUM.APPROVAL],
            contractAddress: DAI_CONTRACT_ADDRESS,
          })
      ).body;

      const response = (
        await request(app.getHttpServer())
          .get(`/api/v1/subscriptions/${subscription.id}/logs`)
          .set("Authorization", `Bearer ${token}`)
      ).body;

      expect(response.offset).toEqual(0);
      expect(response.limit).toEqual(50);
    });
  });
});
