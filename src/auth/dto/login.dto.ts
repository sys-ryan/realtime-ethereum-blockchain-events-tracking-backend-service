import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ type: String, description: "사용자 계정 이름" })
  @IsString()
  username: string;

  @ApiProperty({ type: String, description: "사용자 계정 비밀번호" })
  @IsString()
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({ type: String, description: "API 인증을 위한 Token" })
  access_token: string;
}
