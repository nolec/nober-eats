import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, ManyToOne } from 'typeorm';
import { CoreEntitiy } from '../../common/entities/core.entity';
import { Category } from './category.entity';

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
  @IsOptional()
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
  )
  owner: User;
}
