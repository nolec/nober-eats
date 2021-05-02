import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constant';
import { JwtModuleOptions } from './jwt.interface';
import { JwtService } from './jwt.service';

@Module({})
@Global()
export class JwtModule {
  //다이나믹 모듈은 결국 다른 모듈을 리턴해준다.
  static forRoot(options: JwtModuleOptions): DynamicModule {
    return {
      //JwtModule 자신 모듈을 리턴해주고
      module: JwtModule,
      //JwtService도 User단에서 사용하고 싶으므로 exports (모듈이 서비스를 export)
      exports: [JwtService],
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        JwtService,
      ],
    };
  }
}
