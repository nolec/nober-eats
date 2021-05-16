import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInputType,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInputType,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = await this.restaurants.save(
        this.restaurants.create(createRestaurantInput),
      );
      if (newRestaurant) {
        return {
          ok: true,
        };
      }
      return {
        ok: false,
        error: '레스토랑 생성에 실패하였습니다.',
      };
    } catch (error) {
      return {
        ok: false,
      };
    }
  }
  updateRestaurant({ id, data }: UpdateRestaurantDto) {
    return this.restaurants.update(id, { ...data });
  }
}
