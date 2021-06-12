import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntitiy } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntitiy {
  @Field(type => String)
  @Column()
  transactionId: string;

  @Field(type => User)
  @ManyToOne(
    type => User,
    user => user.payments,
  )
  user: User;

  @Field(type => Restaurant)
  //OneToMany가 다른 편에 없어도 ManyToOne은 생성할 수 있다.
  //레스토랑이 갖고 있는 payments 에 관심이 없기에
  @ManyToOne(type => Restaurant)
  restaurant: Restaurant;

  @RelationId((payment: Payment) => payment.user)
  userId: number;

  @Field(type => Int)
  @RelationId((payment: Payment) => payment.restaurant)
  restaurantId: number;
}
