import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { TransactionType } from '../util/interface.util';

enum Key {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
  PHONE = 'phone',
}
export class UserTransactionsDto {
  @IsEnum(TransactionType)
  @IsOptional()
  transactionType: TransactionType;
}

export class GetUserByDto {
  @IsNotEmpty()
  @IsEnum(Key)
  key: Key;

  @IsString()
  @IsNotEmpty()
  value: string;
}
