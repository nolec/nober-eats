import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { Entity, Column, OneToMany } from 'typeorm';
import { CoreEntitiy } from '../../common/entities/core.entity';
import { Restaurant } from './restaurant.entity';

@InputType('CategoryInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Category extends CoreEntitiy {
  @Field()
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field(type => String)
  @Column()
  @IsString()
  coverImage: string;

  @Field(type => [Restaurant])
  @OneToMany(
    type => Restaurant,
    restaurant => restaurant.category,
  )
  restaurants: Restaurant[];
}
