import { Field, InputType, OmitType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';

//InputType은 하나의 Object 형식으로 인식
//ArgsType은 각자 분리된 형태를 직접적으로 인식
@InputType()
export class CreateRestaurantDto extends OmitType(
  Restaurant,
  ['id'],
  InputType,
) {}
