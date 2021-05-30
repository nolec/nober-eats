import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';
import {
  COOKED_ORDER,
  NEW_PENDING_ORDER,
  ORDER_UPDATES,
  PUB_SUB,
} from 'src/common/common.constant';
import { PubSub } from 'graphql-subscriptions';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: '레스토랑을 찾을 수 없습니다.',
        };
      }

      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          return {
            ok: false,
            error: '없는 메뉴를 선택하셨습니다.',
          };
        }
        let dishFinalPrice = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            dishOption => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice = dishOption.extra + dishFinalPrice;
            } else {
              const dishOptionChoice = dishOption.choices.find(
                optionChoice => optionChoice.name === itemOption.choice,
              );
              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishFinalPrice = dishOptionChoice.extra + dishFinalPrice;
                }
              }
            }
          }
        }
        orderFinalPrice = orderFinalPrice + dishFinalPrice;
        console.log(orderFinalPrice);
        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }
      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );
      this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: '주문에 실패했습니다.',
      };
    }
  }

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[] = [];
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: {
            customer: user,
            ...(status && { status }),
          },
          relations: ['items', 'items.dish'],
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            driver: user,
            ...(status && { status }),
          },
          relations: ['items', 'items.dish'],
        });
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurants.find({
          where: {
            owner: user,
          },
          relations: ['orders', 'orders.items', 'orders.items.dish'],
        });
        orders = restaurants.map(restaurant => restaurant.orders).flat(1);
        if (status) {
          orders = orders.filter(order => order.status === status);
        }
        console.log(orders);
      }
      return {
        ok: true,
        orders,
      };
    } catch (error) {
      return {
        ok: false,
        error: '주문내역이 없습니다.',
      };
    }
  }
  canSeeOrder(user: User, order: Order): boolean {
    let canSee = true;
    if (user.role === UserRole.Client && order.customerId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id) {
      canSee = false;
    }
    return canSee;
  }
  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        //eager 처리로 해놓고 너무 많은 것을 load하는 문제를 -> N + 1 problem 이라고 한다.
        //eager true 로 해줬고 relation 값들은 promise로 리턴 된다.
        // relations: ['restaurant', 'items', 'items.dish'],
      });
      if (!order) {
        return {
          ok: false,
          error: '주문내역이 없습니다.',
        };
      }
      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: '주문내역을 확인할 권한이 없습니다.',
        };
      }
      // if (
      //   order.customerId !== user.id &&
      //   order.driverId !== user.id &&
      //   order.restaurant.ownerId !== user.id
      // ) {
      //   return {
      //     ok: false,
      //     error: '주문내역을 확인할 권한이 없습니다.',
      //   };
      // }
      return {
        ok: true,
        order,
      };
    } catch (error) {
      return {
        ok: false,
        error: '주문내역이 없습니다.',
      };
    }
  }

  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          ok: false,
          error: '주문내역이 없습니다.',
        };
      }
      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: '권한이 없습니다.',
        };
      }
      let canEdit = true;
      if (user.role === UserRole.Client) {
        canEdit = false;
      }
      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          canEdit = false;
        }
      }
      if (user.role === UserRole.Delivery) {
        if (
          status !== OrderStatus.PickedUp &&
          status !== OrderStatus.Delivered
        ) {
          canEdit = false;
        }
      }
      if (!canEdit) {
        return {
          ok: false,
          error: '수정을 할 수 없습니다.',
        };
      }
      //저장된 전체의 데이터를 리턴하지 않고 업데이트 된 데이터만 리턴함
      await this.orders.save({
        id: orderId,
        status,
      });
      const newOrder = { ...order, status };
      if (user.role === UserRole.Owner) {
        if (status === OrderStatus.Cooked) {
          await this.pubSub.publish(COOKED_ORDER, {
            cookedOrders: newOrder,
          });
        }
      }
      await this.pubSub.publish(ORDER_UPDATES, { orderUpdates: newOrder });
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: '주문내역 수정에 실패했습니다.',
      };
    }
  }

  async takeOrder(
    driver: User,
    { id: orderId }: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          ok: false,
          error: '주문이 없습니다.',
        };
      }
      if (order.driver) {
        return {
          ok: false,
          error: '이미 등록된 드라이버가 있습니다.',
        };
      }
      //주문의 드라이버 등록
      await this.orders.save([{ id: orderId, driver }]);
      await this.pubSub.publish(ORDER_UPDATES, { ...order, driver });
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
      };
    }
  }
}
