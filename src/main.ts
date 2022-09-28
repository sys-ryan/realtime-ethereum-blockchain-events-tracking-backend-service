import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const PORT = process.env.PORT || 3000;
  const prefix = "/api/v1";

  const app = await NestFactory.create(AppModule);
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

  await app.listen(PORT);

  console.log(`server is running on http://localhost:${PORT}${prefix}`);
  console.log(`api docs: http://localhost:${PORT}${prefix}/docs`);
}
bootstrap();
