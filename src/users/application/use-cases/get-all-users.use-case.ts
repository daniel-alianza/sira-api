import { Inject, Injectable } from '@nestjs/common';
import type { UserPublic } from '../interfaces/user.interface';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../interfaces/user.port';

@Injectable()
export class GetAllUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  execute(): Promise<UserPublic[]> {
    return this.userRepository.findAll();
  }
}
