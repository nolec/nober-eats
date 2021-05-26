import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntitiy } from 'src/common/entities/core.entity';
import { Dish, DishOption } from 'src/restaurants/entities/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CoreEntitiy {
  @Field(type => Dish)
  @ManyToOne(
    type => Dish,
    //연결된 것이 삭제되면 NULL로 가능
    { onDelete: 'CASCADE', nullable: true },
  )
  dish: Dish;

  @Field(type => [DishOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options: DishOption[];
}
