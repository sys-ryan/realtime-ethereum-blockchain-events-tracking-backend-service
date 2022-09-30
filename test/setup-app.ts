import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export const setupApp = (app: any) => {
  const PORT = process.env.PORT || 3000;
  const prefix = "/api/v1";

  app.setGlobalPrefix(prefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    })
  );

  const docsConfig = new DocumentBuilder()
    .setTitle("Realtime Ethereum(ETH) Blockchain Events Tracking Backend Service")
    .setDescription("실시간 Ethereum Blockchain 추적 백엔드 서비스")
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header" },
      "Authorization"
    )
    .build();

  const document = SwaggerModule.createDocument(app, docsConfig);
  SwaggerModule.setup(`${prefix}/docs`, app, document);
};
