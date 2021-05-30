import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntitiy } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@ObjectType('OrderItemOptionInputType', { isAbstract: true })
@InputType()
export class OrderItemOption {
  @Field(type => String)
  name: string;

  @Field(type => String, { nullable: true })
  choice?: string;
}

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

  @Field(type => [OrderItemOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options: OrderItemOption[];
}
