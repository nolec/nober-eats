import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';
import {
  CreateRestaurantInputType,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { User } from 'src/users/entities/user.entity';
import { AuthUser } from 'src/auth/auth-user.decorator';

@Resolver(of => Restaurant)
export class RestaurantsResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation(() => Boolean)
  createRestaurant(
    @Args('input') createRestaurantInput: CreateRestaurantInputType,
    @AuthUser() authUser: User,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }

  @Mutation(() => Boolean)
  async updateRestaurant(
    @Args('input') updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<boolean> {
    try {
      const value = await this.restaurantService.updateRestaurant(
        updateRestaurantDto,
      );
      console.log(value);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
