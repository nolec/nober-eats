import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, ManyToOne, RelationId, OneToMany } from 'typeorm';
import { CoreEntitiy } from '../../common/entities/core.entity';
import { Category } from './category.entity';
import { Dish } from './dish.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntitiy {
  @Field()
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field(type => String)
  @Column()
  @IsString()
  coverImage: string;

  @Field()
  @Column()
  @IsString()
  address: string;

  @Field(type => Category, { nullable: true })
  @ManyToOne(
    type => Category,
    category => category.restaurants,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  category: Category;

  @Field(type => User)
  @ManyToOne(
    type => User,
    user => user.restaurants,
    { onDelete: 'CASCADE' },
  )
  owner: User;

  @Field(type => [Order])
  @OneToMany(
    type => Order,
    order => order.restaurant,
  )
  orders: Order[];

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @Field(type => [Dish])
  @OneToMany(
    type => Dish,
    dish => dish.restaurant,
  )
  menu: Dish[];
}
