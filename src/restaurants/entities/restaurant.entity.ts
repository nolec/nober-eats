import { ObjectType, Field } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Restaurant {
  @Field(() => Number)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field(() => Boolean, {
    nullable: true,
    description: '그래프 큐엘 기본값 true',
  })
  @Column({ default: true })
  @IsOptional()
  @IsBoolean()
  isVegan: boolean;

  @Field()
  @Column()
  @IsOptional()
  @IsString()
  address: string;

  @Field()
  @Column()
  @IsString()
  ownerName: string;

  @Field()
  @Column()
  @IsString()
  categoryName: string;
}
