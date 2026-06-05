import { Inject, Injectable } from '@nestjs/common';
import type { UserFilter, UserPublic } from '../interfaces/user.interface';
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

  execute(filter?: UserFilter): Promise<UserPublic[]> {
    return this.userRepository.findAll(filter);
  }
}
