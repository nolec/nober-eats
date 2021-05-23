import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Restaurant } from '../entities/restaurant.entity';

//InputType은 하나의 Object 형식으로 인식
//ArgsType은 각자 분리된 형태를 직접적으로 인식
@InputType()
export class CreateRestaurantInputType extends PickType(Restaurant, [
  'name',
  'coverImage',
  'address',
]) {
  @Field(type => String)
  categoryName: string;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {}
