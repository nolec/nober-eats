import { Inject } from '@nestjs/common';
import { Args, Mutation, Resolver, Query, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import {
  COOKED_ORDER,
  NEW_PENDING_ORDER,
  ORDER_UPDATES,
  PUB_SUB,
} from 'src/common/common.constant';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderUpdatesInput } from './dtos/sub-order-updates.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './orders.service';

@Resolver(of => Order)
export class OrderResolver {
  constructor(
    private readonly orderService: OrderService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Mutation(returns => CreateOrderOutput)
  @Role(['Client'])
  createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.orderService.createOrder(customer, createOrderInput);
  }

  @Query(returns => GetOrdersOutput)
  @Role(['Any'])
  getOrders(
    @AuthUser() user: User,
    @Args('input') getOrdersInput: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    return this.orderService.getOrders(user, getOrdersInput);
  }

  @Query(returns => GetOrderOutput)
  @Role(['Any'])
  getOrder(
    @AuthUser() user: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    return this.orderService.getOrder(user, getOrderInput);
  }

  @Mutation(returns => EditOrderOutput)
  @Role(['Any'])
  editOrder(
    @AuthUser() user: User,
    @Args('input') editOrderInput: EditOrderInput,
  ) {
    return this.orderService.editOrder(user, editOrderInput);
  }

  @Subscription(returns => Order, {
    //여기서 필터는 서브스크립션을 진행할지 말지 판단, context = 우리가 만든 graphqlContext(여기서는 gurad에서 만든 것)
    filter: (
      //payload = publish의 결과값
      payload,
      variables,
      context,
    ) => {
      const {
        pendingOrders: { ownerId },
      } = payload;
      const {
        user: { id },
      } = context;
      if (ownerId !== id) {
        return false;
      }
      return true;
    },
    //사용자가 받는 데이터를 변경해주는 역할
    resolve: (payload, args, context, info) => {
      const {
        pendingOrders: { order },
      } = payload;

      return order;
    },
  })
  @Role(['Owner'])
  pendingOrders() {
    return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
  }

  @Subscription(returns => Order, {
    filter: (payload, variables, context) => {
      return true;
    },
    resolve: (payload, args, context, info) => {
      return;
    },
  })
  @Role(['Delivery'])
  cookedOrders() {
    return this.pubSub.asyncIterator(COOKED_ORDER);
  }

  @Subscription(returns => Order, {
    filter: (
      { orderUpdates: order }: { orderUpdates: Order },
      { input }: { input: OrderUpdatesInput },
      { user }: { user: User },
    ) => {
      if (
        user.id !== order.driverId &&
        user.id !== order.customerId &&
        user.id !== order.restaurant.ownerId
      ) {
        return false;
      }
      return order.id === input.id;
    },
    resolve: (payload, args, context, info) => {
      return;
    },
  })
  @Role(['Any'])
  orderUpdates(@Args('input') orderUpdatesInput: OrderUpdatesInput) {
    return this.pubSub.asyncIterator(ORDER_UPDATES);
  }

  @Mutation(returns => TakeOrderOutput)
  @Role(['Delivery'])
  takeOrder(
    @AuthUser() driver: User,
    @Args('input') takeOrderInput: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    return this.orderService.takeOrder(driver, takeOrderInput);
  }
}
