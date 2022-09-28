import { Controller, Get, HttpCode, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { AuthService } from "./auth/auth.service";
import { LoginDto, LoginResponseDto } from "./auth/dto/login.dto";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { LocalAuthGuard } from "./auth/local-auth.guard";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private authService: AuthService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiTags("Auth API")
  @ApiOperation({
    summary: "로그인 API",
    description: "유저 로그인을 통해 API 인증을 위한 jwt를 발급받습니다.",
  })
  @ApiOkResponse({
    description: "유저 로그인을 통해 API 인증을 위한 jwt를 발급받습니다.",
    type: LoginResponseDto,
  })
  @ApiBody({ type: LoginDto })
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post("auth/login")
  async login(@Request() req): Promise<LoginResponseDto> {
    return this.authService.login(req.user);
  }
}
