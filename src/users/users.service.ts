import { Injectable } from "@nestjs/common";

export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: "john",
      password: "test123",
    },
    {
      userId: 2,
      username: "maria",
      password: "test321",
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }
}
